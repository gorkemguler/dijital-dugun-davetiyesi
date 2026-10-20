#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, '../src/data/weddingConfig.json');
const DATA_DIR = path.resolve(__dirname, '../data');
const AUTH_PATH = path.resolve(DATA_DIR, 'adminAuth.json');

const rl = readline.createInterface({ input, output });

const ask = async (question, defaultVal = '') => {
  const suffix = defaultVal ? ` (${defaultVal})` : '';
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultVal;
};

async function main() {
  console.log('\n============================================================');
  console.log('💍 DİJİTAL DÜĞÜN DAVETİYESİ - İNTERAKTİF KURULUM SİHİRBAZI');
  console.log('============================================================\n');
  console.log('Not: Enter tuşuna basarak parantez içindeki varsayılan değerleri kabul edebilirsiniz.\n');

  let currentConfig;
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    currentConfig = JSON.parse(raw);
  } catch (err) {
    console.error('Varsayılan weddingConfig.json okunamadı:', err.message);
    process.exit(1);
  }

  // 1. Template Selection
  console.log('--- 1. TASARIM ŞABLONU SEÇİMİ ---');
  console.log('1) royal-palace      -> Saray Zarafeti (Altın & Fildişi Mermer)');
  console.log('2) bohemian-garden   -> Bohem Botanik (Adaçayı Yeşili & Doğal Yapraklar)');
  console.log('3) modern-editorial  -> Modern Editorial (Siyah-Beyaz Dergi Estetiği)');
  console.log('4) midnight-gala     -> Gece Galası (Yıldızlı Lacivert & Rose Gold)');
  console.log('5) aegean-breeze     -> Ege Esintisi (Alaçatı Mavisi & Keten Beyazı)');
  console.log('6) romantic-blossom  -> Romantik Şakayık (Pudra Pembe & Çiçek Yaprakları)');

  const tplChoice = await ask('Şablon numarası seçin (1-6)', '1');
  const tplMap = {
    '1': 'royal-palace',
    '2': 'bohemian-garden',
    '3': 'modern-editorial',
    '4': 'midnight-gala',
    '5': 'aegean-breeze',
    '6': 'romantic-blossom',
  };
  currentConfig.templateId = tplMap[tplChoice] || 'royal-palace';

  // 2. Bride & Groom Info
  console.log('\n--- 2. GELİN & DAMAT BİLGİLERİ ---');
  currentConfig.bride.firstName = await ask('Gelin Adı', currentConfig.bride.firstName);
  currentConfig.bride.lastName = await ask('Gelin Soyadı', currentConfig.bride.lastName);
  currentConfig.bride.motherName = await ask('Gelin Anne Adı', currentConfig.bride.motherName);
  currentConfig.bride.fatherName = await ask('Gelin Baba Adı', currentConfig.bride.fatherName);
  currentConfig.bride.familyTitle = await ask(
    'Gelin Aile Unvanı',
    `${currentConfig.bride.lastName} Ailesi`
  );

  currentConfig.groom.firstName = await ask('Damat Adı', currentConfig.groom.firstName);
  currentConfig.groom.lastName = await ask('Damat Soyadı', currentConfig.groom.lastName);
  currentConfig.groom.motherName = await ask('Damat Anne Adı', currentConfig.groom.motherName);
  currentConfig.groom.fatherName = await ask('Damat Baba Adı', currentConfig.groom.fatherName);
  currentConfig.groom.familyTitle = await ask(
    'Damat Aile Unvanı',
    `${currentConfig.groom.lastName} Ailesi`
  );

  currentConfig.hashtag = await ask(
    'Düğün Hashtag',
    `#${currentConfig.bride.firstName}Ve${currentConfig.groom.firstName}Evleniyor`
  );
  currentConfig.envelopeAndMusic.waxSealInitials = `${currentConfig.bride.firstName[0]} & ${currentConfig.groom.firstName[0]}`;

  // 3. Setup Mode (Single City vs Dual City)
  console.log('\n--- 3. DÜĞÜN KURGUSU & ETKİNLİKLER ---');
  console.log('1) Tek İlde Düğün (Tüm etkinlikler aynı ilde: Gelin Alma, Resmi Nikah, Düğün, After Party vb.)');
  console.log('2) İki Farklı İlde Düğün (Örn: 1. İl Kına/Kız Düğünü + 2. İl Gelin Alma, Nikah, Ana Düğün, After Party)');
  console.log('3) Mevcut Etkinlikleri Koru ve Sadece Genel Ayarları Güncelle');

  const modeChoice = await ask('Kurgu seçiminiz (1-3)', '2');

  if (modeChoice === '1' || modeChoice === '2') {
    currentConfig.setupMode = modeChoice === '1' ? 'single-city' : 'dual-city';
    const events = [];

    const city1 = await ask(
      modeChoice === '2' ? '1. Etkinlik İli (Örn: Kız Tarafı / Kına İli)' : 'Düğün İli (Şehir)',
      modeChoice === '2' ? 'İzmir' : 'İstanbul'
    );
    const city2 =
      modeChoice === '2'
        ? await ask('2. Etkinlik İli (Örn: Ana Düğün İli)', 'İstanbul')
        : city1;

    const addEventPrompt = async (type, defaultTitle, defaultBadge, defaultCity, defaultTime) => {
      const want = await ask(`-> "${defaultTitle}" etkinliği eklensin mi? (e/h)`, 'e');
      if (want.toLowerCase() !== 'e') return;

      const title = await ask(`   Etkinlik Başlığı`, defaultTitle);
      const city = await ask(`   Şehir (İl)`, defaultCity);
      const district = await ask(`   İlçe`, 'Merkez');
      const date = await ask(`   Tarih (YYYY-AA-GG)`, '2026-11-14');
      const startTime = await ask(`   Başlangıç Saati (SS:DD)`, defaultTime);
      const venueName = await ask(`   Mekan / Salon / Ev Adı`, `${title} Mekanı`);
      const address = await ask(`   Tam Açık Adres (Yol Tarifi İçin)`, `${district}, ${city}`);
      const description = await ask(`   Kısa Açıklama / Not`, '');

      events.push({
        id: `evt-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        enabled: true,
        badgeText: `${city.toUpperCase()} • ${defaultBadge}`,
        title,
        date,
        startTime,
        city,
        district,
        venueName,
        address,
        description,
      });
    };

    if (modeChoice === '2') {
      await addEventPrompt('kina', 'Kına Gecesi & Kutlama', '1. İL • KINA', city1, '19:30');
      await addEventPrompt('dugun', `${city1} Düğün Töreni`, '1. İL • DÜĞÜN', city1, '19:30');
    } else {
      await addEventPrompt('kina', 'Kına Gecesi', 'KINA GECESİ', city1, '19:30');
    }

    await addEventPrompt('gelin-alma', 'Gelin Alma & Konvoy', 'GÜNDÜZ • KONVOY', city2, '14:00');
    await addEventPrompt('resmi-nikah', 'Resmi Nikah Töreni', 'RESMİ NİKAH', city2, '18:30');
    await addEventPrompt('dugun', 'Düğün Töreni & Kutlama', 'ANA DÜĞÜN', city2, '19:30');
    await addEventPrompt('after-party', 'After Party & DJ Set', 'GECE SONU', city2, '23:30');

    if (events.length > 0) {
      currentConfig.events = events;
      const mainEvt = events.find((e) => e.type === 'dugun') || events[events.length - 1];
      currentConfig.primaryDate = `${mainEvt.date}T${mainEvt.startTime}`;
    }
  }

  // 4. RSVP & Admin Password
  console.log('\n--- 4. LCV (WHATSAPP) & YÖNETİCİ ŞİFRESİ (GÜVENLİK KİLİDİ) ---');
  currentConfig.rsvp.whatsappNumber = await ask(
    'LCV bildirimlerinin geleceği WhatsApp Numarası (905...)',
    currentConfig.rsvp.whatsappNumber
  );

  let adminPass = '';
  while (adminPass.length < 4) {
    adminPass = await ask(
      'Yönetici Paneli Şifresi Belirleyin (En az 4 karakter - Misafirlerin ayarları değiştirmesini engeller)',
      '123456'
    );
  }

  currentConfig.showStudioButton = false;
  await fs.writeFile(CONFIG_PATH, JSON.stringify(currentConfig, null, 2) + '\n', 'utf-8');

  await fs.mkdir(DATA_DIR, { recursive: true });
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(adminPass, salt, 64).toString('hex');
  const authPayload = {
    isSetupCompleted: true,
    passwordSalt: salt,
    passwordHash: hash,
    SessionSecret: crypto.randomBytes(32).toString('hex'),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(AUTH_PATH, JSON.stringify(authPayload, null, 2) + '\n', 'utf-8');

  console.log('\n============================================================');
  console.log('✅ KURULUM TAMAMLANDI & SİTE YAYINA KİLİTLENDİ!');
  console.log('============================================================');
  console.log(`📄 Davetiye Ayarları : ${CONFIG_PATH}`);
  console.log(`🔐 Yönetici Kilidi   : Aktif (Misafirler sadece davetiyeyi görür)`);
  console.log('------------------------------------------------------------');
  console.log('🚀 Canlı Yayın Sunucusunu Başlatmak İçin:');
  console.log('   npm start');
  console.log('☁️  Cloudflare Tunnel İle İnternete Açmak İçin:');
  console.log('   cloudflared tunnel --url http://localhost:3000');
  console.log('============================================================\n');

  rl.close();
}

main().catch((err) => {
  console.error('Kurulum hatası:', err);
  rl.close();
  process.exit(1);
});
