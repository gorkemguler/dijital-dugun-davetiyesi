import React, { useEffect, useState } from 'react';
import {
  X,
  Palette,
  Users,
  MapPin,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  Copy,
  Share2,
  Bus,
  Gift,
  Music,
  Lock,
  Save,
  ClipboardList,
  Camera,
  LogOut,
  ShieldCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Building2,
  Shirt,
  Heart,
  Image as ImageIcon,
  HelpCircle,
  Megaphone,
  Info,
} from 'lucide-react';
import {
  AlbumMediaItem,
  EventType,
  RsvpSubmission,
  TemplateId,
  WeddingConfig,
  WeddingEvent,
} from '../types/wedding';
import {
  EVENT_TYPE_META,
  SCENARIO_PRESETS,
  TEMPLATES,
} from '../data/templates';
import { safeMergeConfig } from '../utils/securityAndLinks';

interface SetupStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WeddingConfig;
  isSetupCompleted: boolean;
  isAdmin: boolean;
  adminToken: string;
  albumItems: AlbumMediaItem[];
  onAdminAuthenticated: (token: string) => void;
  onAdminLogout: () => void;
  onChangeConfig: (newConfig: WeddingConfig) => void;
  onConfigSavedToServer: (newConfig: WeddingConfig, setupCompleted: boolean) => void;
  onAlbumItemsChanged: (items: AlbumMediaItem[]) => void;
  onResetDefault: () => void;
}

type StudioTab =
  | 'templates'
  | 'couple'
  | 'events'
  | 'extras'
  | 'share-export'
  | 'rsvps'
  | 'album-admin';

export const SetupStudioModal: React.FC<SetupStudioModalProps> = ({
  isOpen,
  onClose,
  config,
  isSetupCompleted,
  isAdmin,
  adminToken,
  albumItems,
  onAdminAuthenticated,
  onAdminLogout,
  onChangeConfig,
  onConfigSavedToServer,
  onAlbumItemsChanged,
  onResetDefault,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('templates');
  const [guestInviteName, setGuestInviteName] = useState('Ahmet Yılmaz ve Ailesi');
  const [copiedGuestLink, setCopiedGuestLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Auth & Save States
  const [loginPassword, setLoginPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // RSVP Admin List
  const [rsvps, setRsvps] = useState<RsvpSubmission[]>([]);
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  const [storageStats, setStorageStats] = useState<{
    usedBytes: number;
    maxStorageGB: number;
    maxAlbumItems: number;
  }>({
    usedBytes: 0,
    maxStorageGB: config.maxTotalStorageGB || 50,
    maxAlbumItems: config.maxAlbumItems || 10000,
  });

  useEffect(() => {
    if (isOpen && activeTab === 'rsvps' && (isAdmin || !isSetupCompleted)) {
      setLoadingRsvps(true);
      fetch('/api/admin/rsvps', {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.rsvps)) setRsvps(d.rsvps);
        })
        .catch(() => {})
        .finally(() => setLoadingRsvps(false));
    }
  }, [isOpen, activeTab, isAdmin, isSetupCompleted, adminToken]);

  useEffect(() => {
    if (isOpen && activeTab === 'album-admin' && (isAdmin || !isSetupCompleted)) {
      fetch('/api/admin/album', {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.albumItems)) {
            onAlbumItemsChanged(d.albumItems);
          }
          if (d.storageStats) {
            setStorageStats(d.storageStats);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, activeTab, isAdmin, isSetupCompleted, adminToken]);

  if (!isOpen) return null;

  // If setup is completed and visitor is NOT logged in as admin -> Show Login Gate!
  if (isSetupCompleted && !isAdmin) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: loginPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Giriş başarısız.');
          return;
        }
        if (data.token) {
          onAdminAuthenticated(data.token);
          setLoginPassword('');
        }
      } catch {
        setAuthError('Sunucuya bağlanılamadı.');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 text-zinc-100 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Yönetici Girişi</h2>
                <p className="text-xs text-zinc-400">
                  Davetiyeyi düzenlemek veya LCV listesini görmek için şifrenizi girin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                required
                autoFocus
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-zinc-950 transition-all cursor-pointer"
            >
              Stüdyoyu Aç
            </button>
          </form>
        </div>
      </div>
    );
  }

  const updateField = <K extends keyof WeddingConfig>(
    key: K,
    value: WeddingConfig[K]
  ) => {
    onChangeConfig({ ...config, [key]: value });
  };

  // Save directly to server & lock public access
  const handleSaveToServer = async () => {
    setAuthError(null);
    setSaveBanner(null);

    if (!isSetupCompleted && newAdminPassword.trim().length < 4) {
      setAuthError(
        'Sitenizi yayına alırken başkalarının ayarlarınızı değiştirememesi için lütfen en az 4 karakterli bir Yönetici Şifresi belirleyin (Sağ üstteki kutucuk).'
      );
      return;
    }

    setIsSaving(true);
    try {
      const updatedConfig: WeddingConfig = {
        ...config,
        showStudioButton: false, // Hide floating studio button for public guests once saved!
      };

      const res = await fetch('/api/admin/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({
          config: updatedConfig,
          adminPassword: newAdminPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kaydetme başarısız oldu.');
      }

      if (data.token) {
        onAdminAuthenticated(data.token);
      }

      onConfigSavedToServer(updatedConfig, true);
      setNewAdminPassword('');
      setSaveBanner(
        '✅ Ayarlarınız sunucuya kaydedildi ve yayına alındı! Misafirleriniz artık sadece davetiyeyi görecek. Siz yönetici olarak istediğiniz zaman en alttaki kilit ikonundan veya ?yonetim=1 adresinden tekrar düzenleyebilirsiniz.'
      );
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Sunucuya kaydedilirken hata oluştu.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Event Management Helpers
  const addNewEvent = (type: EventType) => {
    const meta = EVENT_TYPE_META[type];
    const newEvt: WeddingEvent = {
      id: `evt-${Date.now()}`,
      type,
      enabled: true,
      badgeText: meta.label.toUpperCase(),
      title: meta.defaultTitle,
      subtitle: '',
      date: config.primaryDate.split('T')[0] || '2026-11-14',
      startTime:
        type === 'gelin-alma'
          ? '14:00'
          : type === 'resmi-nikah'
          ? '18:30'
          : type === 'after-party'
          ? '23:30'
          : '19:30',
      endTime: '',
      city: config.events[0]?.city || 'İstanbul',
      district: config.events[0]?.district || 'Beşiktaş',
      venueName: 'Mekan Adı Giriniz',
      address: 'Açık adres bilgisini buraya giriniz',
      description: '',
      dressCode: '',
      parkingInfo: '',
      contactPerson: '',
    };
    updateField('events', [...config.events, newEvt]);
  };

  const updateEvent = (index: number, patch: Partial<WeddingEvent>) => {
    const next = [...config.events];
    next[index] = { ...next[index], ...patch };
    updateField('events', next);
  };

  const removeEvent = (index: number) => {
    const next = config.events.filter((_, i) => i !== index);
    updateField('events', next);
  };

  const moveEvent = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= config.events.length) return;
    const next = [...config.events];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    updateField('events', next);
  };

  const applyScenarioPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChangeConfig({
      ...config,
      setupMode: preset.setupMode,
      events: preset.events.map((e) => ({ ...e })),
    });
  };

  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weddingConfig.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const merged = safeMergeConfig(String(reader.result || ''), config);
        onChangeConfig(merged);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : 'Geçersiz JSON dosyası.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteRsvp = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/rsvps/${id}`, {
        method: 'DELETE',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data.rsvps)) setRsvps(data.rsvps);
    } catch {
      // ignore
    }
  };

  const escapeCsvCell = (val: unknown) => {
    let str = String(val ?? '').replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const handleExportRsvpCsv = () => {
    const header = [
      'Ad Soyad',
      'Telefon',
      'Yakınlık',
      'Durum',
      'Kişi Sayısı',
      'Şehirler',
      'Etkinlikler',
      'Servis Talebi',
      'Mesaj / Not',
      'Tarih',
    ];
    const rows = rsvps.map((r) => [
      escapeCsvCell(r.fullName),
      escapeCsvCell(r.phone),
      escapeCsvCell(r.relation),
      escapeCsvCell(r.attending === 'yes' ? 'Katılıyor' : 'Katılamıyor'),
      Number(r.guestCount) || 0,
      escapeCsvCell((r.cities || []).join(', ')),
      escapeCsvCell((r.events || []).join(' | ')),
      escapeCsvCell(r.needShuttle ? 'Evet' : 'Hayır'),
      escapeCsvCell(r.message),
      escapeCsvCell(r.createdAt),
    ]);
    const csv = '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lcv-katilim-listesi.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleApproveAlbumItem = async (id: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/album/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (Array.isArray(data.albumItems)) {
        onAlbumItemsChanged(data.albumItems);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteAlbumItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/album/${id}`, {
        method: 'DELETE',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data.albumItems)) {
        onAlbumItemsChanged(data.albumItems);
      }
    } catch {
      // ignore
    }
  };

  const generatedGuestUrl = (() => {
    const base = window.location.origin + window.location.pathname;
    const trimmed = guestInviteName.trim();
    if (!trimmed) return base;
    return `${base}?to=${encodeURIComponent(trimmed)}`;
  })();

  const copyGuestUrl = () => {
    navigator.clipboard?.writeText(generatedGuestUrl);
    setCopiedGuestLink(true);
    window.setTimeout(() => setCopiedGuestLink(false), 2000);
  };

  const totalAttendingPeople = rsvps
    .filter((r) => r.attending === 'yes')
    .reduce((acc, r) => acc + (Number(r.guestCount) || 1), 0);

  const pendingModerationCount = albumItems.filter((item) => item.approved !== true).length;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isSetupCompleted
          ? 'bg-black/80 p-2 sm:p-4 backdrop-blur-sm'
          : 'bg-zinc-950 p-0'
      }`}
    >
      <div
        className={`flex w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100 shadow-2xl ${
          isSetupCompleted
            ? 'h-[94vh] max-w-6xl rounded-2xl border border-zinc-700'
            : 'h-screen max-w-none'
        }`}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/95 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {isSetupCompleted
                    ? 'Yönetici & Kurulum Stüdyosu'
                    : 'Dijital Düğün Davetiyesi — İlk Kurulum Sihirbazı'}
                </h2>
                {isSetupCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Şifre Korumalı Canlı Yayın
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    Kurulum Bekleniyor
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {isSetupCompleted
                  ? 'Ayarlarınızı güncelleyip kaydedebilir veya gelen LCV ve ortak albüm medyalarını yönetebilirsiniz.'
                  : '1-5 arası adımlardan davetiyenizi özelleştirin, sağ üstten Yönetici Şifrenizi belirleyip "Kaydet & Yayına Al" butonuna basın.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isSetupCompleted && (
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Yönetici Şifresi Belirleyin *"
                className="rounded-xl border border-amber-500/50 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            )}

            <button
              type="button"
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet & Yayına Al'}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onAdminLogout();
                  onClose();
                }}
                title="Yönetici Çıkışı Yap (Misafir Gözüyle Gör)"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Misafir Görünümü</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 cursor-pointer"
              aria-label="Kapat ve Önizle"
            >
              <Eye className="h-4 w-4" />
              <span>{isSetupCompleted ? 'Sayfayı Gör' : 'Taslağı Canlı Önizle'}</span>
            </button>
          </div>
        </div>

        {/* Status / Error Banners */}
        {(saveBanner || authError) && (
          <div className="px-5 pt-3">
            {saveBanner && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs font-medium text-emerald-200">
                {saveBanner}
              </div>
            )}
            {authError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-xs font-medium text-red-200">
                {authError}
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-900/50 px-4">
          {[
            { id: 'templates', label: '1. Şablon & Kurgu', icon: Palette },
            { id: 'couple', label: '2. Gelin, Damat & Notlar', icon: Users },
            {
              id: 'events',
              label: `3. Etkinlikler (${config.events.length})`,
              icon: MapPin,
            },
            {
              id: 'extras',
              label: '4. Modüller, IBAN, Galeri & Rehber',
              icon: Bus,
            },
            { id: 'share-export', label: '5. Özel Link & Müzik', icon: Share2 },
            { id: 'rsvps', label: '6. Gelen LCV Listesi', icon: ClipboardList },
            {
              id: 'album-admin',
              label: `7. Ortak Albüm (${albumItems.length})${
                pendingModerationCount > 0 ? ` • ${pendingModerationCount} Onay Bekliyor` : ''
              }`,
              icon: Camera,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-8">
          {/* TAB 1: TEMPLATES & SCENARIO PRESETS */}
          {activeTab === 'templates' && (
            <div className="space-y-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Tasarım Şablonu Seçin (6 Farklı İnteraktif Tema &amp; Canlı Önizleme)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Seçtiğiniz şablon davetiyenin yazı tiplerini, zarf mührünü, renk paletini ve arka plan animasyonlarını değiştirir. Her şablonun altındaki <strong>&ldquo;Şablonu Canlı Önizle&rdquo;</strong> butonuyla örnek sayfayı anında tam ekran inceleyebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.keys(TEMPLATES) as TemplateId[]).map((tId) => {
                    const tpl = TEMPLATES[tId];
                    const isSelected = config.templateId === tId;
                    return (
                      <div
                        key={tId}
                        onClick={() => updateField('templateId', tId)}
                        className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div
                            className={`h-24 w-full rounded-xl bg-gradient-to-r ${tpl.previewGradient} mb-3 flex items-end justify-between p-3 shadow-inner`}
                          >
                            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                              {tpl.badge}
                            </span>
                            {isSelected && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-white">{tpl.name}</div>
                          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                            {tpl.tagline}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-bold ${
                              isSelected ? 'text-amber-400' : 'text-zinc-500'
                            }`}
                          >
                            {isSelected ? '✓ Aktif Şablon' : 'Seçmek İçin Tıklayın'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateField('templateId', tId);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500 hover:text-zinc-950 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Şablonu Canlı Önizle
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scenario Presets */}
              <div className="border-t border-zinc-800 pt-7">
                <h3 className="text-base font-bold text-white mb-1">
                  Hızlı Düğün Kurgusu Seçimi (Tek İlde Düğün / İki İlde Düğün / Nikah + After)
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Düğün akışınıza en uygun hazır kurguyu tek tıkla yükleyip örnek sayfasını canlı önizleyebilir, ardından &ldquo;3. Etkinlikler&rdquo; sekmesinden saat ve mekanları özelleştirebilirsiniz.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SCENARIO_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
                    >
                      <div>
                        <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                          {preset.badge}
                        </span>
                        <h4 className="mt-2.5 text-sm font-bold text-white">
                          {preset.title}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-400">
                          {preset.subtitle}
                        </p>
                        <ul className="mt-3 space-y-1 text-xs text-zinc-300">
                          {preset.events.map((ev) => (
                            <li key={ev.id} className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              <span>
                                <strong>{ev.city}:</strong> {ev.title} ({ev.startTime})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => applyScenarioPreset(preset.id)}
                          className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950 py-2 text-xs font-bold text-amber-300 transition-all cursor-pointer"
                        >
                          Bu Kurguyu Uygula
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            applyScenarioPreset(preset.id);
                            onClose();
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 py-2 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-amber-400" />
                          Uygula &amp; Örnek Sayfayı Önizle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRIDE & GROOM INFO + CUSTOM NOTES ON MAIN PAGE */}
          {activeTab === 'couple' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bride Box */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Gelin Bilgileri
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Gelin Adı</label>
                      <input
                        type="text"
                        value={config.bride.firstName}
                        onChange={(e) =>
                          updateField('bride', { ...config.bride, firstName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Gelin Soyadı</label>
                      <input
                        type="text"
                        value={config.bride.lastName}
                        onChange={(e) =>
                          updateField('bride', { ...config.bride, lastName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Anne Adı</label>
                      <input
                        type="text"
                        value={config.bride.motherName}
                        onChange={(e) =>
                          updateField('bride', { ...config.bride, motherName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Baba Adı</label>
                      <input
                        type="text"
                        value={config.bride.fatherName}
                        onChange={(e) =>
                          updateField('bride', { ...config.bride, fatherName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Aile Unvanı</label>
                    <input
                      type="text"
                      value={config.bride.familyTitle}
                      onChange={(e) =>
                        updateField('bride', { ...config.bride, familyTitle: e.target.value })
                      }
                      placeholder="Örn: Soylu Ailesi"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Fotoğraf URL (İsteğe Bağlı)</label>
                    <input
                      type="url"
                      value={config.bride.photoUrl || ''}
                      onChange={(e) =>
                        updateField('bride', { ...config.bride, photoUrl: e.target.value })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Groom Box */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Damat Bilgileri
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Damat Adı</label>
                      <input
                        type="text"
                        value={config.groom.firstName}
                        onChange={(e) =>
                          updateField('groom', { ...config.groom, firstName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Damat Soyadı</label>
                      <input
                        type="text"
                        value={config.groom.lastName}
                        onChange={(e) =>
                          updateField('groom', { ...config.groom, lastName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Anne Adı</label>
                      <input
                        type="text"
                        value={config.groom.motherName}
                        onChange={(e) =>
                          updateField('groom', { ...config.groom, motherName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Baba Adı</label>
                      <input
                        type="text"
                        value={config.groom.fatherName}
                        onChange={(e) =>
                          updateField('groom', { ...config.groom, fatherName: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Aile Unvanı</label>
                    <input
                      type="text"
                      value={config.groom.familyTitle}
                      onChange={(e) =>
                        updateField('groom', { ...config.groom, familyTitle: e.target.value })
                      }
                      placeholder="Örn: Karahan Ailesi"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Fotoğraf URL (İsteğe Bağlı)</label>
                    <input
                      type="url"
                      value={config.groom.photoUrl || ''}
                      onChange={(e) =>
                        updateField('groom', { ...config.groom, photoUrl: e.target.value })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* General Hero Settings */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Karşılama Metni, Ana Tarih &amp; İsim Sırası
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Ana Düğün Tarihi &amp; Saati (Geri Sayım)
                    </label>
                    <input
                      type="datetime-local"
                      value={config.primaryDate}
                      onChange={(e) => updateField('primaryDate', e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">İsim Sıralaması</label>
                    <select
                      value={config.displayOrder}
                      onChange={(e) =>
                        updateField(
                          'displayOrder',
                          e.target.value as 'bride-first' | 'groom-first'
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    >
                      <option value="bride-first">
                        Önce Gelin Adı ({config.bride.firstName} &amp; {config.groom.firstName})
                      </option>
                      <option value="groom-first">
                        Önce Damat Adı ({config.groom.firstName} &amp; {config.bride.firstName})
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Düğün Hashtag</label>
                    <input
                      type="text"
                      value={config.hashtag}
                      onChange={(e) => updateField('hashtag', e.target.value)}
                      placeholder="#ElifVeMertEvleniyor"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Davet Metni (Sözü)</label>
                  <textarea
                    rows={2}
                    value={config.invitationQuote}
                    onChange={(e) => updateField('invitationQuote', e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white"
                  />
                </div>
              </div>

              {/* Optional Custom Notes / Announcements on Main Page */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Ana Sayfa İsteğe Bağlı Özel Notlar &amp; Duyuru Panosu
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ana sayfada geri sayımın hemen altında misafirlerinize göstermek istediğiniz özel duyuruları, rica veya bilgilendirme notlarını ekleyebilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.customNotesEnabled !== false}
                        onChange={(e) => updateField('customNotesEnabled', e.target.checked)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span>Ana Sayfada Göster</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const existing = config.customNotes || [];
                        updateField('customNotes', [
                          ...existing,
                          {
                            id: `note-${Date.now()}`,
                            badge: 'ÖNEMLİ NOT',
                            title: 'Yeni Bilgilendirme Notu',
                            content: 'Not detayını buraya yazabilirsiniz.',
                            highlight: false,
                          },
                        ]);
                        if (config.customNotesEnabled === false) {
                          updateField('customNotesEnabled', true);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-950 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Yeni Not Ekle
                    </button>
                  </div>
                </div>

                {config.customNotesEnabled !== false && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Notlar Bölümü Başlığı
                      </label>
                      <input
                        type="text"
                        value={config.customNotesTitle || 'Özel Duyuru & Bilgilendirme Notları'}
                        onChange={(e) => updateField('customNotesTitle', e.target.value)}
                        className="w-full sm:max-w-md rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {(config.customNotes || []).length === 0 ? (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-center text-xs text-zinc-400">
                        Henüz özel not eklenmemiş. Sağ üstteki &ldquo;+ Yeni Not Ekle&rdquo; butonuna tıklayarak ana sayfaya istediğiniz kadar not kartı ekleyebilirsiniz.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(config.customNotes || []).map((note, nIdx) => (
                          <div
                            key={note.id}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!note.highlight}
                                  onChange={(e) => {
                                    const next = [...(config.customNotes || [])];
                                    next[nIdx] = { ...note, highlight: e.target.checked };
                                    updateField('customNotes', next);
                                  }}
                                  className="h-3.5 w-3.5 accent-amber-500"
                                />
                                <span>Öne Çıkan (Vurgulu Çerçeve)</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  const next = (config.customNotes || []).filter(
                                    (_, i) => i !== nIdx
                                  );
                                  updateField('customNotes', next);
                                }}
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                                title="Notu Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1">
                                  Üst Etiket / Rozet
                                </label>
                                <input
                                  type="text"
                                  value={note.badge || 'ÖNEMLİ NOT'}
                                  onChange={(e) => {
                                    const next = [...(config.customNotes || [])];
                                    next[nIdx] = { ...note, badge: e.target.value };
                                    updateField('customNotes', next);
                                  }}
                                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] text-zinc-400 mb-1">
                                  Not Başlığı
                                </label>
                                <input
                                  type="text"
                                  value={note.title}
                                  onChange={(e) => {
                                    const next = [...(config.customNotes || [])];
                                    next[nIdx] = { ...note, title: e.target.value };
                                    updateField('customNotes', next);
                                  }}
                                  placeholder="Örn: Çocuklu Misafirlerimiz İçin"
                                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-zinc-400 mb-1">
                                Not Açıklaması
                              </label>
                              <textarea
                                rows={2}
                                value={note.content}
                                onChange={(e) => {
                                  const next = [...(config.customNotes || [])];
                                  next[nIdx] = { ...note, content: e.target.value };
                                  updateField('customNotes', next);
                                }}
                                placeholder="Duyuru veya bilgilendirme metnini buraya yazın..."
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-xs text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EVENTS & LOCATIONS */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2.5">
                  + Programa Yeni Etkinlik Ekle (Tek İl veya İki İl İstediğiniz Kadar Ekleyin)
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(EVENT_TYPE_META) as EventType[]).map((type) => {
                    const meta = EVENT_TYPE_META[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addNewEvent(type)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-amber-400 hover:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-400" />
                        <span>
                          {meta.emoji} {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                {config.events.map((ev, idx) => (
                  <div
                    key={ev.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      ev.enabled
                        ? 'border-zinc-700 bg-zinc-900/75'
                        : 'border-zinc-800/60 bg-zinc-900/30 opacity-60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={ev.enabled}
                          onChange={(e) =>
                            updateEvent(idx, { enabled: e.target.checked })
                          }
                          className="h-4 w-4 accent-amber-500"
                        />
                        <span className="text-sm font-bold text-amber-400">
                          #{idx + 1} • {ev.title} ({ev.city})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveEvent(idx, -1)}
                          disabled={idx === 0}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-300 disabled:opacity-30 cursor-pointer"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEvent(idx, 1)}
                          disabled={idx === config.events.length - 1}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-300 disabled:opacity-30 cursor-pointer"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEvent(idx)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 p-1.5 text-red-400 cursor-pointer"
                          title="Etkinliği Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Etkinlik Başlığı
                        </label>
                        <input
                          type="text"
                          value={ev.title}
                          onChange={(e) => updateEvent(idx, { title: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Üst Rozet (Örn: 1. İL • İZMİR)
                        </label>
                        <input
                          type="text"
                          value={ev.badgeText || ''}
                          onChange={(e) => updateEvent(idx, { badgeText: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Şehir (İl)
                        </label>
                        <input
                          type="text"
                          value={ev.city}
                          onChange={(e) => updateEvent(idx, { city: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          İlçe / Semt
                        </label>
                        <input
                          type="text"
                          value={ev.district}
                          onChange={(e) => updateEvent(idx, { district: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Tarih
                        </label>
                        <input
                          type="date"
                          value={ev.date}
                          onChange={(e) => updateEvent(idx, { date: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Başlangıç Saati
                        </label>
                        <input
                          type="time"
                          value={ev.startTime}
                          onChange={(e) => updateEvent(idx, { startTime: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Bitiş Saati
                        </label>
                        <input
                          type="time"
                          value={ev.endTime || ''}
                          onChange={(e) => updateEvent(idx, { endTime: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Mekan / Salon / Ev Adı
                        </label>
                        <input
                          type="text"
                          value={ev.venueName}
                          onChange={(e) => updateEvent(idx, { venueName: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Tam Açık Adres (Harita &amp; Yol Tarifi İçin)
                        </label>
                        <input
                          type="text"
                          value={ev.address}
                          onChange={(e) => updateEvent(idx, { address: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Açıklama / Detay Notu
                        </label>
                        <input
                          type="text"
                          value={ev.description || ''}
                          onChange={(e) => updateEvent(idx, { description: e.target.value })}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Otopark / Vale Bilgisi (İsteğe Bağlı)
                        </label>
                        <input
                          type="text"
                          value={ev.parkingInfo || ''}
                          onChange={(e) => updateEvent(idx, { parkingInfo: e.target.value })}
                          placeholder="Örn: Ücretsiz otopark ve vale mevcuttur"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          İletişim Kişisi &amp; Telefon (İsteğe Bağlı)
                        </label>
                        <input
                          type="text"
                          value={ev.contactPerson || ''}
                          onChange={(e) => updateEvent(idx, { contactPerson: e.target.value })}
                          placeholder="Örn: Sağdıç Burak - 0532 000 00 00"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXTRAS (ALL MODULES FULL EDITORS) */}
          {activeTab === 'extras' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Aktif Modüller &amp; Detaylı İçerik Düzenleyiciler
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Davetiyenizde yer almasını istediğiniz bölümleri aşağıdan aktif edin; aktif ettiğiniz her bölümün detaylı düzenleme paneli hemen altında açılır.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Online Takı / Hediye (IBAN)',
                      checked: config.gift.enabled,
                      onChange: (v: boolean) =>
                        updateField('gift', { ...config.gift, enabled: v }),
                    },
                    {
                      label: 'Ortak Fotoğraf & Video Albümü (Yükleme)',
                      checked: config.guestPhotoUploadEnabled,
                      onChange: (v: boolean) => updateField('guestPhotoUploadEnabled', v),
                    },
                    {
                      label: 'Ulaşım & Konaklama Rehberi',
                      checked: config.travelAndStay.enabled,
                      onChange: (v: boolean) =>
                        updateField('travelAndStay', { ...config.travelAndStay, enabled: v }),
                    },
                    {
                      label: 'Kıyafet Kodu & Renk Paleti',
                      checked: config.dressCode.enabled,
                      onChange: (v: boolean) =>
                        updateField('dressCode', { ...config.dressCode, enabled: v }),
                    },
                    {
                      label: 'Çiftin Hikayesi (Timeline)',
                      checked: config.storyEnabled,
                      onChange: (v: boolean) => updateField('storyEnabled', v),
                    },
                    {
                      label: 'Fotoğraf Galerisi',
                      checked: config.galleryEnabled,
                      onChange: (v: boolean) => updateField('galleryEnabled', v),
                    },
                    {
                      label: 'Sıkça Sorulan Sorular (SSS)',
                      checked: config.faqEnabled,
                      onChange: (v: boolean) => updateField('faqEnabled', v),
                    },
                  ].map((mod) => (
                    <label
                      key={mod.label}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-zinc-200">{mod.label}</span>
                      <input
                        type="checkbox"
                        checked={mod.checked}
                        onChange={(e) => mod.onChange(e.target.checked)}
                        className="h-4 w-4 accent-amber-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 1. ONLINE TAKI / HEDİYE (IBAN) & AÇIKLAMA TAVSİYESİ */}
              {config.gift.enabled && (
                <div className="rounded-2xl border border-amber-500/30 bg-zinc-900/70 p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Online Takı / Hediye (IBAN) &amp; Havale Açıklama Tavsiyesi
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        IBAN hesaplarınızı ve misafirlerinize havale/EFT yaparken açıklama kısmına ne yazmaları gerektiğine dair tavsiyenizi buradan düzenleyebilirsiniz.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('gift', {
                          ...config.gift,
                          accounts: [
                            ...config.gift.accounts,
                            {
                              id: `acc-${Date.now()}`,
                              ownerName: `${config.bride.firstName} ${config.bride.lastName}`,
                              bankName: 'Banka Adı',
                              currency: 'TRY',
                              iban: 'TR00 0000 0000 0000 0000 0000 00',
                              descriptionNote: '',
                            },
                          ],
                        })
                      }
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 cursor-pointer"
                    >
                      + Yeni IBAN Hesabı Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Bölüm Başlığı
                      </label>
                      <input
                        type="text"
                        value={config.gift.title}
                        onChange={(e) =>
                          updateField('gift', { ...config.gift, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Bölüm Alt Açıklaması
                      </label>
                      <input
                        type="text"
                        value={config.gift.description}
                        onChange={(e) =>
                          updateField('gift', { ...config.gift, description: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      Genel Havale / EFT Açıklama Tavsiyesi (Örn: &ldquo;Açıklamaya şunu yazın...&rdquo;)
                    </label>
                    <input
                      type="text"
                      value={config.gift.transferNote || ''}
                      onChange={(e) =>
                        updateField('gift', {
                          ...config.gift,
                          transferNote: e.target.value,
                        })
                      }
                      placeholder="Örn: Lütfen havale/EFT açıklama kısmına 'Adınız Soyadınız - Düğün Hediyesi' ve yakınlık derecenizi yazmayı unutmayınız."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white"
                    />
                    <p className="text-[11px] text-zinc-400">
                      Bu tavsiye metni IBAN kartlarının hemen üzerinde dikkat çekici bir bilgi kutusu içinde gösterilir.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {config.gift.accounts.map((acc, i) => (
                      <div
                        key={acc.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Hesap Sahibi Ad Soyad
                            </label>
                            <input
                              type="text"
                              value={acc.ownerName}
                              onChange={(e) => {
                                const next = [...config.gift.accounts];
                                next[i] = { ...acc, ownerName: e.target.value };
                                updateField('gift', { ...config.gift, accounts: next });
                              }}
                              placeholder="Hesap Sahibi"
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Banka Adı
                            </label>
                            <input
                              type="text"
                              value={acc.bankName}
                              onChange={(e) => {
                                const next = [...config.gift.accounts];
                                next[i] = { ...acc, bankName: e.target.value };
                                updateField('gift', { ...config.gift, accounts: next });
                              }}
                              placeholder="Banka Adı"
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Para Birimi
                            </label>
                            <select
                              value={acc.currency}
                              onChange={(e) => {
                                const next = [...config.gift.accounts];
                                next[i] = {
                                  ...acc,
                                  currency: e.target.value as 'TRY' | 'EUR' | 'USD' | 'ALTIN',
                                };
                                updateField('gift', { ...config.gift, accounts: next });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="TRY">TRY (₺)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="USD">USD ($)</option>
                              <option value="ALTIN">ALTIN (Gr)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              IBAN Numarası
                            </label>
                            <input
                              type="text"
                              value={acc.iban}
                              onChange={(e) => {
                                const next = [...config.gift.accounts];
                                next[i] = { ...acc, iban: e.target.value };
                                updateField('gift', { ...config.gift, accounts: next });
                              }}
                              placeholder="TR00 0000 0000 0000 0000 0000 00"
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-end pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                const next = config.gift.accounts.filter((_, idx) => idx !== i);
                                updateField('gift', { ...config.gift, accounts: next });
                              }}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:text-red-300 cursor-pointer"
                              title="Hesabı Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-amber-300/90 mb-1">
                            Bu Hesaba Özel Açıklama Tavsiyesi (İsteğe Bağlı)
                          </label>
                          <input
                            type="text"
                            value={acc.descriptionNote || ''}
                            onChange={(e) => {
                              const next = [...config.gift.accounts];
                              next[i] = { ...acc, descriptionNote: e.target.value };
                              updateField('gift', { ...config.gift, accounts: next });
                            }}
                            placeholder="Örn: Gelin tarafı hediyeleri için açıklamaya 'Gelin Takı - Ad Soyad' yazabilirsiniz."
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. ORTAK FOTOĞRAF & VİDEO ALBÜMÜ GÜVENLİK VE MODERASYON AYARLARI */}
              {config.guestPhotoUploadEnabled && (
                <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/70 p-5 space-y-5">
                  <div className="border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Ortak Fotoğraf &amp; Video Albümü — Güvenlik, Moderasyon &amp; PIN Ayarları
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Art niyetli kişilerin uygunsuz fotoğraf veya video yükleyip davetiye sayfasında göstermesini engellemek için görünürlük modunu ve dilerseniz Masa PIN şifresini belirleyin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                      {
                        id: 'moderated',
                        badge: 'ÖNERİLEN • GÜVENLİ',
                        title: '🛡️ Yönetici Onaylı Gösterim',
                        desc: 'Misafirler fotoğraf/video yükler ancak siz "7. Ortak Albüm" sekmesinden onaylayana kadar sayfada kimseye görünmez. Uygunsuz içerikleri %100 engeller.',
                      },
                      {
                        id: 'admin-only',
                        badge: 'TAM GİZLİ ARŞİV',
                        title: '🔒 Sadece Gelin & Damat Görsün',
                        desc: 'Misafirler fotoğraf ve videolarını yükler; dosyalar yalnızca sizin sunucunuzdaki özel arşive kaydedilir. Sayfada hiçbir misafire gösterilmez.',
                      },
                      {
                        id: 'public-auto',
                        badge: 'OTOMATİK YAYIN',
                        title: '🌐 Anında Herkese Açık Göster',
                        desc: 'Yüklenen fotoğraf ve videolar onay beklemeden anında davetiye sayfasındaki Ortak Albüm Duvarında herkese görünür.',
                      },
                    ].map((mode) => {
                      const currentMode = config.albumVisibilityMode || 'moderated';
                      const active = currentMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() =>
                            updateField(
                              'albumVisibilityMode',
                              mode.id as 'moderated' | 'admin-only' | 'public-auto'
                            )
                          }
                          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
                            active
                              ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/30'
                              : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              {mode.badge}
                            </span>
                            <div className="mt-2 text-xs font-bold text-white">
                              {mode.title}
                            </div>
                            <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                              {mode.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        İsteğe Bağlı Albüm Yükleme Şifresi / Masa PIN Kodu
                      </label>
                      <input
                        type="text"
                        value={config.albumUploadPin || ''}
                        onChange={(e) => updateField('albumUploadPin', e.target.value)}
                        placeholder="Boş bırakılırsa şifresiz yüklenir (Örn: 2026 veya DUGUN)"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Doldurursanız sadece düğün masalarındaki QR kartta yazan bu PIN kodunu bilen davetliler fotoğraf/video yükleyebilir.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Albüm Yükleme Bölümü Açıklama Metni
                      </label>
                      <input
                        type="text"
                        value={config.guestPhotoUploadNote}
                        onChange={(e) => updateField('guestPhotoUploadNote', e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        SD Kart / Sunucu Toplam Depolama Kotası (GB)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={2000}
                        value={config.maxTotalStorageGB ?? 50}
                        onChange={(e) =>
                          updateField(
                            'maxTotalStorageGB',
                            Math.max(5, Number(e.target.value) || 50)
                          )
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400">
                        64 GB SD kartlı Raspberry Pi sadece bu projeye ayrıldığında işletim sistemine ~7-8 GB güvenli alan bırakarak <strong>50 GB</strong> olarak ayarlanmıştır (~15.000 fotoğraf veya yüzlerce 4K video alır).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Maksimum Medya Dosyası Limiti (Adet)
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={100000}
                        value={config.maxAlbumItems ?? 10000}
                        onChange={(e) =>
                          updateField(
                            'maxAlbumItems',
                            Math.max(100, Number(e.target.value) || 10000)
                          )
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Varsayılan: <strong>10.000 adet</strong> fotoğraf/video (Dosya başı 250 MB 4K video destekli).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ULAŞIM & KONAKLAMA REHBERİ (SERVİS & OTELLER) */}
              {config.travelAndStay.enabled && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-6">
                  <div className="border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      Ulaşım &amp; Konaklama Rehberi Düzenleyici (Servisler &amp; Anlaşmalı Oteller)
                    </h4>
                  </div>

                  {/* Shuttles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        🚌 Misafir Servis (Shuttle) Güzergahları ({config.travelAndStay.shuttles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField('travelAndStay', {
                            ...config.travelAndStay,
                            shuttleEnabled: true,
                            shuttles: [
                              ...config.travelAndStay.shuttles,
                              {
                                id: `sh-${Date.now()}`,
                                city: config.events[0]?.city || 'İstanbul',
                                title: 'Yeni Servis Hattı',
                                departurePoint: 'Kalkış Noktası',
                                departureTime: '18:00',
                                returnTime: '00:30',
                                contactPhone: '',
                                notes: '',
                              },
                            ],
                          })
                        }
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                      >
                        + Servis Ekle
                      </button>
                    </div>

                    {config.travelAndStay.shuttles.map((sh, sIdx) => (
                      <div
                        key={sh.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">Şehir</label>
                            <input
                              type="text"
                              value={sh.city}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, city: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Servis Başlığı
                            </label>
                            <input
                              type="text"
                              value={sh.title}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, title: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Kalkış Saati
                            </label>
                            <input
                              type="text"
                              value={sh.departureTime}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, departureTime: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Dönüş Saati
                            </label>
                            <input
                              type="text"
                              value={sh.returnTime || ''}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, returnTime: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const next = config.travelAndStay.shuttles.filter(
                                  (_, i) => i !== sIdx
                                );
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Kalkış Noktası / Adres
                            </label>
                            <input
                              type="text"
                              value={sh.departurePoint}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, departurePoint: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Sorumlu Telefonu
                            </label>
                            <input
                              type="text"
                              value={sh.contactPhone || ''}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, contactPhone: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Ek Not
                            </label>
                            <input
                              type="text"
                              value={sh.notes || ''}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.shuttles];
                                next[sIdx] = { ...sh, notes: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  shuttles: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hotels */}
                  <div className="space-y-3 border-t border-zinc-800 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        Önerilen &amp; Anlaşmalı Oteller ({config.travelAndStay.hotels.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField('travelAndStay', {
                            ...config.travelAndStay,
                            hotelsEnabled: true,
                            hotels: [
                              ...config.travelAndStay.hotels,
                              {
                                id: `ht-${Date.now()}`,
                                city: config.events[0]?.city || 'İstanbul',
                                name: 'Otel Adı',
                                distanceToVenue: 'Mekana 10 dk mesafede',
                                discountCode: '',
                                phone: '',
                                mapUrl: '',
                                notes: '',
                              },
                            ],
                          })
                        }
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                      >
                        + Otel Ekle
                      </button>
                    </div>

                    {config.travelAndStay.hotels.map((ht, hIdx) => (
                      <div
                        key={ht.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">Şehir</label>
                            <input
                              type="text"
                              value={ht.city}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.hotels];
                                next[hIdx] = { ...ht, city: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Otel Adı
                            </label>
                            <input
                              type="text"
                              value={ht.name}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.hotels];
                                next[hIdx] = { ...ht, name: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Mekana Mesafe / Not
                            </label>
                            <input
                              type="text"
                              value={ht.distanceToVenue}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.hotels];
                                next[hIdx] = { ...ht, distanceToVenue: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const next = config.travelAndStay.hotels.filter(
                                  (_, i) => i !== hIdx
                                );
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              İndirim Kodu (İsteğe Bağlı)
                            </label>
                            <input
                              type="text"
                              value={ht.discountCode || ''}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.hotels];
                                next[hIdx] = { ...ht, discountCode: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Rezervasyon Telefonu
                            </label>
                            <input
                              type="text"
                              value={ht.phone || ''}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.hotels];
                                next[hIdx] = { ...ht, phone: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Harita Linki veya Ek Not
                            </label>
                            <input
                              type="text"
                              value={ht.notes || ''}
                              onChange={(e) => {
                                const next = [...config.travelAndStay.hotels];
                                next[hIdx] = { ...ht, notes: e.target.value };
                                updateField('travelAndStay', {
                                  ...config.travelAndStay,
                                  hotels: next,
                                });
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. KIYAFET KODU & RENK PALETİ DÜZENLEYİCİ */}
              {config.dressCode.enabled && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Shirt className="h-4 w-4" />
                      Kıyafet Kodu &amp; Renk Paleti Düzenleyici
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('dressCode', {
                          ...config.dressCode,
                          colors: [
                            ...config.dressCode.colors,
                            { name: 'Yeni Renk', hex: '#D4AF37' },
                          ],
                        })
                      }
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      + Renk Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Başlık</label>
                      <input
                        type="text"
                        value={config.dressCode.title}
                        onChange={(e) =>
                          updateField('dressCode', {
                            ...config.dressCode,
                            title: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Genel Açıklama</label>
                      <input
                        type="text"
                        value={config.dressCode.description}
                        onChange={(e) =>
                          updateField('dressCode', {
                            ...config.dressCode,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Hanımlar İçin Not
                      </label>
                      <input
                        type="text"
                        value={config.dressCode.ladiesNote || ''}
                        onChange={(e) =>
                          updateField('dressCode', {
                            ...config.dressCode,
                            ladiesNote: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Beyler İçin Not
                      </label>
                      <input
                        type="text"
                        value={config.dressCode.gentlemenNote || ''}
                        onChange={(e) =>
                          updateField('dressCode', {
                            ...config.dressCode,
                            gentlemenNote: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                    {config.dressCode.colors.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5"
                      >
                        <input
                          type="color"
                          value={c.hex}
                          onChange={(e) => {
                            const next = [...config.dressCode.colors];
                            next[cIdx] = { ...c, hex: e.target.value };
                            updateField('dressCode', { ...config.dressCode, colors: next });
                          }}
                          className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const next = [...config.dressCode.colors];
                            next[cIdx] = { ...c, name: e.target.value };
                            updateField('dressCode', { ...config.dressCode, colors: next });
                          }}
                          placeholder="Renk Adı"
                          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = config.dressCode.colors.filter((_, i) => i !== cIdx);
                            updateField('dressCode', { ...config.dressCode, colors: next });
                          }}
                          className="text-red-400 hover:text-red-300 cursor-pointer p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. ÇİFTİN HİKAYESİ (TIMELINE) DÜZENLEYİCİ */}
              {config.storyEnabled && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Çiftin Hikayesi (Timeline) Düzenleyici ({config.storyMilestones.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('storyMilestones', [
                          ...config.storyMilestones,
                          {
                            id: `st-${Date.now()}`,
                            date: '2026',
                            title: 'Yeni Anı Başlığı',
                            description: 'Anı açıklamasını buraya yazın...',
                            imageUrl: '',
                          },
                        ])
                      }
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      + Hikaye Adımı Ekle
                    </button>
                  </div>

                  <div className="space-y-3">
                    {config.storyMilestones.map((st, stIdx) => (
                      <div
                        key={st.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Tarih / Dönem
                            </label>
                            <input
                              type="text"
                              value={st.date}
                              onChange={(e) => {
                                const next = [...config.storyMilestones];
                                next[stIdx] = { ...st, date: e.target.value };
                                updateField('storyMilestones', next);
                              }}
                              placeholder="Örn: Eylül 2021"
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Başlık
                            </label>
                            <input
                              type="text"
                              value={st.title}
                              onChange={(e) => {
                                const next = [...config.storyMilestones];
                                next[stIdx] = { ...st, title: e.target.value };
                                updateField('storyMilestones', next);
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              Fotoğraf URL (İsteğe Bağlı)
                            </label>
                            <input
                              type="url"
                              value={st.imageUrl || ''}
                              onChange={(e) => {
                                const next = [...config.storyMilestones];
                                next[stIdx] = { ...st, imageUrl: e.target.value };
                                updateField('storyMilestones', next);
                              }}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-end pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                const next = config.storyMilestones.filter(
                                  (_, i) => i !== stIdx
                                );
                                updateField('storyMilestones', next);
                              }}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">
                            Hikaye Açıklaması
                          </label>
                          <textarea
                            rows={2}
                            value={st.description}
                            onChange={(e) => {
                              const next = [...config.storyMilestones];
                              next[stIdx] = { ...st, description: e.target.value };
                              updateField('storyMilestones', next);
                            }}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. FOTOĞRAF GALERİSİ DÜZENLEYİCİ */}
              {config.galleryEnabled && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Fotoğraf Galerisi Düzenleyici ({config.galleryPhotos.length} Fotoğraf)
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('galleryPhotos', [
                          ...config.galleryPhotos,
                          {
                            id: `gal-${Date.now()}`,
                            url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
                            caption: 'Yeni Fotoğraf Açıklaması',
                          },
                        ])
                      }
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      + Galeriye Fotoğraf Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.galleryPhotos.map((gItem, gIdx) => (
                      <div
                        key={gItem.id}
                        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                      >
                        <img
                          src={gItem.url}
                          alt={gItem.caption}
                          className="h-16 w-16 rounded-lg object-cover bg-zinc-900 shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          <input
                            type="url"
                            value={gItem.url}
                            onChange={(e) => {
                              const next = [...config.galleryPhotos];
                              next[gIdx] = { ...gItem, url: e.target.value };
                              updateField('galleryPhotos', next);
                            }}
                            placeholder="Fotoğraf URL (https://...)"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={gItem.caption}
                            onChange={(e) => {
                              const next = [...config.galleryPhotos];
                              next[gIdx] = { ...gItem, caption: e.target.value };
                              updateField('galleryPhotos', next);
                            }}
                            placeholder="Fotoğraf Alt Başlığı"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = config.galleryPhotos.filter((_, i) => i !== gIdx);
                            updateField('galleryPhotos', next);
                          }}
                          className="text-red-400 hover:text-red-300 cursor-pointer p-1.5"
                          title="Fotoğrafı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. SIKÇA SORULAN SORULAR (SSS) DÜZENLEYİCİ */}
              {config.faqEnabled && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Sıkça Sorulan Sorular (SSS) Düzenleyici ({config.faqs.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('faqs', [
                          ...config.faqs,
                          {
                            id: `faq-${Date.now()}`,
                            question: 'Yeni Soru Başlığı?',
                            answer: 'Sorunun cevabını buraya yazınız.',
                          },
                        ])
                      }
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      + Soru Ekle
                    </button>
                  </div>

                  <div className="space-y-3">
                    {config.faqs.map((fItem, fIdx) => (
                      <div
                        key={fItem.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={fItem.question}
                            onChange={(e) => {
                              const next = [...config.faqs];
                              next[fIdx] = { ...fItem, question: e.target.value };
                              updateField('faqs', next);
                            }}
                            placeholder="Soru"
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = config.faqs.filter((_, i) => i !== fIdx);
                              updateField('faqs', next);
                            }}
                            className="text-red-400 hover:text-red-300 cursor-pointer p-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={fItem.answer}
                          onChange={(e) => {
                            const next = [...config.faqs];
                            next[fIdx] = { ...fItem, answer: e.target.value };
                            updateField('faqs', next);
                          }}
                          placeholder="Cevap"
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RSVP, MUSIC, PERSONALIZED INVITE LINK & EXPORT */}
          {activeTab === 'share-export' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                <h3 className="text-sm font-bold text-amber-300">
                  Misafire Özel İsimli Davetiye Linki Oluşturucu
                </h3>
                <p className="text-xs text-zinc-300">
                  Davetlinizin adını yazın; davetiyeyi açtığında zarfın üzerinde doğrudan kendi ismini görsün!
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={guestInviteName}
                    onChange={(e) => setGuestInviteName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz ve Ailesi"
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={copyGuestUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-zinc-950 cursor-pointer"
                  >
                    {copiedGuestLink ? (
                      <>
                        <Check className="h-4 w-4" />
                        Özel Link Kopyalandı!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Davetli Linkini Kopyala
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-lg bg-zinc-950/90 p-2.5 font-mono text-[11px] text-zinc-400 break-all">
                  {generatedGuestUrl}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-amber-400">
                    LCV (Katılım Bildirimi) Ayarları
                  </h4>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      LCV Bildirimlerinin Geleceği WhatsApp Numarası
                    </label>
                    <input
                      type="text"
                      value={config.rsvp.whatsappNumber}
                      onChange={(e) =>
                        updateField('rsvp', {
                          ...config.rsvp,
                          whatsappNumber: e.target.value,
                        })
                      }
                      placeholder="905320000000"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    İnteraktif Zarf &amp; Arka Plan Müziği
                  </h4>

                  <label className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer">
                    <span>Açılışta Mühürlü İnteraktif Zarf Göster</span>
                    <input
                      type="checkbox"
                      checked={config.envelopeAndMusic.requireEnvelopeClick}
                      onChange={(e) =>
                        updateField('envelopeAndMusic', {
                          ...config.envelopeAndMusic,
                          requireEnvelopeClick: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-amber-500"
                    />
                  </label>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Arka Plan Melodisi Seçimi
                    </label>
                    <select
                      value={config.envelopeAndMusic.musicMelody}
                      onChange={(e) =>
                        updateField('envelopeAndMusic', {
                          ...config.envelopeAndMusic,
                          musicMelody: e.target.value as WeddingConfig['envelopeAndMusic']['musicMelody'],
                        })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="romantic-waltz">Romantik Piyano Valsi (Dahili)</option>
                      <option value="classic-harp">Klasik Arp Seranat (Dahili)</option>
                      <option value="dreamy-musicbox">Masalsı Müzik Kutusu (Dahili)</option>
                      <option value="custom-url">Özel MP3 Linki Kullan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="text-sm font-bold text-white">
                  Yedekleme (JSON İndir / Yükle)
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-200 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    weddingConfig.json Yedeği İndir
                  </button>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-200 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    JSON Ayar Dosyası Yükle
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={onResetDefault}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-300 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Varsayılana Sıfırla
                  </button>
                </div>
                {importError && <p className="text-xs text-red-400">{importError}</p>}
              </div>
            </div>
          )}

          {/* TAB 6: RSVP SUBMISSIONS LIST */}
          {activeTab === 'rsvps' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Gelen LCV (Katılım Bildirimi) Kayıtları ({rsvps.length} Kayıt • Toplam {totalAttendingPeople} Katılımcı)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Davetiyeniz üzerinden doldurulan tüm katılım bildirimleri sunucuda <code className="text-amber-300">data/rsvpSubmissions.json</code> dosyasında saklanır.
                  </p>
                </div>

                {rsvps.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportRsvpCsv}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Excel / CSV İndir
                  </button>
                )}
              </div>

              {loadingRsvps ? (
                <div className="py-12 text-center text-sm text-zinc-400">
                  Yükleniyor...
                </div>
              ) : rsvps.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-sm text-zinc-400">
                  Henüz LCV bildirimi gönderilmedi.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase">
                      <tr>
                        <th className="p-3">Ad Soyad</th>
                        <th className="p-3">Telefon</th>
                        <th className="p-3">Durum</th>
                        <th className="p-3">Kişi</th>
                        <th className="p-3">Etkinlikler / Şehirler</th>
                        <th className="p-3">Servis</th>
                        <th className="p-3">Mesaj</th>
                        <th className="p-3">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                      {rsvps.map((r) => (
                        <tr key={r.id}>
                          <td className="p-3 font-bold text-white">
                            {r.fullName}
                            <div className="text-[10px] font-normal text-zinc-500">
                              {r.relation}
                            </div>
                          </td>
                          <td className="p-3 text-zinc-300">{r.phone || '-'}</td>
                          <td className="p-3">
                            {r.attending === 'yes' ? (
                              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                Katılıyor
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-300">
                                Katılamıyor
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-amber-400">{r.guestCount}</td>
                          <td className="p-3 text-zinc-300 max-w-xs">
                            {(r.events || []).join(', ') || '-'}
                          </td>
                          <td className="p-3 text-zinc-300">
                            {r.needShuttle ? 'Evet' : 'Hayır'}
                          </td>
                          <td className="p-3 text-zinc-400 max-w-xs">{r.message || '-'}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteRsvp(r.id)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SHARED ALBUM MODERATION */}
          {activeTab === 'album-admin' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Ortak Albüm Medya Yönetimi &amp; Moderasyon ({albumItems.length} / {config.maxAlbumItems ?? storageStats.maxAlbumItems ?? 10000} Fotoğraf/Video)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Misafirlerin yüklediği tüm fotoğraf ve videolar <code className="text-amber-300">uploads/</code> klasörüne kaydedilir. Uygunsuz veya art niyetli yüklemeleri engellemek için buradan tek tıkla <strong>Onayla / Yayına Al</strong> veya <strong>Gizle / Sil</strong> yapabilirsiniz.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={config.albumVisibilityMode || 'moderated'}
                      onChange={(e) =>
                        updateField(
                          'albumVisibilityMode',
                          e.target.value as 'moderated' | 'admin-only' | 'public-auto'
                        )
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-emerald-300"
                    >
                      <option value="moderated">
                        🛡️ Yönetici Onaylı Gösterim (Onayladıklarım Görünsün)
                      </option>
                      <option value="admin-only">
                        🔒 Sadece Gelin &amp; Damat Görsün (Sayfada Gizli)
                      </option>
                      <option value="public-auto">
                        🌐 Anında Herkese Açık Göster
                      </option>
                    </select>
                  </div>
                </div>

                {/* Live Raspberry Pi 64GB SD Card Storage Meter */}
                {(() => {
                  const maxGB = config.maxTotalStorageGB ?? storageStats.maxStorageGB ?? 50;
                  const usedMB = storageStats.usedBytes / (1024 * 1024);
                  const usedGB = usedMB / 1024;
                  const pct = Math.min(100, (usedGB / maxGB) * 100);
                  return (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300">
                          💾 Raspberry Pi SD Kart / Albüm Depolama Durumu:
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {usedGB >= 1
                            ? `${usedGB.toFixed(2)} GB`
                            : `${usedMB.toFixed(1)} MB`}{' '}
                          / {maxGB} GB ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
                          style={{ width: `${Math.max(pct, 0.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {albumItems.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-sm text-zinc-400">
                  Henüz ortak albüme fotoğraf veya video yüklenmedi.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albumItems.map((item) => {
                    const isApproved = item.approved === true;
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col overflow-hidden rounded-2xl border bg-zinc-900 ${
                          isApproved ? 'border-emerald-500/40' : 'border-amber-500/50'
                        }`}
                      >
                        <div className="relative h-48 w-full bg-black">
                          {item.mediaType === 'video' ? (
                            <video
                              src={item.url}
                              controls
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={item.uploaderName}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span
                            className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow ${
                              isApproved
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-amber-400 text-zinc-950'
                            }`}
                          >
                            {isApproved ? '✓ Yayında (Onaylı)' : '⏳ Onay Bekliyor / Gizli'}
                          </span>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-white">
                              {item.uploaderName}
                            </div>
                            <div className="text-[11px] text-amber-400">
                              {item.eventTag}
                            </div>
                            {item.caption && (
                              <p className="mt-1 text-xs text-zinc-400">
                                “{item.caption}”
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 border-t border-zinc-800 pt-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleApproveAlbumItem(item.id, !isApproved)
                              }
                              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                                isApproved
                                  ? 'border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Sayfadan Gizle
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Onayla &amp; Sayfada Göster
                                </>
                              )}
                            </button>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <a
                                href={item.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Orijinali İndir
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteAlbumItem(item.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Kalıcı Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
