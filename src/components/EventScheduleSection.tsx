import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Car,
  Sparkles,
  Music,
  Heart,
  Coffee,
  GlassWater,
  Phone,
  Shirt,
  Copy,
  Check,
  Map,
  CalendarPlus,
  Download,
} from 'lucide-react';
import { WeddingConfig, WeddingEvent } from '../types/wedding';
import { TemplateTheme } from '../data/templates';
import {
  downloadEventIcs,
  getEventNavigationLinks,
  getGoogleCalendarUrl,
} from '../utils/securityAndLinks';

interface EventScheduleSectionProps {
  config: WeddingConfig;
  theme: TemplateTheme;
}

export const EventScheduleSection: React.FC<EventScheduleSectionProps> = ({
  config,
  theme,
}) => {
  const enabledEvents = config.events.filter((e) => e.enabled);
  const cities = Array.from(new Set(enabledEvents.map((e) => e.city).filter(Boolean)));

  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [expandedMapIds, setExpandedMapIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleEvents =
    selectedCity === 'ALL'
      ? enabledEvents
      : enabledEvents.filter((e) => e.city === selectedCity);

  const coupleNames =
    config.displayOrder === 'bride-first'
      ? `${config.bride.firstName} & ${config.groom.firstName}`
      : `${config.groom.firstName} & ${config.bride.firstName}`;

  const toggleMap = (id: string) => {
    setExpandedMapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyAddress = (event: WeddingEvent) => {
    const fullText = `${event.venueName} - ${event.address}, ${event.district}/${event.city}`;
    navigator.clipboard?.writeText(fullText);
    setCopiedId(event.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTurkishDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const dt = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      }).format(dt);
    } catch {
      return dateStr;
    }
  };

  const getEventIcon = (type: WeddingEvent['type']) => {
    switch (type) {
      case 'gelin-alma':
        return <Car className="h-5 w-5" />;
      case 'resmi-nikah':
        return <Heart className="h-5 w-5" />;
      case 'after-party':
        return <Music className="h-5 w-5" />;
      case 'kokteyl':
        return <GlassWater className="h-5 w-5" />;
      case 'kiz-isteme':
      case 'brunch':
        return <Coffee className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <section id="etkinlikler" className="py-20 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {cities.length > 1 ? 'İKİ İL • ÇOKLU ETKİNLİK AKIŞI' : 'DÜĞÜN & ETKİNLİK PROGRAMI'}
          </span>

          <h2
            className={`mt-3 text-3xl sm:text-5xl font-semibold ${theme.colors.textPrimary}`}
            style={{ fontFamily: theme.fonts.heading }}
          >
            Program Akışı, Saatler &amp; Konumlar
          </h2>

          <p className={`mx-auto mt-3 max-w-2xl text-sm sm:text-base ${theme.colors.textSecondary}`}>
            {cities.length > 1
              ? `Kutlamalarımız ${cities.join(' ve ')} illerinde gerçekleşecektir. Aşağıdan şehir seçebilir, her etkinlik için haritadan yol tarifi alabilir veya takviminize ekleyebilirsiniz.`
              : 'Gelin alma konvoyundan resmi nikaha, düğün töreninden after party eğlencesine kadar tüm etkinliklerimizin saat ve konum bilgileri aşağıda yer almaktadır.'}
          </p>

          {/* City Filter Tabs (Automatically shown when there are 2+ cities or always useful) */}
          {cities.length > 1 && (
            <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border p-1.5 shadow-sm"
              style={{
                borderColor: `${theme.colors.accent}35`,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCity('ALL')}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCity === 'ALL'
                    ? `${theme.colors.buttonBg} ${theme.colors.buttonText} shadow-md`
                    : `${theme.colors.textSecondary} hover:opacity-80`
                }`}
              >
                Tüm Şehirler ({enabledEvents.length})
              </button>
              {cities.map((city) => {
                const count = enabledEvents.filter((e) => e.city === city).length;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      selectedCity === city
                        ? `${theme.colors.buttonBg} ${theme.colors.buttonText} shadow-md`
                        : `${theme.colors.textSecondary} hover:opacity-80`
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {city} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Cards Timeline */}
        <div className="space-y-6">
          {visibleEvents.map((event, index) => {
            const navLinks = getEventNavigationLinks(event);
            const isMapOpen = !!expandedMapIds[event.id];
            const googleCalUrl = getGoogleCalendarUrl(event, coupleNames);

            return (
              <div
                key={event.id}
                className={`relative overflow-hidden border p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
              >
                {/* Top Accent Bar */}
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: theme.colors.accent }}
                />

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left & Center Info */}
                  <div className="flex-1">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase ${theme.colors.accentSoft}`}
                      >
                        {getEventIcon(event.type)}
                        <span>{event.badgeText || `${index + 1}. ETKİNLİK`}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                      >
                        <MapPin className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                        {event.district ? `${event.district} / ${event.city}` : event.city}
                      </span>
                    </div>

                    {/* Event Title & Subtitle */}
                    <h3
                      className={`text-2xl sm:text-3xl font-bold ${theme.colors.textPrimary}`}
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      {event.title}
                    </h3>
                    {event.subtitle && (
                      <p className={`mt-1 text-sm font-medium ${theme.colors.accentText}`}>
                        {event.subtitle}
                      </p>
                    )}

                    {/* Date & Time Highlight Box */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                      >
                        <Calendar className="h-4 w-4" style={{ color: theme.colors.accent }} />
                        <span>{formatTurkishDate(event.date)}</span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold ${theme.colors.accentSoft}`}
                      >
                        <Clock className="h-4 w-4" />
                        <span>
                          Saat {event.startTime}
                          {event.endTime ? ` - ${event.endTime}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className={`mt-4 text-sm leading-relaxed ${theme.colors.textSecondary}`}>
                        {event.description}
                      </p>
                    )}

                    {/* Venue & Address Box */}
                    <div
                      className={`mt-5 rounded-xl border p-4 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`text-base font-bold ${theme.colors.textPrimary}`}>
                            {event.venueName}
                          </div>
                          <div className={`mt-1 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                            {event.address}{' '}
                            <span className="font-semibold">
                              ({event.district}/{event.city})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyAddress(event)}
                          title="Adresi Kopyala"
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary} hover:opacity-80`}
                        >
                          {copiedId === event.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Adresi Kopyala</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Optional Metadata: Dress Code, Parking, Contact */}
                      {(event.dressCode || event.parkingInfo || event.contactPerson) && (
                        <div
                          className={`mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-xs ${theme.colors.cardBorder} ${theme.colors.textMuted}`}
                        >
                          {event.dressCode && (
                            <span className="inline-flex items-center gap-1.5">
                              <Shirt className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                              <strong>Kıyafet:</strong> {event.dressCode}
                            </span>
                          )}
                          {event.parkingInfo && (
                            <span className="inline-flex items-center gap-1.5">
                              <Car className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                              <strong>Otopark:</strong> {event.parkingInfo}
                            </span>
                          )}
                          {event.contactPerson && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                              <strong>İletişim:</strong> {event.contactPerson}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Column: Directions & Calendar */}
                  <div className="flex flex-col gap-2.5 lg:w-64 shrink-0">
                    <div
                      className={`text-[11px] font-bold tracking-[0.15em] uppercase ${theme.colors.textMuted}`}
                    >
                      HARİTA &amp; YOL TARİFİ AL
                    </div>

                    <a
                      href={navLinks.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold shadow-md transition-all ${theme.colors.buttonBg} ${theme.colors.buttonHoverBg} ${theme.colors.buttonText}`}
                    >
                      <Navigation className="h-4 w-4" />
                      Google Haritalar Yol Tarifi
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={navLinks.appleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all hover:opacity-80 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                      >
                        <MapPin className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                        Apple Harita
                      </a>

                      <a
                        href={navLinks.yandexMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all hover:opacity-80 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                      >
                        <Navigation className="h-3.5 w-3.5" style={{ color: theme.colors.accent }} />
                        Yandex Navi
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMap(event.id)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${theme.colors.accentSoft}`}
                    >
                      <Map className="h-3.5 w-3.5" />
                      {isMapOpen ? 'Harita Önizlemeyi Kapat' : 'Haritayı Kart İçinde Göster'}
                    </button>

                    <div
                      className={`mt-2 pt-2 border-t text-[11px] font-bold tracking-[0.15em] uppercase ${theme.colors.cardBorder} ${theme.colors.textMuted}`}
                    >
                      TAKVİME EKLE
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all hover:opacity-80 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Google Takvim
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadEventIcs(event, coupleNames)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Apple (.ics)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Interactive Map Embed */}
                {isMapOpen && (
                  <div className={`mt-6 overflow-hidden rounded-xl border ${theme.colors.cardBorder}`}>
                    <iframe
                      title={`${event.title} Harita Konumu`}
                      src={navLinks.embedMapUrl}
                      width="100%"
                      height="300"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full border-0"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
