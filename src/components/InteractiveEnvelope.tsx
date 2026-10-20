import React, { useState } from 'react';
import { Sparkles, Volume2, Calendar, MapPin } from 'lucide-react';
import { WeddingConfig } from '../types/wedding';
import { TemplateTheme } from '../data/templates';

interface InteractiveEnvelopeProps {
  config: WeddingConfig;
  theme: TemplateTheme;
  guestNameFromUrl: string;
  onOpen: () => void;
}

export const InteractiveEnvelope: React.FC<InteractiveEnvelopeProps> = ({
  config,
  theme,
  guestNameFromUrl,
  onOpen,
}) => {
  const [isOpening, setIsOpening] = useState(false);

  const firstPerson = config.displayOrder === 'bride-first' ? config.bride : config.groom;
  const secondPerson = config.displayOrder === 'bride-first' ? config.groom : config.bride;

  const enabledEvents = config.events.filter((e) => e.enabled);
  const uniqueCities = Array.from(new Set(enabledEvents.map((e) => e.city).filter(Boolean)));

  const handleSealClick = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(() => {
      onOpen();
    }, 850);
  };

  const formattedMainDate = (() => {
    try {
      const dt = new Date(config.primaryDate);
      if (Number.isNaN(dt.getTime())) return config.primaryDate;
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dt);
    } catch {
      return config.primaryDate;
    }
  })();

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-all duration-700 ${
        theme.colors.pageBg
      } ${isOpening ? 'scale-105 opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Subtle decorative radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${theme.colors.accent}33, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Top Family Names */}
        <p
          className={`mb-2 text-xs font-medium tracking-[0.28em] uppercase ${theme.colors.textMuted}`}
        >
          {config.bride.familyTitle} &amp; {config.groom.familyTitle}
        </p>

        {/* Personalized Guest Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-all"
          style={{
            borderColor: `${theme.colors.accent}40`,
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
          <span className={theme.colors.textPrimary}>
            {guestNameFromUrl
              ? `Sayın ${guestNameFromUrl}`
              : config.envelopeAndMusic.envelopeTitle || 'Özel Davetlisiniz'}
          </span>
        </div>

        {/* Interactive Envelope Card */}
        <div
          onClick={handleSealClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleSealClick();
          }}
          aria-label="Davetiyeyi Aç"
          className={`group relative mx-auto w-full cursor-pointer overflow-hidden border p-8 sm:p-11 shadow-2xl transition-all duration-700 ${
            theme.colors.envelopeBg
          } ${theme.colors.cardBorder} ${theme.cardRadius} ${
            isOpening ? '-translate-y-6 scale-[1.03]' : 'hover:-translate-y-1'
          }`}
        >
          {/* Decorative Envelope Flap Lines */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-32 origin-top border-b transition-transform duration-700 ${
              theme.colors.envelopeFlapBg
            } ${theme.colors.cardBorder} ${isOpening ? '-scale-y-100 opacity-30' : ''}`}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />

          {/* Inner Invitation Letter Preview */}
          <div
            className={`relative z-10 mt-6 rounded-xl border p-6 sm:p-8 shadow-inner transition-all duration-700 ${
              theme.colors.cardBg
            } ${theme.colors.cardBorder} ${isOpening ? '-translate-y-8 shadow-2xl' : ''}`}
          >
            <p
              className={`text-[11px] font-semibold tracking-[0.25em] uppercase ${theme.colors.textMuted}`}
            >
              DÜĞÜN DAVETİYESİ
            </p>

            <h1
              className={`mt-3 text-4xl sm:text-5xl leading-tight ${theme.colors.textPrimary}`}
              style={{ fontFamily: theme.fonts.script }}
            >
              {firstPerson.firstName} &amp; {secondPerson.firstName}
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium border ${theme.colors.accentSoft}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                {formattedMainDate}
              </span>
              {uniqueCities.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium border ${theme.colors.accentSoft}`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {uniqueCities.join(' • ')}
                </span>
              )}
            </div>

            {/* Wax Seal Button */}
            <div className="mt-8 flex flex-col items-center">
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 bg-gradient-to-br shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-all duration-500 group-hover:scale-110 ${
                  theme.colors.sealBg
                } ${theme.colors.sealBorder} ${theme.colors.sealText} ${
                  isOpening ? 'scale-125 rotate-12 opacity-0' : ''
                }`}
              >
                {/* Inner engraved ring */}
                <div className="flex h-19 w-19 flex-col items-center justify-center rounded-full border border-current/30 text-center">
                  <span
                    className="text-xl font-bold tracking-wider"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    {config.envelopeAndMusic.waxSealInitials ||
                      `${firstPerson.firstName[0]}&${secondPerson.firstName[0]}`}
                  </span>
                  <span className="mt-0.5 text-[9px] font-semibold tracking-[0.2em] uppercase opacity-80">
                    AÇ
                  </span>
                </div>
              </div>

              <p
                className={`mt-4 text-xs font-medium tracking-wide transition-opacity ${theme.colors.textSecondary}`}
              >
                {config.envelopeAndMusic.envelopeSubtitle || 'Davetiyeyi açmak için mühre dokunun'}
              </p>

              {config.envelopeAndMusic.musicEnabled && (
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 text-[11px] ${theme.colors.textMuted}`}
                >
                  <Volume2 className="h-3 w-3" />
                  Müzikli İnteraktif Davetiye
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
