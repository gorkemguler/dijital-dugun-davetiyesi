import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Heart,
  QrCode,
  ExternalLink,
  X,
  Upload,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  User,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { AlbumMediaItem, WeddingConfig } from '../types/wedding';
import { TemplateTheme } from '../data/templates';
import { sanitizeExternalUrl } from '../utils/securityAndLinks';

interface StoryAndGallerySectionProps {
  config: WeddingConfig;
  theme: TemplateTheme;
  guestNameFromUrl: string;
  albumItems: AlbumMediaItem[];
  onAlbumItemUploaded: (item: AlbumMediaItem) => void;
}

export const StoryAndGallerySection: React.FC<StoryAndGallerySectionProps> = ({
  config,
  theme,
  guestNameFromUrl,
  albumItems,
  onAlbumItemUploaded,
}) => {
  const enabledEvents = config.events.filter((e) => e.enabled);

  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Built-in Photo & Video Upload States
  const [uploaderName, setUploaderName] = useState(guestNameFromUrl || '');
  const [caption, setCaption] = useState('');
  const [eventTag, setEventTag] = useState(enabledEvents[0]?.title || 'Düğün Hatırası');
  const [uploadPin, setUploadPin] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('pin') || '';
    } catch {
      return '';
    }
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [visibleAlbumCount, setVisibleAlbumCount] = useState<number>(12);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasPinProtection = Boolean(
    config.albumUploadPin && config.albumUploadPin.trim().length > 0
  );

  // Generate QR code pointing straight to this website's #ortak-album (?album=1)
  const albumDirectUrl = (() => {
    if (typeof window === 'undefined') return '';
    const pinParam =
      hasPinProtection && config.albumUploadPin
        ? `&pin=${encodeURIComponent(config.albumUploadPin.trim())}`
        : '';
    return `${window.location.origin}${window.location.pathname}?album=1${pinParam}#ortak-album`;
  })();

  const externalUploadUrl = sanitizeExternalUrl(config.guestPhotoUploadUrl);

  useEffect(() => {
    if (!config.guestPhotoUploadEnabled || !albumDirectUrl) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(albumDirectUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#18181B',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [config.guestPhotoUploadEnabled, albumDirectUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);
    if (files.length > 0) {
      setSelectedFiles(files.slice(0, 10)); // Up to 10 photos/videos at once
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadErrorMsg('Lütfen yüklenecek en az bir fotoğraf veya video seçin.');
      return;
    }

    setIsUploading(true);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress({ current: i + 1, total: selectedFiles.length });

      try {
        const res = await fetch('/api/album/upload', {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'image/jpeg',
            'x-mime-type': file.type || 'image/jpeg',
            'x-uploader-name': encodeURIComponent(uploaderName.trim() || 'Misafir'),
            'x-caption': encodeURIComponent(caption.trim()),
            'x-event-tag': encodeURIComponent(eventTag),
            'x-upload-pin': encodeURIComponent(uploadPin.trim()),
          },
          body: file,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Yükleme başarısız oldu.');
        }

        if (data.item) {
          onAlbumItemUploaded(data.item);
          successCount++;
        }
      } catch (err) {
        setUploadErrorMsg(
          err instanceof Error ? err.message : 'Dosya yüklenirken bir hata oluştu.'
        );
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      setSelectedFiles([]);
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      const visMode = config.albumVisibilityMode || 'moderated';
      if (visMode === 'admin-only') {
        setUploadSuccessMsg(
          `${successCount} adet medya başarıyla çiftimizin özel albümüne iletildi! Teşekkür ederiz ❤️`
        );
      } else if (visMode === 'moderated') {
        setUploadSuccessMsg(
          `${successCount} adet medya başarıyla yüklendi! Çiftimizin onayının ardından ortak albüm duvarında yayınlanacaktır ❤️`
        );
      } else {
        setUploadSuccessMsg(
          `${successCount} adet medya başarıyla ortak düğün albümümüze eklendi! Teşekkür ederiz ❤️`
        );
      }
    }
  };

  const showStory = config.storyEnabled && config.storyMilestones.length > 0;
  const showGallery = config.galleryEnabled && config.galleryPhotos.length > 0;
  const showPhotoUpload = config.guestPhotoUploadEnabled;

  if (!showStory && !showGallery && !showPhotoUpload) return null;

  return (
    <section id="hikayemiz" className="py-20 px-4">
      <div className="mx-auto max-w-5xl space-y-20">
        {/* Love Story Timeline */}
        {showStory && (
          <div>
            <div className="text-center mb-12">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
              >
                <Heart className="h-3.5 w-3.5" />
                BİZİM HİKAYEMİZ
              </span>
              <h2
                className={`mt-3 text-3xl sm:text-5xl font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                Tanışmadan Sonsuzluğa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {config.storyMilestones.map((milestone, idx) => {
                const imgUrl = sanitizeExternalUrl(milestone.imageUrl);
                return (
                  <div
                    key={milestone.id}
                    className={`flex flex-col overflow-hidden border shadow-md transition-transform hover:-translate-y-1 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
                  >
                    {imgUrl && (
                      <div className="h-44 w-full overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={milestone.title}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <span
                        className={`inline-block w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${theme.colors.accentSoft}`}
                      >
                        {idx + 1}. Adım • {milestone.date}
                      </span>
                      <h3
                        className={`mt-3 text-xl font-bold ${theme.colors.textPrimary}`}
                        style={{ fontFamily: theme.fonts.heading }}
                      >
                        {milestone.title}
                      </h3>
                      <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${theme.colors.textSecondary}`}>
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Couple Photo Gallery */}
        {showGallery && (
          <div>
            <div className="text-center mb-10">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
              >
                <Camera className="h-3.5 w-3.5" />
                FOTOĞRAF GALERİSİ
              </span>
              <h2
                className={`mt-3 text-3xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                En Güzel Karelerimiz
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.galleryPhotos.map((photo) => {
                const safeUrl = sanitizeExternalUrl(photo.url);
                if (!safeUrl) return null;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      setSelectedMedia({ url: safeUrl, type: 'image', caption: photo.caption })
                    }
                    className={`group relative h-64 w-full overflow-hidden border shadow-md cursor-pointer text-left ${theme.colors.cardBorder} ${theme.cardRadius}`}
                  >
                    <img
                      src={safeUrl}
                      alt={photo.caption}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 text-white">
                      <p className="text-xs font-medium">{photo.caption}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Built-in Direct Photo & Video Upload + Live Shared Wedding Album */}
        {showPhotoUpload && (
          <div
            id="ortak-album"
            className={`border p-6 sm:p-10 shadow-xl ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Direct Photo & Video Upload Form */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    ORTAK DÜĞÜN ALBÜMÜ • FOTOĞRAF &amp; VİDEO GÖNDER
                  </span>

                  <h3
                    className={`mt-3 text-2xl sm:text-4xl font-bold ${theme.colors.textPrimary}`}
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    Sizin Gözünüzden Düğünümüz
                  </h3>

                  <p className={`mt-2 text-sm leading-relaxed ${theme.colors.textSecondary}`}>
                    {config.guestPhotoUploadNote ||
                      'Kına, gelin alma, nikah, düğün ve after party boyunca çektiğiniz fotoğraf ve videoları hiçbir üyelik gerekmeden doğrudan buradan ortak albümümüze yükleyebilirsiniz!'}
                  </p>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.colors.textSecondary}`}>
                        Adınız &amp; Soyadınız *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={uploaderName}
                        onChange={(e) => setUploaderName(e.target.value)}
                        placeholder="Örn: Selin Yılmaz"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.colors.textSecondary}`}>
                        Hangi Etkinlikten?
                      </label>
                      <select
                        value={eventTag}
                        onChange={(e) => setEventTag(e.target.value)}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                      >
                        {enabledEvents.map((ev) => (
                          <option key={ev.id} value={`${ev.city} - ${ev.title}`} className="bg-zinc-900 text-white">
                            {ev.city} • {ev.title}
                          </option>
                        ))}
                        <option value="Genel Düğün Anısı" className="bg-zinc-900 text-white">
                          Genel Düğün Hatırası
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.colors.textSecondary}`}>
                      Fotoğraf veya Video Seçin (Çoklu Seçim Yapabilirsiniz) *
                    </label>
                    <label
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer hover:opacity-90 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <ImageIcon className="h-6 w-6" style={{ color: theme.colors.accent }} />
                        <Film className="h-6 w-6" style={{ color: theme.colors.accent }} />
                      </div>
                      <span className={`text-sm font-bold ${theme.colors.textPrimary}`}>
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} adet dosya seçildi (${selectedFiles
                              .map((f) => f.name)
                              .join(', ')
                              .slice(0, 50)}...)`
                          : 'Galeriden Fotoğraf / Video Seçmek veya Çekmek İçin Dokunun'}
                      </span>
                      <span className={`mt-1 text-xs ${theme.colors.textMuted}`}>
                        JPG, PNG, WEBP, HEIC ve MP4 / MOV videolar desteklenir (Maks. 100 MB)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className={hasPinProtection ? 'sm:col-span-1' : 'sm:col-span-2'}>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.colors.textSecondary}`}>
                        Kısa Not / Anı Açıklaması (İsteğe Bağlı)
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Örn: İlk dans anı, harika bir gece!"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                      />
                    </div>

                    {hasPinProtection && (
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.colors.textSecondary}`}>
                          Masa / Albüm Şifresi (PIN) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={24}
                          value={uploadPin}
                          onChange={(e) => setUploadPin(e.target.value)}
                          placeholder="Masadaki PIN kodunu girin"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg transition-all cursor-pointer disabled:opacity-60 ${theme.colors.buttonBg} ${theme.colors.buttonHoverBg} ${theme.colors.buttonText}`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>
                            Yükleniyor ({uploadProgress.current}/{uploadProgress.total})...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Fotoğraf / Videoyu Albüme Gönder</span>
                        </>
                      )}
                    </button>

                    {externalUploadUrl &&
                      externalUploadUrl !== 'https://photos.google.com/' && (
                        <a
                          href={externalUploadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-semibold ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                        >
                          <span>Harici Bulut Albümü</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                  </div>

                  {uploadSuccessMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                  )}

                  {uploadErrorMsg && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm font-medium text-red-600 dark:text-red-300">
                      {uploadErrorMsg}
                    </div>
                  )}
                </form>
              </div>

              {/* Right Column: QR Code Card for Table / Quick Scan */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-inner"
                style={{
                  borderColor: `${theme.colors.accent}35`,
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                }}
              >
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: theme.colors.accent }}
                >
                  <QrCode className="h-4 w-4" />
                  MASA QR KODU
                </div>

                {qrDataUrl && (
                  <div className="rounded-2xl border bg-white p-4 shadow-md">
                    <img
                      src={qrDataUrl}
                      alt="Ortak Fotoğraf & Video Albümü QR Kodu"
                      className="h-44 w-44"
                    />
                  </div>
                )}

                <p className={`mt-4 text-xs sm:text-sm font-semibold ${theme.colors.textPrimary}`}>
                  Kameranızla Okutun &amp; Anında Paylaşın
                </p>
                <p className={`mt-1 text-xs ${theme.colors.textMuted}`}>
                  Uygulama indirmeden veya hesap açmadan doğrudan fotoğraf ve videolarınızı gönderebilirsiniz.
                </p>
                {config.hashtag && (
                  <span
                    className={`mt-3 rounded-full border px-3 py-1 text-xs font-bold ${theme.colors.accentSoft}`}
                  >
                    {config.hashtag}
                  </span>
                )}
              </div>
            </div>

            {/* Live Shared Album Wall (Only approved items when not admin-only) */}
            {config.albumVisibilityMode !== 'admin-only' &&
              config.showPublicAlbumWall !== false &&
              albumItems.filter((i) => i.approved === true).length > 0 && (
              <div className={`mt-10 border-t pt-8 ${theme.colors.cardBorder}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <div>
                    <h4
                      className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary}`}
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Misafirlerimizin Paylaştığı Anılar (
                      {albumItems.filter((i) => i.approved === true).length})
                    </h4>
                    <p className={`text-xs ${theme.colors.textMuted}`}>
                      Düğünümüzden onaylanmış fotoğraf ve videolar
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albumItems
                    .filter((i) => i.approved === true)
                    .slice(0, visibleAlbumCount)
                    .map((item) => (
                    <div
                      key={item.id}
                      className={`group flex flex-col overflow-hidden rounded-2xl border shadow-md ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                    >
                      <div className="relative h-56 w-full bg-black/90 overflow-hidden">
                        {item.mediaType === 'video' ? (
                          <video
                            src={item.url}
                            controls
                            preload="none"
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMedia({
                                url: item.url,
                                type: 'image',
                                caption: `${item.uploaderName}${
                                  item.caption ? ` — "${item.caption}"` : ''
                                }`,
                              })
                            }
                            className="h-full w-full cursor-pointer"
                          >
                            <img
                              src={item.url}
                              alt={item.caption || item.uploaderName}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </button>
                        )}

                        {item.eventTag && (
                          <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                            {item.eventTag}
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.colors.textPrimary}`}>
                            <User className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                            <span>{item.uploaderName}</span>
                          </div>
                          {item.caption && (
                            <p className={`mt-1 text-xs italic ${theme.colors.textSecondary}`}>
                              “{item.caption}”
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {albumItems.length > visibleAlbumCount && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleAlbumCount((prev) => prev + 12)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary} hover:opacity-85`}
                    >
                      Daha Fazla Anı Göster ({albumItems.length - visibleAlbumCount} kaldı)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="absolute top-5 right-5 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25 cursor-pointer"
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>

          {selectedMedia.type === 'video' ? (
            <video
              src={selectedMedia.url}
              controls
              autoPlay
              className="max-h-[82vh] max-w-[92vw] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedMedia.url}
              alt={selectedMedia.caption || 'Büyük Görsel'}
              className="max-h-[82vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {selectedMedia.caption && (
            <p className="mt-4 text-sm font-medium text-white/90 text-center max-w-xl">
              {selectedMedia.caption}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
