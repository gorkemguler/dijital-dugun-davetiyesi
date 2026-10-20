import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const scryptAsync = promisify(crypto.scrypt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.resolve(ROOT_DIR, 'src/data/weddingConfig.json');
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const AUTH_PATH = path.resolve(DATA_DIR, 'adminAuth.json');
const RSVP_PATH = path.resolve(DATA_DIR, 'rsvpSubmissions.json');
const ALBUM_META_PATH = path.resolve(DATA_DIR, 'albumMedia.json');
const NOTES_PATH = path.resolve(DATA_DIR, 'guestNotes.json');
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'uploads');

for (const dir of [DATA_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Allowed media MIME types and safe extensions (No SVG/HTML/JS allowed)
const ALLOWED_MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
};

const MAX_UPLOAD_BYTES = 250 * 1024 * 1024; // 250 MB per file (supports 4K videos)
const DEFAULT_MAX_ALBUM_ITEMS = 10000; // Up to 10,000 photos/videos on dedicated 64GB SD card
const DEFAULT_MAX_STORAGE_GB = 50; // 50 GB dedicated out of 64 GB SD card (~56-58 GiB usable, leaving ~6-8 GB for Raspberry Pi OS)
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,80}$/;

/**
 * Verifies the binary Magic Bytes (file header signature) of the first chunk
 * so attackers cannot spoof Content-Type headers to upload scripts/executables.
 */
function verifyMediaMagicBytes(buffer, ext) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (ext === '.jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (ext === '.png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WEBP: "RIFF" (0..3) + "WEBP" (8..11)
  if (ext === '.webp') {
    const riff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const webp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return riff && webp;
  }

  // MP4 / MOV / HEIC / HEIF: ISO Base Media File Format has 'ftyp' at bytes 4..7
  // or QuickTime 'moov' / 'wide' / 'mdat' atom at bytes 4..7
  if (ext === '.mp4' || ext === '.mov' || ext === '.heic' || ext === '.heif') {
    const atomType = buffer.subarray(4, 8).toString('ascii');
    return ['ftyp', 'moov', 'wide', 'mdat', 'free', 'skip'].includes(atomType);
  }

  // WEBM / MKV: EBML header 1A 45 DF A3
  if (ext === '.webm') {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  return false;
}

// Serialized async mutex queue to prevent concurrent JSON file write race conditions
let writeQueuePromise = Promise.resolve();
function runSerializedWrite(taskFn) {
  const next = writeQueuePromise.then(taskFn, taskFn);
  writeQueuePromise = next.catch(() => {});
  return next;
}

// Bounded Rate Limiting Maps with automatic cleanup to protect 2GB RAM
const loginAttempts = new Map();
const uploadAttempts = new Map();
const rsvpAttempts = new Map();
const MAX_TRACKED_IPS = 5000;

setInterval(() => {
  const now = Date.now();
  for (const map of [loginAttempts, uploadAttempts, rsvpAttempts]) {
    for (const [key, val] of map.entries()) {
      if (now > val.resetAt) map.delete(key);
    }
  }
}, 60 * 1000).unref();

function checkRateLimit(map, ip, maxCount, windowMs) {
  const now = Date.now();
  const record = map.get(ip);
  if (!record || now > record.resetAt) {
    if (map.size >= MAX_TRACKED_IPS) {
      const oldestKey = map.keys().next().value;
      if (oldestKey) map.delete(oldestKey);
    }
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxCount) {
    return false;
  }
  record.count += 1;
  return true;
}

function cleanString(str, maxLen = 300) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

async function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = await fsp.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJsonSafe(filePath, data) {
  const uniqueTmp = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fsp.writeFile(uniqueTmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  await fsp.rename(uniqueTmp, filePath);
}

async function getUploadsFolderSize() {
  try {
    const files = await fsp.readdir(UPLOADS_DIR);
    let total = 0;
    for (const file of files) {
      try {
        const st = await fsp.stat(path.join(UPLOADS_DIR, file));
        if (st.isFile()) total += st.size;
      } catch {
        // ignore
      }
    }
    return total;
  } catch {
    return 0;
  }
}

async function getAuthData() {
  const existing = await readJsonSafe(AUTH_PATH, null);
  if (existing && existing.SessionSecret) {
    return existing;
  }
  const initial = {
    isSetupCompleted: false,
    passwordSalt: '',
    passwordHash: '',
    SessionSecret: crypto.randomBytes(32).toString('hex'),
    updatedAt: new Date().toISOString(),
  };
  await writeJsonSafe(AUTH_PATH, initial);
  return initial;
}

async function hashPasswordAsync(password, salt) {
  const derivedKey = await scryptAsync(password, salt, 64);
  return Buffer.from(derivedKey).toString('hex');
}

async function verifyPasswordAsync(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actualHash = await hashPasswordAsync(password, salt);
  const aBuf = Buffer.from(actualHash, 'hex');
  const bBuf = Buffer.from(expectedHash, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function createAdminToken(secret) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const payload = `admin.${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  if (role !== 'admin') return false;
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return false;
  const payload = `${role}.${expStr}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    const aBuf = Buffer.from(sig, 'hex');
    const bBuf = Buffer.from(expectedSig, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('İstek boyutu çok büyük.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (!raw) return resolve({});
        const parsed = JSON.parse(raw, (key, value) => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return undefined;
          }
          return value;
        });
        resolve(parsed);
      } catch {
        reject(new Error('Geçersiz JSON verisi.'));
      }
    });
    req.on('error', reject);
  });
}

function getClientIp(req) {
  const remoteAddr = req.socket?.remoteAddress || '';
  const isLoopback =
    remoteAddr === '127.0.0.1' ||
    remoteAddr === '::1' ||
    remoteAddr === '::ffff:127.0.0.1';

  // Only trust proxy headers when coming from local cloudflared / reverse proxy
  if (isLoopback) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) return cfIp.trim().slice(0, 64);
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0].trim().slice(0, 64);
    }
  }
  return remoteAddr || 'unknown';
}

export async function handleApiAndUploads(req, res, next) {
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = urlObj.pathname;

  // 1. Serve uploaded media files safely from /uploads/*
  if (pathname.startsWith('/uploads/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      return res.end('Method Not Allowed');
    }

    const safeFilename = path.basename(pathname);
    if (
      !safeFilename ||
      safeFilename.includes('..') ||
      safeFilename !== pathname.slice('/uploads/'.length) ||
      !/^media-[a-zA-Z0-9_-]+\.(jpg|png|webp|heic|heif|mp4|mov|webm)$/.test(safeFilename)
    ) {
      res.statusCode = 400;
      return res.end('Bad Request');
    }

    const filePath = path.resolve(UPLOADS_DIR, safeFilename);
    if (!filePath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(filePath)) {
      res.statusCode = 404;
      return res.end('Not Found');
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    const stat = await fsp.stat(filePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox"
    );
    // Aggressive immutable caching so Cloudflare Tunnel edge caches media and saves your 50 Mbps upload!
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Accept-Ranges', 'bytes');

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        end < start ||
        start >= stat.size ||
        end >= stat.size
      ) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${stat.size}`);
        return res.end();
      }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', end - start + 1);
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Only handle /api/* routes below
  if (!pathname.startsWith('/api/')) {
    if (typeof next === 'function') return next();
    return false;
  }

  const authData = await getAuthData();
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const isAdmin = verifyAdminToken(bearerToken, authData.SessionSecret);

  // GET /api/state
  if (req.method === 'GET' && pathname === '/api/state') {
    const config = await readJsonSafe(CONFIG_PATH, {});
    const albumItems = await readJsonSafe(ALBUM_META_PATH, []);
    const savedNotes = await readJsonSafe(NOTES_PATH, null);
    const guestNotes = Array.isArray(savedNotes) ? savedNotes : config.initialGuestNotes || [];

    const visMode = config.albumVisibilityMode || 'moderated';
    let visibleAlbum = [];
    if (isAdmin) {
      visibleAlbum = albumItems;
    } else if (visMode === 'admin-only') {
      visibleAlbum = [];
    } else {
      visibleAlbum = albumItems.filter((item) => item.approved === true);
    }

    return sendJson(res, 200, {
      config,
      isSetupCompleted: !!authData.isSetupCompleted,
      isAdmin,
      albumItems: visibleAlbum,
      guestNotes,
    });
  }

  // POST /api/admin/login
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    const ip = getClientIp(req);
    if (!checkRateLimit(loginAttempts, ip, 6, 60 * 1000)) {
      return sendJson(res, 429, {
        error: 'Çok fazla başarısız giriş denemesi. Lütfen 1 dakika bekleyin.',
      });
    }

    try {
      const body = await readJsonBody(req, 16 * 1024);
      const password = typeof body.password === 'string' ? body.password.trim() : '';
      if (password.length < 4 || password.length > 128) {
        return sendJson(res, 400, {
          error: 'Yönetici şifresi 4 ile 128 karakter arasında olmalıdır.',
        });
      }

      if (!authData.isSetupCompleted || !authData.passwordHash) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await hashPasswordAsync(password, salt);
        await runSerializedWrite(async () => {
          authData.isSetupCompleted = true;
          authData.passwordSalt = salt;
          authData.passwordHash = hash;
          authData.updatedAt = new Date().toISOString();
          await writeJsonSafe(AUTH_PATH, authData);
        });

        const token = createAdminToken(authData.SessionSecret);
        return sendJson(res, 200, {
          token,
          isSetupCompleted: true,
          message: 'Yönetici şifreniz oluşturuldu ve giriş yapıldı.',
        });
      }

      const isValid = await verifyPasswordAsync(
        password,
        authData.passwordSalt,
        authData.passwordHash
      );
      if (!isValid) {
        return sendJson(res, 401, {
          error: 'Hatalı yönetici şifresi.',
        });
      }

      const token = createAdminToken(authData.SessionSecret);
      return sendJson(res, 200, {
        token,
        isSetupCompleted: true,
        message: 'Giriş başarılı.',
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message || 'İstek hatası.' });
    }
  }

  // POST /api/admin/change-password
  if (req.method === 'POST' && pathname === '/api/admin/change-password') {
    if (!isAdmin) {
      return sendJson(res, 401, { error: 'Yetkisiz işlem.' });
    }
    try {
      const body = await readJsonBody(req, 16 * 1024);
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';
      if (newPassword.length < 4 || newPassword.length > 128) {
        return sendJson(res, 400, { error: 'Yeni şifre en az 4 karakter olmalıdır.' });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await hashPasswordAsync(newPassword, salt);
      await runSerializedWrite(async () => {
        authData.passwordSalt = salt;
        authData.passwordHash = hash;
        authData.isSetupCompleted = true;
        authData.SessionSecret = crypto.randomBytes(32).toString('hex');
        authData.updatedAt = new Date().toISOString();
        await writeJsonSafe(AUTH_PATH, authData);
      });

      const token = createAdminToken(authData.SessionSecret);
      return sendJson(res, 200, {
        token,
        message: 'Yönetici şifresi güncellendi.',
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // POST /api/admin/save-config
  if (req.method === 'POST' && pathname === '/api/admin/save-config') {
    if (!isAdmin && authData.isSetupCompleted) {
      return sendJson(res, 401, {
        error: 'Ayarları kaydetmek için yönetici girişi yapmalısınız.',
      });
    }

    try {
      const body = await readJsonBody(req, 512 * 1024);
      if (!body || typeof body.config !== 'object' || Array.isArray(body.config)) {
        return sendJson(res, 400, { error: 'Geçersiz yapılandırma verisi.' });
      }

      let newToken = null;
      if (
        typeof body.adminPassword === 'string' &&
        body.adminPassword.trim().length >= 4 &&
        body.adminPassword.trim().length <= 128
      ) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await hashPasswordAsync(body.adminPassword.trim(), salt);
        await runSerializedWrite(async () => {
          authData.passwordSalt = salt;
          authData.passwordHash = hash;
          authData.isSetupCompleted = true;
          authData.updatedAt = new Date().toISOString();
          await writeJsonSafe(AUTH_PATH, authData);
        });
        newToken = createAdminToken(authData.SessionSecret);
      }

      await runSerializedWrite(async () => {
        await writeJsonSafe(CONFIG_PATH, body.config);
      });

      return sendJson(res, 200, {
        ok: true,
        isSetupCompleted: !!authData.isSetupCompleted,
        token: newToken,
        message: 'Davetiye ayarları sunucuya kaydedildi ve yayına alındı!',
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'Kaydetme hatası.' });
    }
  }

  // GET /api/admin/rsvps
  if (req.method === 'GET' && pathname === '/api/admin/rsvps') {
    if (!isAdmin && authData.isSetupCompleted) {
      return sendJson(res, 401, { error: 'Yetkisiz erişim.' });
    }
    const rsvps = await readJsonSafe(RSVP_PATH, []);
    return sendJson(res, 200, { rsvps });
  }

  // DELETE /api/admin/rsvps/:id
  if (req.method === 'DELETE' && pathname.startsWith('/api/admin/rsvps/')) {
    if (!isAdmin) return sendJson(res, 401, { error: 'Yetkisiz işlem.' });
    const id = pathname.slice('/api/admin/rsvps/'.length);
    if (!SAFE_ID_REGEX.test(id)) {
      return sendJson(res, 400, { error: 'Geçersiz kayıt kimliği.' });
    }
    const updated = await runSerializedWrite(async () => {
      const rsvps = await readJsonSafe(RSVP_PATH, []);
      const filtered = rsvps.filter((r) => r.id !== id);
      await writeJsonSafe(RSVP_PATH, filtered);
      return filtered;
    });
    return sendJson(res, 200, { ok: true, rsvps: updated });
  }

  // POST /api/rsvp
  if (req.method === 'POST' && pathname === '/api/rsvp') {
    const ip = getClientIp(req);
    if (!checkRateLimit(rsvpAttempts, ip, 12, 5 * 60 * 1000)) {
      return sendJson(res, 429, {
        error: 'Çok fazla LCV isteği gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.',
      });
    }

    try {
      const body = await readJsonBody(req, 32 * 1024);
      const fullName = cleanString(body.fullName, 90);
      if (!fullName) {
        return sendJson(res, 400, { error: 'Lütfen adınızı ve soyadınızı girin.' });
      }
      const relation = cleanString(body.relation, 60) || 'Davetli';
      const phone = cleanString(body.phone, 30);
      const attending = body.attending === 'no' ? 'no' : 'yes';
      const guestCount =
        attending === 'yes'
          ? Math.min(20, Math.max(1, Number(body.guestCount) || 1))
          : 0;
      const events = Array.isArray(body.events)
        ? body.events.map((e) => cleanString(e, 120)).filter(Boolean).slice(0, 15)
        : [];
      const cities = Array.isArray(body.cities)
        ? body.cities.map((c) => cleanString(c, 50)).filter(Boolean).slice(0, 10)
        : [];
      const needShuttle = !!body.needShuttle;
      const message = cleanString(body.message, 400);

      const newEntry = {
        id: `rsvp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        fullName,
        relation,
        phone,
        attending,
        guestCount,
        events,
        cities,
        needShuttle,
        message,
        createdAt: new Date().toISOString(),
      };

      const result = await runSerializedWrite(async () => {
        const rsvps = await readJsonSafe(RSVP_PATH, []);
        rsvps.unshift(newEntry);
        await writeJsonSafe(RSVP_PATH, rsvps.slice(0, 2000));

        let updatedNotes = null;
        if (message) {
          const config = await readJsonSafe(CONFIG_PATH, {});
          const existingNotes = await readJsonSafe(
            NOTES_PATH,
            config.initialGuestNotes || []
          );
          const noteItem = {
            id: `gn-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            name: fullName,
            relation,
            message,
            createdAt: new Intl.DateTimeFormat('tr-TR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date()),
            attendingCities: attending === 'yes' ? cities : [],
          };
          updatedNotes = [noteItem, ...existingNotes].slice(0, 200);
          await writeJsonSafe(NOTES_PATH, updatedNotes);
        }
        return updatedNotes;
      });

      return sendJson(res, 200, {
        ok: true,
        entry: newEntry,
        guestNotes: result,
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message || 'LCV gönderilemedi.' });
    }
  }

  // POST /api/album/upload
  if (req.method === 'POST' && pathname === '/api/album/upload') {
    const ip = getClientIp(req);
    if (!checkRateLimit(uploadAttempts, ip, 25, 60 * 1000)) {
      return sendJson(res, 429, {
        error: 'Çok fazla dosya yükleme isteği gönderildi. Lütfen 1 dakika bekleyin.',
      });
    }

    const config = await readJsonSafe(CONFIG_PATH, {});
    const requiredPin =
      typeof config.albumUploadPin === 'string' ? config.albumUploadPin.trim() : '';

    if (requiredPin) {
      let providedPin = '';
      try {
        providedPin = decodeURIComponent(String(req.headers['x-upload-pin'] || '')).trim();
      } catch {
        providedPin = '';
      }
      if (providedPin !== requiredPin) {
        return sendJson(res, 403, {
          error: 'Hatalı Masa / Albüm Yükleme Şifresi (PIN). Lütfen şifreyi kontrol edin.',
        });
      }
    }

    const rawMime = String(req.headers['x-mime-type'] || req.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    const ext = ALLOWED_MIME_EXT[rawMime];
    if (!ext) {
      return sendJson(res, 400, {
        error:
          'Desteklenmeyen dosya türü. Sadece fotoğraf (JPG, PNG, WEBP, HEIC) veya video (MP4, MOV, WEBM) yükleyebilirsiniz.',
      });
    }

    // Check SD Card Quota before accepting upload
    const maxAlbumItems =
      Number(config.maxAlbumItems) > 0 ? Number(config.maxAlbumItems) : DEFAULT_MAX_ALBUM_ITEMS;
    const maxStorageGB =
      Number(config.maxTotalStorageGB) > 0
        ? Number(config.maxTotalStorageGB)
        : DEFAULT_MAX_STORAGE_GB;
    const maxTotalStorageBytes = maxStorageGB * 1024 * 1024 * 1024;

    const existingAlbum = await readJsonSafe(ALBUM_META_PATH, []);
    if (existingAlbum.length >= maxAlbumItems) {
      return sendJson(res, 400, {
        error: `Albüm maksimum medya kapasitesine (${maxAlbumItems} adet) ulaştı.`,
      });
    }

    const currentFolderBytes = await getUploadsFolderSize();
    if (currentFolderBytes >= maxTotalStorageBytes) {
      return sendJson(res, 400, {
        error: `Sunucu SD kart depolama kotası (${maxStorageGB} GB) doldu.`,
      });
    }

    let uploaderName = 'Misafir';
    let caption = '';
    let eventTag = '';
    try {
      uploaderName =
        cleanString(decodeURIComponent(String(req.headers['x-uploader-name'] || '')), 80) ||
        'Misafir';
      caption = cleanString(
        decodeURIComponent(String(req.headers['x-caption'] || '')),
        240
      );
      eventTag = cleanString(
        decodeURIComponent(String(req.headers['x-event-tag'] || '')),
        80
      );
    } catch {
      // Fallback if malformed URI component in header
    }

    const fileId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const safeFilename = `media-${fileId}${ext}`;
    const targetPath = path.resolve(UPLOADS_DIR, safeFilename);
    const mediaType = rawMime.startsWith('video/') ? 'video' : 'image';

    try {
      await new Promise((resolve, reject) => {
        let bytesWritten = 0;
        let headerBuffer = Buffer.alloc(0);
        let magicVerified = false;
        let aborted = false;
        const writeStream = fs.createWriteStream(targetPath, { flags: 'wx' });

        const cleanupAndReject = (errObj) => {
          if (aborted) return;
          aborted = true;
          writeStream.destroy();
          fs.unlink(targetPath, () => {});
          reject(errObj);
        };

        req.on('data', (chunk) => {
          if (aborted) return;
          bytesWritten += chunk.length;
          if (bytesWritten > MAX_UPLOAD_BYTES) {
            cleanupAndReject(new Error('Dosya boyutu 250 MB sınırını aşıyor.'));
            return;
          }

          // Verify Magic Bytes from the first 16 bytes
          if (!magicVerified) {
            headerBuffer = Buffer.concat([headerBuffer, chunk]);
            if (headerBuffer.length >= 16) {
              if (!verifyMediaMagicBytes(headerBuffer, ext)) {
                cleanupAndReject(
                  new Error('Dosya içeriği geçerli bir fotoğraf veya video imzası taşımıyor.')
                );
                return;
              }
              magicVerified = true;
            }
          }

          writeStream.write(chunk);
        });

        req.on('end', () => {
          if (aborted) return;
          if (!magicVerified && !verifyMediaMagicBytes(headerBuffer, ext)) {
            cleanupAndReject(new Error('Geçersiz veya bozuk medya dosyası.'));
            return;
          }
          writeStream.end();
        });

        writeStream.on('finish', () => {
          if (aborted) return;
          if (bytesWritten < 64) {
            cleanupAndReject(new Error('Boş veya geçersiz medya dosyası.'));
            return;
          }
          resolve(bytesWritten);
        });

        writeStream.on('error', (err) => cleanupAndReject(err));
        req.on('error', (err) => cleanupAndReject(err));
      });

      const visMode = config.albumVisibilityMode || 'moderated';
      const autoApprove = visMode === 'public-auto';

      const newMediaItem = {
        id: `alb-${fileId}`,
        url: `/uploads/${safeFilename}`,
        mediaType,
        mimeType: rawMime,
        uploaderName,
        caption,
        eventTag,
        approved: autoApprove,
        createdAt: new Date().toISOString(),
      };

      await runSerializedWrite(async () => {
        const albumItems = await readJsonSafe(ALBUM_META_PATH, []);
        albumItems.unshift(newMediaItem);
        await writeJsonSafe(ALBUM_META_PATH, albumItems);
      });

      return sendJson(res, 200, {
        ok: true,
        item: newMediaItem,
        visibilityMode: visMode,
      });
    } catch (err) {
      return sendJson(res, 400, {
        error: err.message || 'Medya yüklenirken hata oluştu.',
      });
    }
  }

  // GET /api/admin/album -> Fetch all album items (including pending moderation) + SD card storage stats
  if (req.method === 'GET' && pathname === '/api/admin/album') {
    if (!isAdmin && authData.isSetupCompleted) {
      return sendJson(res, 401, { error: 'Yetkisiz erişim.' });
    }
    const config = await readJsonSafe(CONFIG_PATH, {});
    const albumItems = await readJsonSafe(ALBUM_META_PATH, []);
    const usedBytes = await getUploadsFolderSize();
    const maxStorageGB =
      Number(config.maxTotalStorageGB) > 0
        ? Number(config.maxTotalStorageGB)
        : DEFAULT_MAX_STORAGE_GB;
    const maxAlbumItems =
      Number(config.maxAlbumItems) > 0 ? Number(config.maxAlbumItems) : DEFAULT_MAX_ALBUM_ITEMS;

    return sendJson(res, 200, {
      albumItems,
      storageStats: {
        usedBytes,
        maxStorageGB,
        maxAlbumItems,
      },
    });
  }

  // PATCH /api/admin/album/:id -> Approve or hide a photo/video
  if (req.method === 'PATCH' && pathname.startsWith('/api/admin/album/')) {
    if (!isAdmin && authData.isSetupCompleted) {
      return sendJson(res, 401, { error: 'Yetkisiz işlem.' });
    }
    const id = pathname.slice('/api/admin/album/'.length);
    if (!SAFE_ID_REGEX.test(id)) {
      return sendJson(res, 400, { error: 'Geçersiz medya kimliği.' });
    }
    try {
      const body = await readJsonBody(req, 16 * 1024);
      const approved = !!body.approved;
      const updated = await runSerializedWrite(async () => {
        const albumItems = await readJsonSafe(ALBUM_META_PATH, []);
        const next = albumItems.map((item) =>
          item.id === id ? { ...item, approved } : item
        );
        await writeJsonSafe(ALBUM_META_PATH, next);
        return next;
      });
      return sendJson(res, 200, { ok: true, albumItems: updated });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // DELETE /api/admin/album/:id
  if (req.method === 'DELETE' && pathname.startsWith('/api/admin/album/')) {
    if (!isAdmin && authData.isSetupCompleted) {
      return sendJson(res, 401, { error: 'Yetkisiz işlem.' });
    }
    const id = pathname.slice('/api/admin/album/'.length);
    if (!SAFE_ID_REGEX.test(id)) {
      return sendJson(res, 400, { error: 'Geçersiz medya kimliği.' });
    }

    const updated = await runSerializedWrite(async () => {
      const albumItems = await readJsonSafe(ALBUM_META_PATH, []);
      const target = albumItems.find((item) => item.id === id);
      if (target && typeof target.url === 'string' && target.url.startsWith('/uploads/')) {
        const fname = path.basename(target.url);
        const fpath = path.resolve(UPLOADS_DIR, fname);
        if (fpath.startsWith(UPLOADS_DIR + path.sep)) {
          fs.unlink(fpath, () => {});
        }
      }
      const filtered = albumItems.filter((item) => item.id !== id);
      await writeJsonSafe(ALBUM_META_PATH, filtered);
      return filtered;
    });

    return sendJson(res, 200, { ok: true, albumItems: updated });
  }

  return sendJson(res, 404, { error: 'API uç noktası bulunamadı.' });
}
