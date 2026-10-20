# 💍 Açık Kaynak İnteraktif Dijital Düğün Davetiyesi & Ortak Medya Albümü

Kendi sunucunuzda, bilgisayarınızda, Raspberry Pi'nizde veya VPS üzerinde çalıştırıp **Cloudflare Tunnel (`cloudflared`)** ile saniyeler içinde tüm dünyaya güvenle açabileceğiniz; **6 farklı interaktif tasarım şablonu**, **tek veya iki ilde düğün kurgusu**, **harita yol tarifi**, **LCV (katılım bildirimi) yönetimi** ve **misafirlerin doğrudan fotoğraf/video yükleyebildiği ortak düğün albümü** barındıran tam kapsamlı dijital davetiye uygulaması.

---

## 🌟 Temel Özellikler

### 1. 🔐 Şifre Korumalı Yönetici Stüdyosu & Canlı Yayın Kilidi
- **İlk Kurulumda Canlı Özelleştirme**: Uygulamayı ilk açtığınızda görsel **Kurulum & Ayarlar Stüdyosu** üzerinden şablonunuzu, gelin/damat bilgilerinizi ve tüm etkinliklerinizi canlı olarak düzenlersiniz.
- **Kaydet & Yayına Al (Misafir Kilidi)**: Yönetici şifrenizi belirleyip **"Kaydet & Yayına Al"** butonuna bastığınız anda:
  - Tüm ayarlarınız doğrudan sunucudaki `src/data/weddingConfig.json` dosyasına kaydedilir.
  - Üst bardaki tema değiştirici ve sağ alttaki düzenleme butonları **misafirlere tamamen gizlenir**.
  - Cloudflare Tunnel veya domain üzerinden sitenize giren davetliler **sadece şık düğün davetiyenizi** görür; hiçbir ayarı değiştiremez.
- **Yönetici Erişimi (`/?yonetim=1`)**: Sadece siz (düğün sahipleri), adresin sonuna `/?yonetim=1` ekleyerek veya sayfanın en altındaki küçük `🔐 Yönetici` kilidine tıklayıp şifrenizi girerek ayarları güncelleyebilir, LCV tablosunu Excel/CSV olarak indirebilir ve ortak albümü yönetebilirsiniz.

### 2. 📸 Dahili Ortak Düğün Albümü (Fotoğraf & Video Gönderme)
Harici bulut servislerine veya Google hesabı ile giriş yapmaya gerek kalmadan, kendi sunucunuz üzerinde çalışan **Canlı Ortak Düğün Albümü**:
- **Masa QR Kodu (`/?album=1#ortak-album`)**: Davetiyede otomatik üretilen QR kodu düğün masalarına koyabilirsiniz. Misafirler telefon kamerasıyla QR kodu okuttuğunda doğrudan fotoğraf/video yükleme ekranına yönlendirilir.
- **Fotoğraf & Video Desteği**: Misafirler adlarını ve hangi etkinlikten olduğunu (*Kına, Gelin Alma, Resmi Nikah, Düğün, After Party*) seçerek telefonlarından çoklu **Fotoğraf (`JPG, PNG, WEBP, HEIC`)** ve **Video (`MP4, MOV, WEBM` - 100 MB'a kadar)** yükleyebilir.
- **Orijinal Kalitede Sunucu Kaydı**: Yüklenen tüm medyalar sunucunuzdaki `uploads/` klasörüne kaydedilir ve canlı olarak davetiye sayfasındaki **"Misafirlerimizin Paylaştığı Anılar"** galerisinde (veya sadece yönetici panelinde) sergilenir.

### 3. 📍 Tek İlde veya İki Farklı İlde Zengin Etkinlik Akışı
- **Şehir Filtreleme Sekmeleri**: Örneğin *1. İl İzmir (Kına Gecesi & Kız Tarafı Düğünü)* ve *2. İl İstanbul (Gelin Alma, Resmi Nikah, Ana Düğün & After Party)* şeklinde iki farklı şehirde etkinlik tanımladığınızda, misafirler şehir sekmelerinden kendi katılacakları ili filtreleyebilir.
- **Tüm Etkinlik Türleri**:
  - ☕ Kız İsteme & Söz
  - 💍 Nişan Töreni
  - 💃 Kına Gecesi
  - 🚗 Gelin Alma & Düğün Konvoyu *(Sağdıç iletişim telefonu ve konvoy hareket saati notuyla)*
  - ✒️ Resmi Nikah Töreni
  - 🥂 Karşılama Kokteyli
  - ✨ 1. İl / 2. İl Düğün Töreni
  - 🪩 Gece Sonu After Party
  - 🥐 Ertesi Gün Kahvaltı / Brunch
- **3'lü Navigasyon & Canlı Harita**: Her etkinlik kartında **Google Haritalar**, **Apple Haritalar**, **Yandex Navigasyon** doğrudan yol tarifi butonları, kart içinde açılır **Canlı Harita Önizlemesi** ve **Google / Apple (`.ics`) Takvime Ekle** butonları bulunur.

### 4. 🎨 6 Farklı İnteraktif Web Şablonu (Template)
1. **Saray Zarafeti (`royal-palace`)**: Fildişi mermer, altın varak detaylar, klasik zarf mührü ve altın ışıltı partikülleri.
2. **Bohem Botanik (`bohemian-garden`)**: Adaçayı yeşili, sıcak toprak tonları ve uçuşan yapraklar.
3. **Modern Editorial (`modern-editorial`)**: Siyah-beyaz yüksek kontrastlı dergi (Vogue) estetiği ve keskin tipografi.
4. **Gece Galası (`midnight-gala`)**: Yıldızlı gece laciverti, rose-gold ışıltılar ve balo/after party atmosferi.
5. **Ege Esintisi (`aegean-breeze`)**: Alaçatı & Akdeniz mavisi, keten beyazı ve sahil romantizmi.
6. **Romantik Şakayık (`romantic-blossom`)**: Pudra pembe, gül kurusu detaylar ve dökülen çiçek yaprakları.

### 5. 📋 LCV (Katılım Bildirimi), Servis/Otel Rehberi & Online Takı (IBAN)
- **Sunucu Kayıtlı LCV + WhatsApp**: Misafirler hangi ildeki hangi etkinliğe kaç kişi katılacaklarını ve servis taleplerini seçip gönderdiğinde hem sunucudaki **Yönetici LCV Tablosu**'na (`data/rsvpSubmissions.json`) kaydedilir (Excel/CSV olarak indirilebilir) hem de tek tıkla **WhatsApp** mesajı olarak iletilebilir.
- **Dijital Anı Defteri**: Misafirlerin bıraktığı mutluluk mesajları davetiyede canlı olarak yayınlanır.
- **Ulaşım, Konaklama, Dress Code & IBAN**: Servis kalkış saatleri, anlaşmalı otel indirim kodları, görsel Dress Code renk küreleri ve tek tıkla kopyalanabilir IBAN (`TL / EUR / USD / ALTIN`) kartları.

---

## 🛠️ Kurulum ve Özelleştirme Rehberi

### 1. Projeyi İndirin ve Paketleri Kurun
Bilgisayarınızda **Node.js (v18 veya üzeri)** kurulu olmalıdır.

```bash
git clone https://github.com/KULLANICI_ADINIZ/davet.git
cd davet
npm install
```

### 2. Davetiyenizi Özelleştirin ve Kilitleyin (2 Yöntemden Birini Seçin)

#### Yöntem A: Tarayıcıdaki Görsel Stüdyo ile Özelleştirme (Önerilen)
1. Geliştirme veya canlı sunucuyu başlatın:
   ```bash
   npm run dev
   ```
2. Tarayıcınızda `http://localhost:5173` adresini açın.
3. Sağ alttaki **"Kurulum Yap & Yayına Al"** butonuna tıklayın.
4. Açılan görsel stüdyoda:
   - **1. Şablon & Kurgu**: 6 temadan birini seçin; tek il veya iki il hazır kurgusunu uygulayın.
   - **2. Gelin & Damat**: İsimleri, anne-baba adlarını, aile unvanlarını ve fotoğrafları girin.
   - **3. Etkinlikler**: Gelin alma, kına, resmi nikah, düğün, after party saatlerini ve açık adreslerini girin.
   - **4. Servis, Otel & IBAN**: Kullanmak istediğiniz modülleri açıp kapatın.
5. Stüdyonun sağ üst köşesindeki kutucuğa bir **Yönetici Şifresi** yazın ve yeşil **"Kaydet & Yayına Al"** butonuna tıklayın.
6. Artık siteniz kilitlendi ve yayına hazır!

#### Yöntem B: Terminal Sihirbazı ile Kurulum (`npm run kurulum`)
İsterseniz terminalden soru-cevap şeklinde de kurulum yapıp yönetici şifrenizi belirleyebilirsiniz:
```bash
npm run kurulum
```

---

## ☁️ Cloudflare Tunnel İle Yayına Alma Rehberi

Özelleştirmenizi yapıp kaydettikten sonra sitenizi hiçbir port yönlendirmesi (modem ayarı) yapmadan **Cloudflare Tunnel (`cloudflared`)** ile güvenli (`HTTPS`) olarak internete açabilirsiniz.

### Adım 1: Canlı Yayın Sunucusunu Başlatın
Proje dizininde aşağıdaki komutu çalıştırın (Bu komut projeyi derler ve `3000` portunda üretim sunucusunu başlatır):

```bash
npm start
```
*(Sunucu `http://localhost:3000` üzerinde çalışmaya başlayacaktır.)*

### Adım 2: Cloudflare Tunnel (`cloudflared`) Kurulumu
Eğer bilgisayarınızda `cloudflared` kurulu değilse:
- **macOS (Homebrew)**:
  ```bash
  brew install cloudflared
  ```
- **Ubuntu / Debian / Raspberry Pi**:
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```
- **Windows (Winget)**:
  ```bash
  winget install --id Cloudflare.cloudflared
  ```

### Adım 3: Tüneli Başlatın (2 Seçenek)

#### Seçenek 1: Hızlı Ücretsiz Tünel (Domain Gerekmeden Anında Yayın)
Kendi alan adınız yoksa veya hemen test etmek istiyorsanız ikinci bir terminal açıp şu komutu çalıştırın:

```bash
cloudflared tunnel --url http://localhost:3000
```
Cloudflare size saniyeler içinde `https://xxxx-yyyy.trycloudflare.com` şeklinde güvenli (`HTTPS`) bir link verecektir. Bu linki doğrudan WhatsApp'tan misafirlerinize gönderebilirsiniz!

#### Seçenek 2: Kendi Domaininizle Kalıcı Tünel (`https://elifvemert.com`)
Cloudflare hesabınızda kayıtlı bir alan adınız varsa kalıcı tünel açmak için:

```bash
# 1. Cloudflare hesabınıza giriş yapın
cloudflared tunnel login

# 2. "dugun-davet" adında bir tünel oluşturun
cloudflared tunnel create dugun-davet

# 3. Domaininizi (veya alt alan adınızı) tünele yönlendirin
cloudflared tunnel route dns dugun-davet davetiye.alanadiniz.com

# 4. Tüneli yerel 3000 portuna bağlayarak çalıştırın
cloudflared tunnel run --url http://localhost:3000 dugun-davet
```

### Adım 4: Arka Planda 7/24 Çalıştırma (`pm2` ile)
Bilgisayarınızda veya sunucunuzda terminal kapansa bile sitenin kesintisiz çalışması için `pm2` kullanabilirsiniz:

```bash
npm install -g pm2
npm run build
pm2 start server/index.mjs --name "dugun-sitesi"
pm2 save
```

---

## 💌 Özel Linkler ve İpuçları

| Özellik | Örnek Kullanım Linki | Açıklama |
| :--- | :--- | :--- |
| **Misafire Özel İsimli Davetiye** | `https://siteniz.com/?to=Ahmet+Yılmaz+ve+Ailesi` | Açılıştaki mühürlü zarfın üzerinde ve karşılama ekranında **"Sayın Ahmet Yılmaz ve Ailesi"** yazar. (Yönetici panelindeki *5. Özel Link & Müzik* sekmesinden otomatik üretebilirsiniz.) |
| **Masa QR Kodu (Ortak Albüm)** | `https://siteniz.com/?album=1#ortak-album` | Zarf ekranını otomatik geçip doğrudan **Fotoğraf & Video Gönder** bölümünü açar. Düğün masalarındaki QR kartları için idealdir. |
| **Yönetici Paneli Girişi** | `https://siteniz.com/?yonetim=1` | Şifre sorarak **Yönetici & Kurulum Stüdyosu**'nu açar. LCV listesini indirmek, fotoğraf/videoları yönetmek veya saat/konum güncellemek için kullanılır. |

---

## 📁 Veri ve Medya Dosyaları Nerede Saklanır?

Uygulama veritabanı kurulumu gerektirmeden tüm verileri proje içindeki güvenli klasörlerde saklar:
- `src/data/weddingConfig.json`: Kaydettiğiniz tüm davetiye, şablon ve etkinlik ayarları.
- `data/adminAuth.json`: `crypto.scrypt` ile tuzlanıp (salt) hashlenmiş yönetici şifreniz.
- `data/rsvpSubmissions.json`: Misafirlerin gönderdiği tüm LCV (katılım) kayıtları.
- `data/guestNotes.json`: Dijital Anı Defteri mutluluk mesajları.
- `data/albumMedia.json` & `uploads/`: Misafirlerin ortak albüme yüklediği tüm fotoğraf ve videolar.

*(Not: `.gitignore` dosyası sayesinde `data/` ve `uploads/` klasörleriniz yanlışlıkla herkese açık GitHub deponuza yüklenmez, kişisel verileriniz ve şifreniz güvende kalır.)*

---

## 🔒 Güvenlik Mimarisi

1. **Kriptografik Şifre Saklama**: Yönetici şifresi asla açık metin (plain-text) olarak tutulmaz; Node.js dahili `crypto.scryptSync` ve `crypto.timingSafeEqual` ile doğrulanır.
2. **Brute-Force & Rate Limiting**: Yönetici girişi ve medya yükleme uç noktalarında IP bazlı hız sınırlaması (`cf-connecting-ip` destekli) bulunur.
3. **Güvenli Medya Yükleme**: Sadece izin verilen görüntü (`jpg, png, webp, heic`) ve video (`mp4, mov, webm`) MIME türleri kabul edilir. Kullanıcı dosya adları kullanılmaz; her dosyaya rastgele kriptografik UUID atanır (`Path Traversal` ve zararlı betik yükleme koruması).
4. **Sıfır Bağımlılık Zafiyeti**: Hem ön yüz hem de arka uç sunucusu `npm audit` üzerinde **0 güvenlik zafiyeti (`0 vulnerabilities`)** ile çalışır.

---

## 📄 Lisans
MIT Lisansı ile açık kaynak olarak paylaşılmıştır. Mutluluklar dileriz! 🥂
