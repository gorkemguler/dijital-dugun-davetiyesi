import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Heart, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { WeddingConfig } from '../types/wedding';
import { TemplateTheme } from '../data/templates';
import { sanitizeExternalUrl } from '../utils/securityAndLinks';

interface HeroAndCountdownProps {
  config: WeddingConfig;
  theme: TemplateTheme;
  guestNameFromUrl: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const HeroAndCountdown: React.FC<HeroAndCountdownProps> = ({
  config,
  theme,
  guestNameFromUrl,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(config.primaryDate).getTime();
      if (Number.isNaN(target)) return;
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isPast: false,
      });
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [config.primaryDate]);

  const firstPerson = config.displayOrder === 'bride-first' ? config.bride : config.groom;
  const secondPerson = config.displayOrder === 'bride-first' ? config.groom : config.bride;

  const enabledEvents = config.events.filter((e) => e.enabled);
  const uniqueCities = Array.from(new Set(enabledEvents.map((e) => e.city).filter(Boolean)));
  const heroBgUrl = sanitizeExternalUrl(config.heroPhotoUrl);

  const formattedMainDate = (() => {
    try {
      const dt = new Date(config.primaryDate);
      if (Number.isNaN(dt.getTime())) return config.primaryDate;
      return new Intl.DateTimeFormat('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dt);
    } catch {
      return config.primaryDate;
    }
  })();

  return (
    <section className="relative overflow-hidden">
      {/* Hero Banner */}
      <div className="relative min-h-[88vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        {/* Background Photo + Gradient Overlay */}
        {heroBgUrl && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <img
              src={heroBgUrl}
              alt={`${firstPerson.firstName} & ${secondPerson.firstName}`}
              className="h-full w-full object-cover object-center scale-105 opacity-25 transition-transform duration-1000"
            />
            <div
              className={`absolute inset-0 ${
                theme.isDark
                  ? 'bg-gradient-to-b from-[#0B101E]/85 via-[#0B101E]/75 to-[#0B101E]'
                  : 'bg-gradient-to-b from-white/75 via-white/65 to-transparent'
              }`}
            />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Personalized Guest Badge */}
          {guestNameFromUrl && (
            <div
              className={`mb-5 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs sm:text-sm font-semibold shadow-sm ${theme.colors.accentSoft}`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Hoş Geldiniz, Sayın {guestNameFromUrl}</span>
            </div>
          )}

          {/* Setup Mode / Cities Pill */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wider uppercase ${theme.colors.accentSoft}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {uniqueCities.length > 1
                ? `İki Şehirde Kutlama: ${uniqueCities.join(' & ')}`
                : uniqueCities[0] || 'Düğün Davetiyesi'}
            </span>
            {config.hashtag && (
              <span
                className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-medium ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
              >
                {config.hashtag}
              </span>
            )}
          </div>

          {/* Subtitle / Hero Title */}
          <p
            className={`text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase ${theme.colors.textMuted}`}
          >
            {config.heroTitle || 'EVLENİYORUZ'}
          </p>

          {/* Couple Names */}
          <h1
            className={`mt-4 text-6xl sm:text-7xl md:text-8xl leading-none tracking-tight ${theme.colors.textPrimary}`}
            style={{ fontFamily: theme.fonts.script }}
          >
            {firstPerson.firstName}
            <span
              className="mx-3 sm:mx-5 inline-block text-4xl sm:text-5xl align-middle"
              style={{ color: theme.colors.accent, fontFamily: theme.fonts.heading }}
            >
              &amp;
            </span>
            {secondPerson.firstName}
          </h1>

          {/* Invitation Quote */}
          <p
            className={`mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed ${theme.colors.textSecondary}`}
          >
            {config.invitationQuote}
          </p>

          {config.invitationSubtext && (
            <p
              className={`mt-2 text-sm italic ${theme.colors.accentText}`}
              style={{ fontFamily: theme.fonts.heading }}
            >
              “{config.invitationSubtext}”
            </p>
          )}

          {/* Main Date Display */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3">
            <div
              className={`flex items-center gap-2.5 border px-5 py-2.5 shadow-sm ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
            >
              <Calendar className="h-4 w-4" style={{ color: theme.colors.accent }} />
              <span
                className={`text-sm sm:text-base font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                {formattedMainDate}
              </span>
            </div>
          </div>

          {/* Live Countdown Timer */}
          <div className="mt-8 grid grid-cols-4 gap-2.5 sm:gap-4 max-w-xl mx-auto">
            {[
              { label: 'GÜN', value: timeLeft.days },
              { label: 'SAAT', value: timeLeft.hours },
              { label: 'DAKİKA', value: timeLeft.minutes },
              { label: 'SANİYE', value: timeLeft.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className={`border p-3 sm:p-5 shadow-md transition-transform hover:-translate-y-0.5 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
              >
                <div
                  className={`text-2xl sm:text-4xl font-bold tabular-nums ${theme.colors.textPrimary}`}
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {String(item.value).padStart(2, '0')}
                </div>
                <div
                  className={`mt-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase ${theme.colors.textMuted}`}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Jump Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#etkinlikler"
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold shadow-lg transition-all ${theme.colors.buttonBg} ${theme.colors.buttonHoverBg} ${theme.colors.buttonText}`}
            >
              <Clock className="h-4 w-4" />
              Etkinlik Saatleri &amp; Yol Tarifi
            </a>
            {config.rsvp.enabled && (
              <a
                href="#lcv"
                className={`inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold shadow-sm transition-all hover:opacity-90 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
              >
                <Heart className="h-4 w-4" style={{ color: theme.colors.accent }} />
                LCV / Katılım Bildirimi
              </a>
            )}
          </div>

          <a
            href="#aileler"
            aria-label="Aşağı Kaydır"
            className={`mt-12 inline-flex flex-col items-center gap-1 text-xs font-medium opacity-75 hover:opacity-100 transition-opacity ${theme.colors.textMuted}`}
          >
            <span>Detaylar İçin Kaydırın</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>

      {/* Couple & Families Section */}
      <div id="aileler" className={`py-16 px-4 ${theme.colors.sectionAltBg}`}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p
              className={`text-xs font-semibold tracking-[0.25em] uppercase ${theme.colors.accentText}`}
            >
              AİLELERİMİZ &amp; BİZ
            </p>
            <h2
              className={`mt-2 text-3xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
              style={{ fontFamily: theme.fonts.heading }}
            >
              Mutluluğumuzu Paylaşan Ailelerimiz
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {[
              { person: firstPerson, roleLabel: config.displayOrder === 'bride-first' ? 'GELİN' : 'DAMAT' },
              { person: secondPerson, roleLabel: config.displayOrder === 'bride-first' ? 'DAMAT' : 'GELİN' },
            ].map(({ person, roleLabel }) => {
              const photoUrl = sanitizeExternalUrl(person.photoUrl);
              return (
                <div
                  key={roleLabel}
                  className={`flex flex-col items-center text-center border p-7 sm:p-8 shadow-lg ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
                >
                  {photoUrl && (
                    <div
                      className="mb-5 h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-full border-4 shadow-md"
                      style={{ borderColor: `${theme.colors.accent}55` }}
                    >
                      <img
                        src={photoUrl}
                        alt={`${person.firstName} ${person.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <span
                    className={`rounded-full border px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
                  >
                    {roleLabel}
                  </span>

                  <h3
                    className={`mt-3 text-3xl sm:text-4xl ${theme.colors.textPrimary}`}
                    style={{ fontFamily: theme.fonts.script }}
                  >
                    {person.firstName} {person.lastName}
                  </h3>

                  {person.bio && (
                    <p className={`mt-1 text-xs font-medium ${theme.colors.textMuted}`}>
                      {person.bio}
                    </p>
                  )}

                  <div
                    className={`mt-5 w-full border-t pt-4 ${theme.colors.cardBorder}`}
                  >
                    <p
                      className={`text-xs font-bold tracking-[0.18em] uppercase ${theme.colors.accentText}`}
                    >
                      {person.familyTitle}
                    </p>
                    <p className={`mt-1 text-sm font-medium ${theme.colors.textSecondary}`}>
                      {person.motherName} &amp; {person.fatherName} {person.lastName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional Custom Notes & Announcements on Main Page */}
          {config.customNotesEnabled !== false &&
            Array.isArray(config.customNotes) &&
            config.customNotes.length > 0 && (
              <div className="mt-14">
                <div className="text-center mb-7">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    ÖZEL DUYURU &amp; NOTLAR
                  </span>
                  <h3
                    className={`mt-2 text-2xl sm:text-3xl font-semibold ${theme.colors.textPrimary}`}
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    {config.customNotesTitle || 'Misafirlerimiz İçin Önemli Notlar'}
                  </h3>
                </div>

                <div
                  className={`grid grid-cols-1 ${
                    config.customNotes.length > 1 ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'
                  } gap-5`}
                >
                  {config.customNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`relative overflow-hidden border p-6 shadow-md transition-all ${
                        theme.colors.cardBg
                      } ${theme.colors.cardBorder} ${theme.cardRadius} ${
                        note.highlight ? 'ring-1' : ''
                      }`}
                      style={
                        note.highlight
                          ? { borderColor: theme.colors.accent }
                          : undefined
                      }
                    >
                      {note.badge && (
                        <span
                          className={`inline-block rounded-full border px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase ${theme.colors.accentSoft}`}
                        >
                          {note.badge}
                        </span>
                      )}
                      <h4
                        className={`mt-2.5 text-lg sm:text-xl font-bold ${theme.colors.textPrimary}`}
                        style={{ fontFamily: theme.fonts.heading }}
                      >
                        {note.title}
                      </h4>
                      <p
                        className={`mt-2 text-xs sm:text-sm leading-relaxed ${theme.colors.textSecondary}`}
                      >
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </section>
  );
};
