import React, { useEffect, useMemo, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  Palette,
  MailOpen,
  Heart,
  Sparkles,
  Lock,
  Camera,
  Loader2,
} from 'lucide-react';
import rawDefaultConfig from './data/weddingConfig.json';
import {
  AlbumMediaItem,
  GuestNote,
  TemplateId,
  WeddingConfig,
} from './types/wedding';
import { TEMPLATES } from './data/templates';
import { sanitizeText, safeMergeConfig } from './utils/securityAndLinks';
import { musicController } from './utils/musicSynthesizer';
import { AmbientParticles } from './components/AmbientParticles';
import { InteractiveEnvelope } from './components/InteractiveEnvelope';
import { HeroAndCountdown } from './components/HeroAndCountdown';
import { EventScheduleSection } from './components/EventScheduleSection';
import { TravelAndDressSection } from './components/TravelAndDressSection';
import { StoryAndGallerySection } from './components/StoryAndGallerySection';
import { RsvpAndGiftSection } from './components/RsvpAndGiftSection';
import { SetupStudioModal } from './components/SetupStudioModal';

const ADMIN_TOKEN_KEY = 'dijital_davetiye_admin_token_v1';
const defaultConfig = rawDefaultConfig as unknown as WeddingConfig;

export const App: React.FC = () => {
  const [isLoadingServerState, setIsLoadingServerState] = useState<boolean>(true);
  const [config, setConfig] = useState<WeddingConfig>(defaultConfig);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>(() => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });

  const [albumItems, setAlbumItems] = useState<AlbumMediaItem[]>([]);
  const [guestNotes, setGuestNotes] = useState<GuestNote[]>(
    defaultConfig.initialGuestNotes || []
  );

  // Read URL params safely
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const guestNameFromUrl = useMemo(() => {
    const raw =
      urlParams.get('to') ||
      urlParams.get('davetli') ||
      urlParams.get('misafir') ||
      '';
    return sanitizeText(raw, 90);
  }, [urlParams]);

  const isDirectAlbumLink = useMemo(
    () => urlParams.get('album') === '1',
    [urlParams]
  );

  const isAdminUrlRequested = useMemo(
    () =>
      urlParams.get('yonetim') === '1' ||
      urlParams.get('admin') === '1' ||
      urlParams.get('kurulum') === '1' ||
      urlParams.get('studio') === '1',
    [urlParams]
  );

  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState<boolean>(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);

  // Load state from server on mount
  useEffect(() => {
    fetch('/api/state', {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        const setupDone = !!data?.isSetupCompleted;
        setIsSetupCompleted(setupDone);

        if (typeof data?.isAdmin === 'boolean') {
          setIsAdmin(data.isAdmin);
        }
        if (Array.isArray(data?.albumItems)) {
          setAlbumItems(data.albumItems);
        }
        if (Array.isArray(data?.guestNotes)) {
          setGuestNotes(data.guestNotes);
        }

        let merged = defaultConfig;
        if (data && data.config && typeof data.config === 'object') {
          merged = safeMergeConfig(JSON.stringify(data.config), defaultConfig);
          setConfig(merged);
        }

        if (!setupDone) {
          // NOT SET UP YET -> Directly open Setup Wizard! Do NOT show wax-seal envelope!
          setIsEnvelopeOpen(true);
          setIsStudioOpen(true);
        } else if (isAdminUrlRequested) {
          // Admin URL requested (?yonetim=1) -> Open Admin Login/Studio directly without envelope
          setIsEnvelopeOpen(true);
          setIsStudioOpen(true);
        } else if (isDirectAlbumLink) {
          // Guest scanned QR code for album (?album=1) -> Skip envelope and scroll to album
          setIsEnvelopeOpen(true);
        } else {
          // Normal guest visiting the live, configured wedding invitation -> Show envelope if enabled
          setIsEnvelopeOpen(!merged.envelopeAndMusic.requireEnvelopeClick);
        }
      })
      .catch(() => {
        setIsEnvelopeOpen(true);
        setIsStudioOpen(true);
      })
      .finally(() => {
        setIsLoadingServerState(false);
      });
  }, [adminToken, isDirectAlbumLink, isAdminUrlRequested]);

  // Scroll to #ortak-album if opened via QR code (?album=1)
  useEffect(() => {
    if (!isLoadingServerState && isDirectAlbumLink) {
      window.setTimeout(() => {
        document.getElementById('ortak-album')?.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
  }, [isLoadingServerState, isDirectAlbumLink]);

  const canSeeAdminControls = !isSetupCompleted || isAdmin;
  const theme = TEMPLATES[config.templateId] || TEMPLATES['royal-palace'];

  const firstPerson =
    config.displayOrder === 'bride-first' ? config.bride : config.groom;
  const secondPerson =
    config.displayOrder === 'bride-first' ? config.groom : config.bride;

  useEffect(() => {
    document.title = isSetupCompleted
      ? `${firstPerson.firstName} & ${secondPerson.firstName} | Düğün Davetiyesi`
      : 'Dijital Düğün Davetiyesi — İlk Kurulum Sihirbazı';
  }, [firstPerson.firstName, secondPerson.firstName, isSetupCompleted]);

  const handleAdminAuthenticated = (token: string) => {
    setAdminToken(token);
    setIsAdmin(true);
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    setIsAdmin(false);
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  };

  const handleUpdateConfig = (newConfig: WeddingConfig) => {
    setConfig(newConfig);
  };

  const handleConfigSavedToServer = (
    savedConfig: WeddingConfig,
    setupCompleted: boolean
  ) => {
    setConfig(savedConfig);
    setIsSetupCompleted(setupCompleted);
  };

  const handleResetDefault = () => {
    setConfig(defaultConfig);
  };

  const handleEnvelopeOpen = () => {
    setIsEnvelopeOpen(true);
    if (config.envelopeAndMusic.musicEnabled) {
      musicController.start(
        config.envelopeAndMusic.musicMelody,
        config.envelopeAndMusic.customMusicUrl
      );
      setIsMusicPlaying(true);
    }
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      musicController.stop();
      setIsMusicPlaying(false);
    } else {
      musicController.start(
        config.envelopeAndMusic.musicMelody,
        config.envelopeAndMusic.customMusicUrl
      );
      setIsMusicPlaying(true);
    }
  };

  // Show clean minimal loader while checking setup state (prevents flashing envelope before setup)
  if (isLoadingServerState) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="mt-3 text-xs font-medium tracking-wider uppercase text-zinc-400">
          Yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${theme.colors.pageBg} ${theme.colors.textPrimary}`}
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Ambient Floating Particles */}
      <AmbientParticles theme={theme} />

      {/* Interactive 3D Envelope Overlay (ONLY shown AFTER setup is completed and when Studio is closed!) */}
      {isSetupCompleted && !isEnvelopeOpen && !isStudioOpen && (
        <InteractiveEnvelope
          config={config}
          theme={theme}
          guestNameFromUrl={guestNameFromUrl}
          onOpen={handleEnvelopeOpen}
        />
      )}

      {/* Top Sticky Navigation Bar */}
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b backdrop-blur-md transition-colors ${theme.colors.cardBg} ${theme.colors.cardBorder}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          {/* Couple Monogram */}
          <a
            href="#"
            className="flex items-center gap-2.5 text-lg font-bold tracking-wider"
            style={{ fontFamily: theme.fonts.heading }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                borderColor: `${theme.colors.accent}66`,
                color: theme.colors.accent,
              }}
            >
              {firstPerson.firstName[0]}&amp;{secondPerson.firstName[0]}
            </span>
            <span className="hidden sm:inline">
              {firstPerson.firstName} &amp; {secondPerson.firstName}
            </span>
          </a>

          {/* Center Quick Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider uppercase">
            <a
              href="#aileler"
              className={`hover:opacity-75 transition-opacity ${theme.colors.textSecondary}`}
            >
              Aileler
            </a>
            <a
              href="#etkinlikler"
              className={`hover:opacity-75 transition-opacity ${theme.colors.textSecondary}`}
            >
              Program &amp; Yol Tarifi
            </a>
            {config.guestPhotoUploadEnabled && (
              <a
                href="#ortak-album"
                className={`inline-flex items-center gap-1 hover:opacity-75 transition-opacity ${theme.colors.accentText}`}
              >
                <Camera className="h-3.5 w-3.5" />
                Ortak Albüm
              </a>
            )}
            <a
              href="#lcv"
              className={`hover:opacity-75 transition-opacity ${theme.colors.textSecondary}`}
            >
              LCV &amp; Detaylar
            </a>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Template Selector ONLY visible to Admin or during initial un-locked setup */}
            {canSeeAdminControls && (
              <div className="relative flex items-center">
                <Palette
                  className="pointer-events-none absolute left-2.5 h-3.5 w-3.5"
                  style={{ color: theme.colors.accent }}
                />
                <select
                  aria-label="Tasarım Şablonu Seç"
                  value={config.templateId}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      templateId: e.target.value as TemplateId,
                    })
                  }
                  className={`rounded-full border pl-8 pr-3 py-1.5 text-xs font-semibold outline-none cursor-pointer ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                >
                  {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
                    <option key={id} value={id} className="bg-zinc-900 text-white">
                      Tema: {TEMPLATES[id].name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Jump to Shared Photo/Video Album on Mobile */}
            {config.guestPhotoUploadEnabled && (
              <a
                href="#ortak-album"
                title="Fotoğraf & Video Gönder"
                className={`md:hidden inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${theme.colors.accentSoft}`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Albüm</span>
              </a>
            )}

            {/* Re-open Envelope Button */}
            <button
              type="button"
              onClick={() => {
                setIsStudioOpen(false);
                setIsEnvelopeOpen(false);
              }}
              title="Zarf Açılışını Gör"
              className={`inline-flex items-center justify-center rounded-full border p-2 transition-all cursor-pointer hover:opacity-80 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
            >
              <MailOpen className="h-4 w-4" />
            </button>

            {/* Music Play / Pause Button */}
            <button
              type="button"
              onClick={toggleMusic}
              title={isMusicPlaying ? 'Müziği Durdur' : 'Müziği Başlat'}
              className={`inline-flex items-center justify-center rounded-full border p-2 transition-all cursor-pointer ${
                isMusicPlaying
                  ? `${theme.colors.buttonBg} ${theme.colors.buttonText}`
                  : `${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`
              }`}
            >
              {isMusicPlaying ? (
                <Volume2 className="h-4 w-4 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>

            {/* Setup & Customizer Studio Button ONLY visible to Admin or before initial save */}
            {canSeeAdminControls && (
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-md transition-all cursor-pointer ${theme.colors.buttonBg} ${theme.colors.buttonHoverBg} ${theme.colors.buttonText}`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isSetupCompleted ? 'Yönetici Stüdyosu' : 'Kurulum Ekranına Dön'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="relative z-20">
        <HeroAndCountdown
          config={config}
          theme={theme}
          guestNameFromUrl={guestNameFromUrl}
        />

        <EventScheduleSection config={config} theme={theme} />

        <TravelAndDressSection config={config} theme={theme} />

        <StoryAndGallerySection
          config={config}
          theme={theme}
          guestNameFromUrl={guestNameFromUrl}
          albumItems={albumItems}
          onAlbumItemUploaded={(newItem) =>
            setAlbumItems((prev) => [newItem, ...prev])
          }
        />

        <RsvpAndGiftSection
          config={config}
          theme={theme}
          guestNameFromUrl={guestNameFromUrl}
          guestNotes={guestNotes}
          onGuestNotesUpdated={(notes) => setGuestNotes(notes)}
        />
      </main>

      {/* Floating Bottom-Right Quick Studio Launcher (ONLY for Admin or during preview before initial save!) */}
      {canSeeAdminControls && !isStudioOpen && (
        <button
          type="button"
          onClick={() => setIsStudioOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-zinc-950/95 px-5 py-3.5 text-xs sm:text-sm font-bold text-amber-300 shadow-2xl backdrop-blur-md hover:scale-105 transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>
            {isSetupCompleted
              ? 'Yönetici Paneli'
              : 'Kuruluma Devam Et & Yayına Al'}
          </span>
        </button>
      )}

      {/* Footer with Subtle Admin Lock Icon for the Couple */}
      <footer
        className={`relative z-20 border-t py-12 px-4 text-center ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
      >
        <div className="mx-auto max-w-3xl space-y-3">
          <p
            className={`text-3xl sm:text-4xl ${theme.colors.textPrimary}`}
            style={{ fontFamily: theme.fonts.script }}
          >
            {firstPerson.firstName} &amp; {secondPerson.firstName}
          </p>
          {config.hashtag && (
            <p className={`text-xs font-bold tracking-widest ${theme.colors.accentText}`}>
              {config.hashtag}
            </p>
          )}
          <div className={`text-xs flex items-center justify-center gap-3 ${theme.colors.textMuted}`}>
            <span className="inline-flex items-center gap-1">
              Sevgiyle hazırlandı
              <Heart className="h-3.5 w-3.5 fill-current" style={{ color: theme.colors.accent }} />
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Çift / Yönetici Girişi"
            >
              <Lock className="h-3 w-3" />
              <span>Yönetici</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Setup & Customization Studio Modal */}
      <SetupStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        config={config}
        isSetupCompleted={isSetupCompleted}
        isAdmin={isAdmin}
        adminToken={adminToken}
        albumItems={albumItems}
        onAdminAuthenticated={handleAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
        onChangeConfig={handleUpdateConfig}
        onConfigSavedToServer={(savedCfg, setupDone) => {
          handleConfigSavedToServer(savedCfg, setupDone);
          setIsStudioOpen(false);
          setIsEnvelopeOpen(!savedCfg.envelopeAndMusic.requireEnvelopeClick);
        }}
        onAlbumItemsChanged={(items) => setAlbumItems(items)}
        onResetDefault={handleResetDefault}
      />
    </div>
  );
};

export default App;
