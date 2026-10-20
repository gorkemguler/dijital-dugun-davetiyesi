export type TemplateId =
  | 'royal-palace'
  | 'bohemian-garden'
  | 'modern-editorial'
  | 'midnight-gala'
  | 'aegean-breeze'
  | 'romantic-blossom';

export type WeddingSetupMode = 'single-city' | 'dual-city' | 'multi-event';

export type EventType =
  | 'kiz-isteme'
  | 'nisan'
  | 'kina'
  | 'gelin-alma'
  | 'resmi-nikah'
  | 'kokteyl'
  | 'dugun'
  | 'dugun-2'
  | 'after-party'
  | 'brunch'
  | 'custom';

export interface WeddingEvent {
  id: string;
  type: EventType;
  enabled: boolean;
  badgeText?: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  city: string;
  district: string;
  venueName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  appleMapsUrl?: string;
  yandexMapsUrl?: string;
  description?: string;
  dressCode?: string;
  parkingInfo?: string;
  contactPerson?: string;
}

export interface PersonInfo {
  firstName: string;
  lastName: string;
  motherName: string;
  fatherName: string;
  familyTitle: string;
  photoUrl?: string;
  bio?: string;
}

export interface CustomAnnouncementNote {
  id: string;
  badge: string;
  title: string;
  content: string;
  highlight?: boolean;
}

export interface ShuttleInfo {
  id: string;
  title: string;
  city: string;
  departurePoint: string;
  departureTime: string;
  returnTime?: string;
  contactPhone?: string;
  notes?: string;
}

export interface HotelInfo {
  id: string;
  name: string;
  city: string;
  distanceToVenue: string;
  discountCode?: string;
  phone?: string;
  mapUrl?: string;
  notes?: string;
}

export interface TravelAndStayConfig {
  enabled: boolean;
  shuttleEnabled: boolean;
  shuttles: ShuttleInfo[];
  hotelsEnabled: boolean;
  hotels: HotelInfo[];
}

export interface DressCodeColor {
  name: string;
  hex: string;
}

export interface DressCodeConfig {
  enabled: boolean;
  title: string;
  description: string;
  colors: DressCodeColor[];
  gentlemenNote: string;
  ladiesNote: string;
}

export interface StoryMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
}

export interface BankAccountInfo {
  id: string;
  ownerName: string;
  bankName: string;
  currency: 'TRY' | 'EUR' | 'USD' | 'ALTIN';
  iban: string;
  descriptionNote?: string;
}

export interface GiftConfig {
  enabled: boolean;
  title: string;
  description: string;
  transferNote?: string;
  accounts: BankAccountInfo[];
}

export interface RsvpConfig {
  enabled: boolean;
  deadlineDate: string;
  allowEventSelection: boolean;
  askDietaryOrNote: boolean;
  askShuttleNeed: boolean;
  maxGuestsPerInvite: number;
  whatsappNumber: string;
  webhookUrl?: string;
  memoryWallEnabled: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type BuiltInMelody = 'romantic-waltz' | 'classic-harp' | 'dreamy-musicbox' | 'custom-url';

export interface EnvelopeAndMusicConfig {
  requireEnvelopeClick: boolean;
  envelopeTitle: string;
  envelopeSubtitle: string;
  waxSealInitials: string;
  musicEnabled: boolean;
  musicMelody: BuiltInMelody;
  musicTitle: string;
  customMusicUrl?: string;
}

export interface GuestNote {
  id: string;
  name: string;
  relation: string;
  message: string;
  createdAt: string;
  attendingCities?: string[];
}

export type AlbumVisibilityMode = 'moderated' | 'admin-only' | 'public-auto';

export interface AlbumMediaItem {
  id: string;
  url: string;
  mediaType: 'image' | 'video';
  mimeType: string;
  uploaderName: string;
  caption?: string;
  eventTag?: string;
  approved: boolean;
  createdAt: string;
}

export interface RsvpSubmission {
  id: string;
  fullName: string;
  relation: string;
  phone?: string;
  attending: 'yes' | 'no';
  guestCount: number;
  events: string[];
  cities: string[];
  needShuttle: boolean;
  message?: string;
  createdAt: string;
}

export interface WeddingConfig {
  version: string;
  templateId: TemplateId;
  setupMode: WeddingSetupMode;
  showStudioButton: boolean;
  language: 'tr' | 'en';
  primaryDate: string; // Main wedding countdown target YYYY-MM-DDTHH:mm
  bride: PersonInfo;
  groom: PersonInfo;
  displayOrder: 'bride-first' | 'groom-first';
  hashtag: string;
  heroTitle: string;
  invitationQuote: string;
  invitationSubtext: string;
  heroPhotoUrl: string;
  customNotesEnabled?: boolean;
  customNotesTitle?: string;
  customNotes?: CustomAnnouncementNote[];
  events: WeddingEvent[];
  storyEnabled: boolean;
  storyMilestones: StoryMilestone[];
  travelAndStay: TravelAndStayConfig;
  dressCode: DressCodeConfig;
  galleryEnabled: boolean;
  galleryPhotos: GalleryPhoto[];
  guestPhotoUploadEnabled: boolean;
  albumVisibilityMode?: AlbumVisibilityMode;
  albumUploadPin?: string;
  showPublicAlbumWall?: boolean;
  guestPhotoUploadUrl: string;
  guestPhotoUploadNote: string;
  gift: GiftConfig;
  rsvp: RsvpConfig;
  faqEnabled: boolean;
  faqs: FaqItem[];
  envelopeAndMusic: EnvelopeAndMusicConfig;
  initialGuestNotes: GuestNote[];
}
