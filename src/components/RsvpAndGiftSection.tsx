import React, { useState } from 'react';
import {
  Check,
  Copy,
  Gift,
  HelpCircle,
  Heart,
  MessageCircle,
  Send,
  Users,
  ChevronDown,
  MapPin,
  Phone,
} from 'lucide-react';
import { GuestNote, WeddingConfig } from '../types/wedding';
import { TemplateTheme } from '../data/templates';
import {
  sanitizeExternalUrl,
  sanitizePhoneForWhatsApp,
  sanitizeText,
} from '../utils/securityAndLinks';

interface RsvpAndGiftSectionProps {
  config: WeddingConfig;
  theme: TemplateTheme;
  guestNameFromUrl: string;
  guestNotes: GuestNote[];
  onGuestNotesUpdated: (notes: GuestNote[]) => void;
}

export const RsvpAndGiftSection: React.FC<RsvpAndGiftSectionProps> = ({
  config,
  theme,
  guestNameFromUrl,
  guestNotes,
  onGuestNotesUpdated,
}) => {
  const enabledEvents = config.events.filter((e) => e.enabled);

  const [fullName, setFullName] = useState(guestNameFromUrl || '');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    enabledEvents.map((e) => e.id)
  );
  const [needShuttle, setNeedShuttle] = useState(false);
  const [dietaryOrMessage, setDietaryOrMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [copiedIbanId, setCopiedIbanId] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    config.faqs[0]?.id || null
  );

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const buildWhatsAppUrl = () => {
    const cleanPhone = sanitizePhoneForWhatsApp(config.rsvp.whatsappNumber || '');
    const chosenEvents = enabledEvents
      .filter((e) => selectedEventIds.includes(e.id))
      .map((e) => `• ${e.city} - ${e.title} (${e.startTime})`)
      .join('\n');

    const statusLine =
      attending === 'yes'
        ? `✅ Katılıyorum (${guestCount} Kişi)`
        : '❌ Maalesef Katılamıyorum';

    const shuttleLine =
      attending === 'yes' && config.rsvp.askShuttleNeed
        ? `\n🚌 Servis Talebi: ${needShuttle ? 'Evet, kullanacağım' : 'Hayır'}`
        : '';

    const messageText = [
      `Merhaba ${config.bride.firstName} & ${config.groom.firstName}! 💍`,
      `LCV / Katılım Bildirimim:`,
      `👤 Ad Soyad: ${sanitizeText(fullName, 100)}`,
      phone ? `📞 Tel: ${sanitizeText(phone, 30)}` : '',
      `📌 Durum: ${statusLine}`,
      attending === 'yes' && chosenEvents
        ? `\n📍 Katılacağım Etkinlikler:\n${chosenEvents}`
        : '',
      shuttleLine,
      dietaryOrMessage
        ? `\n💌 Not / Mesaj: ${sanitizeText(dietaryOrMessage, 300)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const encoded = encodeURIComponent(messageText);
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(fullName, 80);
    if (!cleanName || isSending) return;

    setIsSending(true);
    const cleanMessage = sanitizeText(dietaryOrMessage, 350);
    const cleanRelation = sanitizeText(relation, 60) || 'Davetli';
    const cleanPhone = sanitizeText(phone, 30);

    const selectedCities = Array.from(
      new Set(
        enabledEvents
          .filter((ev) => selectedEventIds.includes(ev.id))
          .map((ev) => ev.city)
      )
    );

    const selectedEventTitles = enabledEvents
      .filter((ev) => selectedEventIds.includes(ev.id))
      .map((ev) => `${ev.city} - ${ev.title}`);

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          relation: cleanRelation,
          phone: cleanPhone,
          attending,
          guestCount: attending === 'yes' ? guestCount : 0,
          events: attending === 'yes' ? selectedEventTitles : [],
          cities: attending === 'yes' ? selectedCities : [],
          needShuttle: attending === 'yes' ? needShuttle : false,
          message: cleanMessage,
        }),
      });
      const data = await res.json();
      if (data.guestNotes && Array.isArray(data.guestNotes)) {
        onGuestNotesUpdated(data.guestNotes);
      }
    } catch {
      // Fallback local update if offline
      if (cleanMessage && config.rsvp.memoryWallEnabled) {
        const newNote: GuestNote = {
          id: `gn-${Date.now()}`,
          name: cleanName,
          relation: cleanRelation,
          message: cleanMessage,
          createdAt: 'Şimdi',
          attendingCities: attending === 'yes' ? selectedCities : [],
        };
        onGuestNotesUpdated([newNote, ...guestNotes]);
      }
    }

    const safeWebhook = sanitizeExternalUrl(config.rsvp.webhookUrl);
    if (safeWebhook) {
      try {
        await fetch(safeWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: cleanName,
            relation: cleanRelation,
            phone: cleanPhone,
            attending,
            guestCount: attending === 'yes' ? guestCount : 0,
            events: selectedEventTitles,
            needShuttle,
            message: cleanMessage,
            submittedAt: new Date().toISOString(),
          }),
        });
      } catch {
        // Non-blocking webhook call
      }
    }

    setIsSending(false);
    setSubmitted(true);
  };

  const handleCopyIban = (id: string, iban: string) => {
    navigator.clipboard?.writeText(iban.replace(/\s+/g, ''));
    setCopiedIbanId(id);
    window.setTimeout(() => setCopiedIbanId(null), 2000);
  };

  return (
    <section id="lcv" className="py-20 px-4">
      <div className="mx-auto max-w-5xl space-y-20">
        {/* RSVP / LCV Form */}
        {config.rsvp.enabled && (
          <div
            className={`border p-6 sm:p-10 shadow-xl ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
          >
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
              >
                <Users className="h-3.5 w-3.5" />
                LCV • KATILIM BİLDİRİMİ
              </span>

              <h2
                className={`mt-3 text-3xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                Aramızda Olacak mısınız?
              </h2>

              <p className={`mt-2 text-sm sm:text-base ${theme.colors.textSecondary}`}>
                Sizi en güzel şekilde ağırlayabilmemiz ve masa/servis planlamamızı yapabilmemiz için lütfen katılım durumunuzu bildirin.
              </p>
            </div>

            <form onSubmit={handleSubmitRsvp} className="mx-auto max-w-2xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme.colors.textSecondary}`}>
                    Adınız &amp; Soyadınız *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz ve Ailesi"
                    className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-2 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme.colors.textSecondary}`}>
                    Telefon Numaranız
                  </label>
                  <div className="relative">
                    <Phone className={`pointer-events-none absolute left-3 top-3.5 h-4 w-4 ${theme.colors.textMuted}`} />
                    <input
                      type="tel"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className={`w-full rounded-xl border pl-9 pr-3.5 py-3 text-sm outline-none transition-all focus:ring-2 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme.colors.textSecondary}`}>
                    Yakınlık Dereceniz
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="Örn: Arkadaşı, Akrabası"
                    className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-2 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                  />
                </div>
              </div>

              {/* Attendance Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttending('yes')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    attending === 'yes'
                      ? `${theme.colors.buttonBg} ${theme.colors.buttonText} shadow-md`
                      : `${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`
                  }`}
                >
                  <Check className="h-4 w-4" />
                  Keyifle Katılıyorum
                </button>

                <button
                  type="button"
                  onClick={() => setAttending('no')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    attending === 'no'
                      ? `${theme.colors.buttonBg} ${theme.colors.buttonText} shadow-md`
                      : `${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`
                  }`}
                >
                  Maalesef Katılamıyorum
                </button>
              </div>

              {attending === 'yes' && (
                <>
                  {/* Guest Count */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme.colors.textSecondary}`}>
                      Toplam Katılımcı Sayısı
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        { length: Math.min(10, Math.max(1, config.rsvp.maxGuestsPerInvite || 6)) },
                        (_, i) => i + 1
                      ).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestCount(num)}
                          className={`h-10 w-12 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            guestCount === num
                              ? `${theme.colors.buttonBg} ${theme.colors.buttonText} shadow`
                              : `${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Event / Multi-City Selection */}
                  {config.rsvp.allowEventSelection && enabledEvents.length > 1 && (
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme.colors.textSecondary}`}>
                        Hangi Etkinliklere / Şehirlere Katılacaksınız?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {enabledEvents.map((ev) => {
                          const isChecked = selectedEventIds.includes(ev.id);
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => toggleEventSelection(ev.id)}
                              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                                isChecked
                                  ? `${theme.colors.accentSoft} ring-1 ring-current`
                                  : `${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary} opacity-75`
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  isChecked
                                    ? 'bg-current border-current'
                                    : 'border-current/40'
                                }`}
                              >
                                {isChecked && (
                                  <Check
                                    className={`h-3.5 w-3.5 ${
                                      theme.isDark ? 'text-zinc-950' : 'text-white'
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="text-xs">
                                <div className={`font-bold ${theme.colors.textPrimary}`}>
                                  {ev.title}
                                </div>
                                <div className={`mt-0.5 flex items-center gap-1 ${theme.colors.textMuted}`}>
                                  <MapPin className="h-3 w-3" />
                                  {ev.city} ({ev.district}) • Saat {ev.startTime}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Shuttle Checkbox */}
                  {config.rsvp.askShuttleNeed && config.travelAndStay.shuttleEnabled && (
                    <label
                      className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                    >
                      <input
                        type="checkbox"
                        checked={needShuttle}
                        onChange={(e) => setNeedShuttle(e.target.checked)}
                        className="h-4 w-4 accent-amber-600"
                      />
                      <span className={`text-xs sm:text-sm font-medium ${theme.colors.textPrimary}`}>
                        Misafir servisini (Shuttle) kullanmak istiyorum
                      </span>
                    </label>
                  )}
                </>
              )}

              {/* Message / Note */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme.colors.textSecondary}`}>
                  Çifte Mutluluk Mesajınız veya Özel Notunuz (Menü / Alerji vb.)
                </label>
                <textarea
                  rows={3}
                  maxLength={350}
                  value={dietaryOrMessage}
                  onChange={(e) => setDietaryOrMessage(e.target.value)}
                  placeholder="Bir ömür boyu mutluluklar dileriz..."
                  className={`w-full rounded-xl border p-3.5 text-sm outline-none transition-all focus:ring-2 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary}`}
                />
              </div>

              {/* Submit & WhatsApp Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg transition-all cursor-pointer disabled:opacity-60 ${theme.colors.buttonBg} ${theme.colors.buttonHoverBg} ${theme.colors.buttonText}`}
                >
                  <Send className="h-4 w-4" />
                  {isSending
                    ? 'Kaydediliyor...'
                    : submitted
                    ? 'LCV Sunucuya Kaydedildi ✓'
                    : 'LCV Bildirimini Kaydet'}
                </button>

                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp ile Gönder
                </a>
              </div>

              {submitted && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Katılım bildiriminiz ve mesajınız başarıyla kaydedildi! Dilerseniz yanındaki yeşil butonla WhatsApp üzerinden de doğrudan iletebilirsiniz.
                </div>
              )}
            </form>
          </div>
        )}

        {/* Guest Memory Wall (Anı Defteri) */}
        {config.rsvp.memoryWallEnabled && guestNotes.length > 0 && (
          <div>
            <div className="text-center mb-10">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
              >
                <Heart className="h-3.5 w-3.5" />
                DİJİTAL ANI DEFTERİ
              </span>
              <h2
                className={`mt-3 text-3xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                Sevdiklerimizden Mutluluk Mesajları
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guestNotes.map((note) => (
                <div
                  key={note.id}
                  className={`border p-5 shadow-md ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`text-sm font-bold ${theme.colors.textPrimary}`}>
                        {note.name}
                      </h4>
                      <span className={`text-xs ${theme.colors.textMuted}`}>
                        {note.relation} • {note.createdAt}
                      </span>
                    </div>
                    {note.attendingCities && note.attendingCities.length > 0 && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${theme.colors.accentSoft}`}
                      >
                        {note.attendingCities.join(' & ')}
                      </span>
                    )}
                  </div>
                  <p className={`mt-3 text-xs sm:text-sm italic leading-relaxed ${theme.colors.textSecondary}`}>
                    “{note.message}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gift & IBAN Section */}
        {config.gift.enabled && config.gift.accounts.length > 0 && (
          <div
            className={`border p-6 sm:p-10 shadow-lg text-center ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
            >
              <Gift className="h-3.5 w-3.5" />
              ONLINE TAKI &amp; HEDİYE
            </span>

            <h2
              className={`mt-3 text-2xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
              style={{ fontFamily: theme.fonts.heading }}
            >
              {config.gift.title}
            </h2>

            <p className={`mx-auto mt-2 max-w-2xl text-xs sm:text-sm ${theme.colors.textSecondary}`}>
              {config.gift.description}
            </p>

            {config.gift.transferNote && (
              <div
                className={`mx-auto mt-4 max-w-2xl rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium ${theme.colors.accentSoft}`}
              >
                {config.gift.transferNote}
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {config.gift.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 ${theme.colors.sectionAltBg} ${theme.colors.cardBorder}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold ${theme.colors.textPrimary}`}>
                        {acc.ownerName}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${theme.colors.accentSoft}`}
                      >
                        {acc.currency}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-xs ${theme.colors.textMuted}`}>
                      {acc.bankName}
                    </p>
                    <p
                      className={`mt-3 font-mono text-xs sm:text-sm font-semibold tracking-wider select-all ${theme.colors.textPrimary}`}
                    >
                      {acc.iban}
                    </p>
                    {acc.descriptionNote && (
                      <p
                        className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                      >
                        📝 {acc.descriptionNote}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyIban(acc.id, acc.iban)}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all cursor-pointer ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.colors.textPrimary} hover:opacity-85`}
                  >
                    {copiedIbanId === acc.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>IBAN Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>IBAN Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        {config.faqEnabled && config.faqs.length > 0 && (
          <div>
            <div className="text-center mb-10">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] uppercase ${theme.colors.accentSoft}`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                SIKÇA SORULAN SORULAR
              </span>
              <h2
                className={`mt-3 text-2xl sm:text-4xl font-semibold ${theme.colors.textPrimary}`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                Merak Edilen Detaylar
              </h2>
            </div>

            <div className="mx-auto max-w-3xl space-y-3">
              {config.faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`overflow-hidden border transition-all ${theme.colors.cardBg} ${theme.colors.cardBorder} ${theme.cardRadius}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className={`flex w-full items-center justify-between gap-4 p-5 text-left text-sm sm:text-base font-bold cursor-pointer ${theme.colors.textPrimary}`}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className={`border-t px-5 pb-5 pt-3 text-xs sm:text-sm leading-relaxed ${theme.colors.cardBorder} ${theme.colors.textSecondary}`}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
