import React, { useState } from 'react';
import {
  Bus,
  Building2,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  Palette,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { WeddingConfig } from '../types/wedding';
import { TemplateTheme } from '../data/templates';
import { sanitizeExternalUrl } from '../utils/securityAndLinks';

interface TravelAndDressSectionProps {
  config: WeddingConfig;
  theme: TemplateTheme;
}

export const TravelAndDressSection: React.FC<TravelAndDressSectionProps> = ({
  config,
  theme,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showTravel =
    config.travelAndStay.enabled &&
    ((config.travelAndStay.shuttleEnabled && config.travelAndStay.shuttles.length > 0) ||
      (config.travelAndStay.hotelsEnabled && config.travelAndStay.hotels.length > 0));

  const showDressCode = config.dressCode.enabled;

  if (!showTravel && !showDressCode) return null;

  const copyDiscountCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section className={`py-20 px-4 ${theme.colors.sectionAltBg}`}>
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Dress Code & Color Palette */}
        {showDressCode && (
          <div
            className={`border p-7 sm:p-10 shadow-lg text-center ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
            >
              <Palette className="h-3.5 w-3.5" />
              STİL &amp; RENK REHBERİ
            </span>

            <h2
              className={`mt-3 text-2xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
              style={{ fontFamily: theme.fonts.heading }}
            >
              {config.dressCode.title}
            </h2>

            <p className={`mx-auto mt-3 max-w-2xl text-sm sm:text-base ${theme.colors.textSecondary}`}>
              {config.dressCode.description}
            </p>

            {/* Color Swatches */}
            {config.dressCode.colors.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-7">
                {config.dressCode.colors.map((color, idx) => (
                  <div key={`${color.name}-${idx}`} className="flex flex-col items-center gap-2">
                    <div
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white/80 shadow-md transition-transform hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} (${color.hex})`}
                    />
                    <span className={`text-xs font-semibold ${theme.colors.textPrimary}`}>
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Gentlemen & Ladies Notes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {config.dressCode.ladiesNote && (
                <div
                  className={`rounded-xl border p-4 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                >
                  <div className={`text-xs font-bold tracking-wider uppercase ${theme.colors.accentText}`}>
                    Hanımefendiler İçin
                  </div>
                  <p className={`mt-1 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                    {config.dressCode.ladiesNote}
                  </p>
                </div>
              )}
              {config.dressCode.gentlemenNote && (
                <div
                  className={`rounded-xl border p-4 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                >
                  <div className={`text-xs font-bold tracking-wider uppercase ${theme.colors.accentText}`}>
                    Beyefendiler İçin
                  </div>
                  <p className={`mt-1 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                    {config.dressCode.gentlemenNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shuttle & Hotel Information */}
        {showTravel && (
          <div>
            <div className="text-center mb-10">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                ULAŞIM &amp; KONAKLAMA REHBERİ
              </span>
              <h2
                className={`mt-3 text-3xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                Servis Saatleri &amp; Anlaşmalı Oteller
              </h2>
              <p className={`mx-auto mt-2 max-w-2xl text-sm ${theme.colors.textSecondary}`}>
                Şehir dışından katılacak veya servis kullanacak misafirlerimiz için ulaşım ve konaklama detayları.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shuttles Column */}
              {config.travelAndStay.shuttleEnabled && config.travelAndStay.shuttles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5" style={{ color: theme.colors.accent }} />
                    <h3
                      className={`text-xl font-bold ${theme.colors.textPrimary}`}
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Misafir Servis Güzergahları
                    </h3>
                  </div>

                  {config.travelAndStay.shuttles.map((shuttle) => (
                    <div
                      key={shuttle.id}
                      className={`border p-5 shadow-md ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-base font-bold ${theme.colors.textPrimary}`}>
                          {shuttle.title}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.colors.accentSoft}`}
                        >
                          {shuttle.city}
                        </span>
                      </div>

                      <div className={`mt-3 space-y-1.5 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: theme.colors.accent }} />
                          <span>
                            <strong>Kalkış Noktası:</strong> {shuttle.departurePoint}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" style={{ color: theme.colors.accent }} />
                          <span>
                            <strong>Kalkış:</strong> {shuttle.departureTime}
                            {shuttle.returnTime ? ` • Dönüş: ${shuttle.returnTime}` : ''}
                          </span>
                        </div>
                        {shuttle.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0" style={{ color: theme.colors.accent }} />
                            <span>
                              <strong>Servis Sorumlusu:</strong> {shuttle.contactPhone}
                            </span>
                          </div>
                        )}
                      </div>

                      {shuttle.notes && (
                        <p className={`mt-3 text-xs italic ${theme.colors.textMuted}`}>
                          {shuttle.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Hotels Column */}
              {config.travelAndStay.hotelsEnabled && config.travelAndStay.hotels.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" style={{ color: theme.colors.accent }} />
                    <h3
                      className={`text-xl font-bold ${theme.colors.textPrimary}`}
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Önerilen &amp; Anlaşmalı Oteller
                    </h3>
                  </div>

                  {config.travelAndStay.hotels.map((hotel) => {
                    const safeMapUrl = sanitizeExternalUrl(hotel.mapUrl);
                    return (
                      <div
                        key={hotel.id}
                        className={`border p-5 shadow-md ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-base font-bold ${theme.colors.textPrimary}`}>
                            {hotel.name}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.colors.accentSoft}`}
                          >
                            {hotel.city}
                          </span>
                        </div>

                        <p className={`mt-1 text-xs font-medium ${theme.colors.accentText}`}>
                          {hotel.distanceToVenue}
                        </p>

                        {hotel.notes && (
                          <p className={`mt-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                            {hotel.notes}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {hotel.discountCode && (
                            <button
                              type="button"
                              onClick={() => copyDiscountCode(hotel.discountCode!)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${theme.colors.accentSoft}`}
                            >
                              {copiedCode === hotel.discountCode ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Kod Kopyalandı!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>İndirim Kodu: {hotel.discountCode}</span>
                                </>
                              )}
                            </button>
                          )}

                          {hotel.phone && (
                            <a
                              href={`tel:${hotel.phone.replace(/\s+/g, '')}`}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {hotel.phone}
                            </a>
                          )}

                          {safeMapUrl && (
                            <a
                              href={safeMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Haritada Gör
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
