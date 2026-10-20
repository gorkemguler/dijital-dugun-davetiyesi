import { WeddingConfig, WeddingEvent } from '../types/wedding';

/**
 * Cleans and limits text input to prevent injection or oversized payloads.
 */
export function sanitizeText(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Strictly validates external URLs to allow only http:// or https:// protocols.
 * Prevents javascript:, data:, file: or malformed URI attacks.
 */
export function sanitizeExternalUrl(url: string | undefined, fallback = ''): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Formats a phone number into safe digits-only format for WhatsApp wa.me links.
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return '9' + digits; // 0532... -> 90532...
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    return '90' + digits;
  }
  return digits.slice(0, 15);
}

/**
 * Generates Google Maps, Apple Maps, Yandex Maps, and safe Embed Map URLs for an event.
 */
export function getEventNavigationLinks(event: WeddingEvent) {
  const hasCoords =
    typeof event.latitude === 'number' &&
    typeof event.longitude === 'number' &&
    !Number.isNaN(event.latitude) &&
    !Number.isNaN(event.longitude);

  const queryText = [event.venueName, event.address, event.district, event.city]
    .filter(Boolean)
    .join(', ');
  const encodedQuery = encodeURIComponent(queryText || 'Türkiye');

  const googleMapsUrl =
    sanitizeExternalUrl(event.googleMapsUrl) ||
    (hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`);

  const appleMapsUrl =
    sanitizeExternalUrl(event.appleMapsUrl) ||
    (hasCoords
      ? `https://maps.apple.com/?daddr=${event.latitude},${event.longitude}&dirflg=d`
      : `https://maps.apple.com/?daddr=${encodedQuery}&dirflg=d`);

  const yandexMapsUrl =
    sanitizeExternalUrl(event.yandexMapsUrl) ||
    (hasCoords
      ? `https://yandex.com.tr/harita/?rtext=~${event.latitude},${event.longitude}&rtt=auto`
      : `https://yandex.com.tr/harita/?text=${encodedQuery}`);

  const embedMapUrl = hasCoords
    ? `https://maps.google.com/maps?q=${event.latitude},${event.longitude}&hl=tr&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodedQuery}&hl=tr&z=15&output=embed`;

  return {
    googleMapsUrl,
    appleMapsUrl,
    yandexMapsUrl,
    embedMapUrl,
  };
}

/**
 * Generates a Google Calendar link for a specific wedding event.
 */
export function getGoogleCalendarUrl(event: WeddingEvent, coupleNames: string): string {
  const cleanDate = (event.date || '2026-08-22').replace(/-/g, '');
  const cleanStart = (event.startTime || '19:00').replace(/:/g, '') + '00';
  let cleanEnd = '235900';
  if (event.endTime) {
    cleanEnd = event.endTime.replace(/:/g, '') + '00';
  } else {
    const startHour = parseInt((event.startTime || '19:00').split(':')[0] || '19', 10);
    const endHour = Math.min(23, startHour + 3);
    cleanEnd = `${String(endHour).padStart(2, '0')}0000`;
  }

  const title = encodeURIComponent(`${coupleNames} - ${event.title}`);
  const details = encodeURIComponent(
    `${event.title}\nMekan: ${event.venueName}\nAdres: ${event.address}, ${event.district}/${event.city}${
      event.description ? `\nNot: ${event.description}` : ''
    }`
  );
  const location = encodeURIComponent(`${event.venueName}, ${event.address}, ${event.district} ${event.city}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T${cleanStart}/${cleanDate}T${cleanEnd}&details=${details}&location=${location}`;
}

/**
 * Downloads an .ics calendar file for Apple Calendar / Outlook.
 */
export function downloadEventIcs(event: WeddingEvent, coupleNames: string): void {
  const cleanDate = (event.date || '2026-08-22').replace(/-/g, '');
  const cleanStart = (event.startTime || '19:00').replace(/:/g, '') + '00';
  const startHour = parseInt((event.startTime || '19:00').split(':')[0] || '19', 10);
  const endHour = Math.min(23, startHour + 3);
  const cleanEnd = event.endTime
    ? event.endTime.replace(/:/g, '') + '00'
    : `${String(endHour).padStart(2, '0')}0000`;

  const EscapeIcs = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dijital Dugun Davetiyesi//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}-${Date.now()}@dijitaldavetiye.local`,
    `DTSTAMP:${cleanDate}T${cleanStart}Z`,
    `DTSTART:${cleanDate}T${cleanStart}`,
    `DTEND:${cleanDate}T${cleanEnd}`,
    `SUMMARY:${EscapeIcs(`${coupleNames} - ${event.title}`)}`,
    `LOCATION:${EscapeIcs(`${event.venueName}, ${event.address}, ${event.district}/${event.city}`)}`,
    `DESCRIPTION:${EscapeIcs(event.description || `${coupleNames} ${event.title}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.id || 'davetiye'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Safely validates and merges an imported JSON config with default config,
 * stripping out any prototype pollution keys (__proto__, constructor, prototype).
 */
export function safeMergeConfig(rawJson: string, fallback: WeddingConfig): WeddingConfig {
  const parsed = JSON.parse(rawJson, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Geçersiz yapılandırma dosyası formatı.');
  }

  return {
    ...fallback,
    ...parsed,
    bride: { ...fallback.bride, ...(parsed.bride || {}) },
    groom: { ...fallback.groom, ...(parsed.groom || {}) },
    travelAndStay: { ...fallback.travelAndStay, ...(parsed.travelAndStay || {}) },
    dressCode: { ...fallback.dressCode, ...(parsed.dressCode || {}) },
    gift: { ...fallback.gift, ...(parsed.gift || {}) },
    rsvp: { ...fallback.rsvp, ...(parsed.rsvp || {}) },
    envelopeAndMusic: { ...fallback.envelopeAndMusic, ...(parsed.envelopeAndMusic || {}) },
    events: Array.isArray(parsed.events) ? parsed.events : fallback.events,
  };
}
