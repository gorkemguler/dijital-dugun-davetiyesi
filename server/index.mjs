#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { handleApiAndUploads } from './apiHandler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg']);

const server = http.createServer(async (req, res) => {
  // Security Headers on all responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  try {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    if (urlObj.pathname.startsWith('/api/') || urlObj.pathname.startsWith('/uploads/')) {
      await handleApiAndUploads(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let decodedPathname = '/';
    try {
      decodedPathname = decodeURIComponent(urlObj.pathname);
    } catch {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    let safeRelPath = path.normalize(decodedPathname).replace(/^(\.\.(\/|\\|$))+/, '');
    if (safeRelPath === '/' || safeRelPath === '\\') {
      safeRelPath = '/index.html';
    }

    let filePath = path.resolve(DIST_DIR, '.' + safeRelPath);
    if (!filePath.startsWith(DIST_DIR + path.sep) && filePath !== DIST_DIR) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || (await fsp.stat(filePath)).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Build dosyaları bulunamadı. Lütfen önce "npm run build" çalıştırın.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Sunucu hatası');
    }
  }
});

// Slowloris & connection timeout hardening
server.headersTimeout = 30 * 1000;
server.requestTimeout = 5 * 60 * 1000;
server.keepAliveTimeout = 65 * 1000; // Recommended >60s for Cloudflare Tunnel

server.listen(PORT, HOST, () => {
  console.log('\n============================================================');
  console.log('💍 DİJİTAL DÜĞÜN DAVETİYESİ - CANLI YAYIN SUNUCUSU AKTİF');
  console.log('============================================================');
  console.log(`🌐 Yerel Adres      : http://localhost:${PORT}`);
  console.log(`🔐 Yönetici Paneli  : http://localhost:${PORT}/?yonetim=1`);
  console.log(`📸 Ortak Albüm Linki: http://localhost:${PORT}/?album=1`);
  console.log('------------------------------------------------------------');
  console.log(`☁️  Cloudflare Tunnel ile dış dünyaya açmak için:`);
  console.log(`   cloudflared tunnel --url http://localhost:${PORT}`);
  console.log('============================================================\n');
});
