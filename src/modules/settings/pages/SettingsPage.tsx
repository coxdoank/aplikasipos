import React, { useState, useEffect } from "react";
import {
  Store,
  Receipt,
  CreditCard,
  Percent,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Clock,
  Printer,
  Wifi,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  settingService,
  type AllSettings,
  getDefaultSettings,
} from "@/services/settingService";

type SettingsTab = "store" | "tax" | "payment" | "receipt";

export const SettingsPage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canManageSettings = hasPermission("settings.manage");

  const [activeTab, setActiveTab] = useState<SettingsTab>("store");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consolidated settings state
  const [settings, setSettings] = useState<AllSettings>(getDefaultSettings());

  // Load settings on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data = await settingService.getAllSettings();
        if (isMounted) {
          setSettings(data);
        }
      } catch (err) {
        console.error("Gagal memuat pengaturan:", err);
        if (isMounted) {
          setErrorMessage("Gagal memuat pengaturan dari server. Menggunakan data lokal.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const outletId = settings.outlet.id;
      await Promise.all([
        settingService.updateOutletInfo(outletId, settings.outlet),
        settingService.updateStoreSettings(outletId, settings.store),
        settingService.updatePaymentSettings(outletId, settings.payment),
        settingService.updateTaxSettings(outletId, settings.tax),
        settingService.updateServiceChargeSettings(outletId, settings.serviceCharge),
        settingService.updateReceiptSettings(outletId, settings.receipt),
      ]);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      console.error("Gagal menyimpan pengaturan:", err);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan ke server.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (!canManageSettings) return;
    const confirmReset = window.confirm(
      "Apakah Anda yakin ingin mengembalikan seluruh pengaturan ke nilai default bawaan sistem?"
    );
    if (!confirmReset) return;

    setIsSaving(true);
    try {
      const defaults = await settingService.resetToDefaults(settings.outlet.id);
      setSettings(defaults);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Gagal mereset pengaturan:", err);
      setErrorMessage("Gagal mereset pengaturan ke default.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground">Memuat konfigurasi sistem FOODPOS...</p>
      </div>
    );
  }

  // Sample tax simulation
  const sampleSubtotal = 100000;
  const sampleTax = settings.tax.is_enabled
    ? Math.round((sampleSubtotal * settings.tax.tax_rate_percent) / 100)
    : 0;
  const sampleService = settings.serviceCharge.is_enabled
    ? Math.round((sampleSubtotal * settings.serviceCharge.service_rate_percent) / 100)
    : 0;
  const sampleGrandTotal = sampleSubtotal + sampleTax + sampleService;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Pengaturan Toko & Sistem
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola identitas outlet, tarif pajak PB1, service charge, metode pembayaran, dan format cetak struk POS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageSettings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Bawaan
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!canManageSettings || isSaving}
            className="gap-1.5 text-xs font-semibold"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {!canManageSettings && (
        <div className="flex items-center gap-2.5 p-3.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Mode Hanya Baca:</strong> Anda masuk dengan hak akses kasir. Pengubahan pengaturan memerlukan izin{" "}
            <code>settings.manage</code> (Peran Owner atau Admin).
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Konfigurasi toko dan operasional berhasil disimpan ke sistem!</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b overflow-x-auto pb-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "store"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="h-4 w-4" />
          Profil Outlet & Restoran
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tax")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "tax"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Percent className="h-4 w-4" />
          Pajak PB1 & Service Charge
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "payment"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Metode Pembayaran
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("receipt")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "receipt"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Struk & Printer POS
        </button>
      </div>

      {/* TAB CONTENT */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: PROFIL OUTLET & RESTORAN */}
        {/* ========================================================================= */}
        {activeTab === "store" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Identitas Bisnis */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <Store className="h-4 w-4 text-primary" />
                  Identitas Usaha & Merek Restoran
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Nama Brand / Restoran <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.store.business_name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          store: { ...settings.store, business_name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="e.g. FOODPOS Resto & Coffee"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Slogan / Tagline Usaha</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.store.business_tagline || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          store: { ...settings.store, business_tagline: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Sajian Lezat Berkualitas untuk Setiap Momen Berharga"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Deskripsi Singkat Restoran</label>
                    <textarea
                      rows={2}
                      disabled={!canManageSettings}
                      value={settings.store.description || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          store: { ...settings.store, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Ceritakan keistimewaan konsep restoran Anda..."
                    />
                  </div>
                </div>
              </div>

              {/* Data Fisik Outlet */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Detail Outlet Fisik & Alamat
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nama Outlet</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.outlet.name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          outlet: { ...settings.outlet, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Outlet Pusat Senopati"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Kode Outlet</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.outlet.code}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          outlet: { ...settings.outlet, code: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase disabled:opacity-60"
                      placeholder="JKT-01"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      disabled={!canManageSettings}
                      value={settings.outlet.address || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          outlet: { ...settings.outlet, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Telepon Outlet</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        disabled={!canManageSettings}
                        value={settings.outlet.phone || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            outlet: { ...settings.outlet, phone: e.target.value },
                          })
                        }
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                        placeholder="0812-3456-7890"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">WhatsApp Bisnis</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.store.whatsapp_number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          store: { ...settings.store, whatsapp_number: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="+62 812-3456-7890"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Tautan Google Maps</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        disabled={!canManageSettings}
                        value={settings.store.google_maps_url || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            store: { ...settings.store, google_maps_url: e.target.value },
                          })
                        }
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs disabled:opacity-60"
                        placeholder="https://maps.google.com/?q=..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Kanan Tab Store: Jam & Operasional Online */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Operasional & Pelayanan
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Jam Buka Restoran</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.store.operating_hours || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          store: { ...settings.store, operating_hours: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Senin - Minggu: 10:00 - 22:00 WIB"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Estimasi Waktu Siap Saji (Menit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      disabled={!canManageSettings}
                      value={settings.store.estimated_prep_time_minutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          store: {
                            ...settings.store,
                            estimated_prep_time_minutes: Number(e.target.value) || 15,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Ditampilkan kepada pelanggan pada estimasi pesanan online.
                    </p>
                  </div>

                  {/* Online Ordering Toggle */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Terima Pesanan Online</p>
                        <p className="text-[11px] text-muted-foreground">Aktifkan pemesanan web publik</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canManageSettings}
                          checked={settings.store.is_online_ordering_enabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              store: {
                                ...settings.store,
                                is_online_ordering_enabled: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PAJAK PB1 & SERVICE CHARGE */}
        {/* ========================================================================= */}
        {activeTab === "tax" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Pajak Daerah PB1 */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Percent className="h-4 w-4 text-emerald-600" />
                      Pajak Restoran (PB1 / Pajak Daerah)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Kepatuhan pemungutan pajak restoran sesuai regulasi Pemda (umumnya 10%).
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={settings.tax.is_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          tax: { ...settings.tax, is_enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Label Pajak Pada Struk / Checkout
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings || !settings.tax.is_enabled}
                      value={settings.tax.tax_name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          tax: { ...settings.tax, tax_name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="PB1 / Pajak Restoran"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Tarif Pajak Persentase (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        disabled={!canManageSettings || !settings.tax.is_enabled}
                        value={settings.tax.tax_rate_percent}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            tax: {
                              ...settings.tax,
                              tax_rate_percent: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Charge */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Percent className="h-4 w-4 text-amber-500" />
                      Biaya Layanan (Service Charge)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Biaya operasional tambahan bagi pesanan dine-in atau takeaway jika diberlakukan.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={settings.serviceCharge.is_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          serviceCharge: {
                            ...settings.serviceCharge,
                            is_enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="space-y-1 sm:w-1/2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Tarif Biaya Layanan (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={!canManageSettings || !settings.serviceCharge.is_enabled}
                      value={settings.serviceCharge.service_rate_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          serviceCharge: {
                            ...settings.serviceCharge,
                            service_rate_percent: Number(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Simulasi Perhitungan Transaksi */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Simulasi Kalkulasi Transaksi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Berikut contoh perhitungan tagihan pesanan dengan nilai dasar <strong>Rp 100.000</strong>:
                </p>

                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal Belanja:</span>
                    <span className="font-medium text-foreground">Rp 100.000</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {settings.tax.tax_name} ({settings.tax.is_enabled ? `${settings.tax.tax_rate_percent}%` : "Nonaktif"}):
                    </span>
                    <span className="font-medium text-foreground">
                      + Rp {sampleTax.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Service Charge ({settings.serviceCharge.is_enabled ? `${settings.serviceCharge.service_rate_percent}%` : "Nonaktif"}):
                    </span>
                    <span className="font-medium text-foreground">
                      + Rp {sampleService.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/80 flex justify-between font-bold text-sm text-foreground">
                    <span>Grand Total:</span>
                    <span className="text-primary font-mono">Rp {sampleGrandTotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: METODE PEMBAYARAN */}
        {/* ========================================================================= */}
        {activeTab === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Sakelar Saluran Pembayaran */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Aktivasi Metode Pembayaran yang Diterima
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cash */}
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">Tunai / Uang Pas (Cash)</p>
                      <p className="text-[11px] text-muted-foreground">Pembayaran fisik di meja kasir</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageSettings}
                        checked={settings.payment.is_cash_enabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            payment: {
                              ...settings.payment,
                              is_cash_enabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* QRIS */}
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">QRIS Dinamis / Statis</p>
                      <p className="text-[11px] text-muted-foreground">Scan e-wallet & mobile banking</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageSettings}
                        checked={settings.payment.is_qris_enabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            payment: {
                              ...settings.payment,
                              is_qris_enabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Transfer Bank */}
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">Transfer Bank Manual</p>
                      <p className="text-[11px] text-muted-foreground">Upload bukti transfer & verifikasi kasir</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageSettings}
                        checked={settings.payment.is_transfer_enabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            payment: {
                              ...settings.payment,
                              is_transfer_enabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Kartu EDC */}
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">Kartu Debit & Kredit (EDC)</p>
                      <p className="text-[11px] text-muted-foreground">Gesek mesin EDC kasir</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageSettings}
                        checked={settings.payment.is_card_enabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            payment: {
                              ...settings.payment,
                              is_card_enabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Konfigurasi QRIS & Bank */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  Konfigurasi Akun QRIS & Rekening Bank
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Nama Merchant QRIS (NMID)
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.payment.qris_merchant_name || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            qris_merchant_name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="FOODPOS SENOPATI"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      URL Gambar QR Code QRIS
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.payment.qris_image_url || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            qris_image_url: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs disabled:opacity-60"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nama Bank Penerima</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.payment.bank_name || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: { ...settings.payment, bank_name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="BCA / Mandiri / BRI / BNI"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nomor Rekening Bank</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.payment.bank_account_number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            bank_account_number: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono disabled:opacity-60"
                      placeholder="8820192831"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Nama Pemilik Rekening (Atas Nama)
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.payment.bank_account_holder || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            bank_account_holder: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary uppercase disabled:opacity-60"
                      placeholder="PT KULINER MAKMUR POS"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Pratinjau QRIS */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4 text-center">
                <h3 className="font-bold text-sm text-foreground border-b pb-2">
                  Pratinjau Kode QRIS
                </h3>
                <div className="p-3 bg-white rounded-lg border inline-block shadow-sm">
                  {settings.payment.qris_image_url ? (
                    <img
                      src={settings.payment.qris_image_url}
                      alt="QRIS Preview"
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex flex-col items-center justify-center bg-muted text-muted-foreground text-xs">
                      <QrCode className="h-10 w-10 mb-2 opacity-40" />
                      Belum ada URL QRIS
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-foreground">
                    {settings.payment.qris_merchant_name || "NAMA MERCHANT"}
                  </p>
                  <p className="text-muted-foreground text-[11px]">NMID: ID1020000000000</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STRUK & PRINTER POS */}
        {/* ========================================================================= */}
        {activeTab === "receipt" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Kontrol Struk */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
                  <Printer className="h-4 w-4 text-primary" />
                  Konfigurasi Template Cetak Struk Kasir
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Judul Header Struk
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.receipt.header_title}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          receipt: {
                            ...settings.receipt,
                            header_title: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase disabled:opacity-60"
                      placeholder="FOODPOS RESTO & CAFE"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Sub-header (Alamat / Telepon di Struk)
                    </label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={settings.receipt.header_subtitle}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          receipt: {
                            ...settings.receipt,
                            header_subtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Jl. Senopati No. 45, Jaksel • Telp: 0812-3456-7890"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Pesan Footer / Ucapan Terima Kasih
                    </label>
                    <textarea
                      rows={2}
                      disabled={!canManageSettings}
                      value={settings.receipt.footer_message}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          receipt: {
                            ...settings.receipt,
                            footer_message: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Terima kasih atas kunjungan Anda!"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Lebar Kertas Printer Thermal
                      </label>
                      <select
                        disabled={!canManageSettings}
                        value={settings.receipt.paper_width}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            receipt: {
                              ...settings.receipt,
                              paper_width: e.target.value as "58mm" | "80mm",
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      >
                        <option value="58mm">58 mm (Printer Kasir Portabel / Bluetooth)</option>
                        <option value="80mm">80 mm (Printer Thermal Desktop Kasir)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Tampilkan Rincian Pajak & Service
                      </label>
                      <select
                        disabled={!canManageSettings}
                        value={settings.receipt.show_tax_detail ? "true" : "false"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            receipt: {
                              ...settings.receipt,
                              show_tax_detail: e.target.value === "true",
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      >
                        <option value="true">Tampilkan Lengkap (Disarankan)</option>
                        <option value="false">Sembunyikan Rincian Pajak</option>
                      </select>
                    </div>
                  </div>

                  {/* Wi-Fi Info Section */}
                  <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Info Wi-Fi Pengunjung</p>
                          <p className="text-[11px] text-muted-foreground">
                            Cetak nama & kata sandi Wi-Fi pada struk pelanggan
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canManageSettings}
                          checked={settings.receipt.show_wifi_info}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              receipt: {
                                ...settings.receipt,
                                show_wifi_info: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {settings.receipt.show_wifi_info && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Nama Jaringan (SSID)
                          </label>
                          <input
                            type="text"
                            disabled={!canManageSettings}
                            value={settings.receipt.wifi_ssid || ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                receipt: {
                                  ...settings.receipt,
                                  wifi_ssid: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                            placeholder="FOODPOS_GUEST"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Password Wi-Fi
                          </label>
                          <input
                            type="text"
                            disabled={!canManageSettings}
                            value={settings.receipt.wifi_password || ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                receipt: {
                                  ...settings.receipt,
                                  wifi_password: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono disabled:opacity-60"
                            placeholder="kulinernikmat"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE INTERACTIVE THERMAL RECEIPT PREVIEW */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-primary" />
                    Live Thermal Receipt Preview
                  </span>
                  <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {settings.receipt.paper_width}
                  </span>
                </div>

                {/* Struk Fisik Visual */}
                <div
                  className={`mx-auto bg-white text-zinc-900 shadow-xl border border-zinc-200 rounded-t-sm p-4 font-mono text-xs select-none transition-all ${
                    settings.receipt.paper_width === "80mm" ? "w-80 text-[12px]" : "w-64 text-[11px]"
                  }`}
                  style={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {/* Header Toko */}
                  <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3">
                    <p className="font-bold text-sm tracking-wide uppercase">
                      {settings.receipt.header_title || "FOODPOS"}
                    </p>
                    <p className="text-[10px] text-zinc-600 whitespace-pre-wrap leading-tight">
                      {settings.receipt.header_subtitle || "Jl. Senopati No. 45, Jaksel"}
                    </p>
                  </div>

                  {/* Metadata Order */}
                  <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5 text-[10px] text-zinc-700">
                    <div className="flex justify-between">
                      <span>No: ORD-20261110-001</span>
                      <span>Meja: 04</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tgl: {new Date().toLocaleDateString("id-ID")}</span>
                      <span>Kasir: Rian</span>
                    </div>
                  </div>

                  {/* Item Pesanan */}
                  <div className="py-2 border-b border-dashed border-zinc-400 space-y-1.5">
                    <div>
                      <div className="flex justify-between">
                        <span className="font-medium">1x Nasi Goreng Spesial</span>
                        <span>38.000</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 pl-4">+ Telur Mata Sapi</p>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span className="font-medium">1x Es Kopi Susu Aren</span>
                        <span>22.000</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 pl-4">+ Less Ice (50%)</p>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span className="font-medium">1x Pisang Goreng Karamel</span>
                        <span>20.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Finansial */}
                  <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-right">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Subtotal:</span>
                      <span>80.000</span>
                    </div>

                    {settings.receipt.show_tax_detail && settings.tax.is_enabled && (
                      <div className="flex justify-between text-zinc-600">
                        <span>
                          {settings.tax.tax_name} ({settings.tax.tax_rate_percent}%):
                        </span>
                        <span>{((80000 * settings.tax.tax_rate_percent) / 100).toLocaleString("id-ID")}</span>
                      </div>
                    )}

                    {settings.receipt.show_tax_detail && settings.serviceCharge.is_enabled && (
                      <div className="flex justify-between text-zinc-600">
                        <span>Biaya Layanan ({settings.serviceCharge.service_rate_percent}%):</span>
                        <span>{((80000 * settings.serviceCharge.service_rate_percent) / 100).toLocaleString("id-ID")}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-zinc-300">
                      <span>TOTAL:</span>
                      <span>
                        {(
                          80000 +
                          (settings.tax.is_enabled ? (80000 * settings.tax.tax_rate_percent) / 100 : 0) +
                          (settings.serviceCharge.is_enabled
                            ? (80000 * settings.serviceCharge.service_rate_percent) / 100
                            : 0)
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-zinc-600 pt-0.5">
                      <span>Metode Pembayaran:</span>
                      <span className="font-semibold">QRIS (LUNAS)</span>
                    </div>
                  </div>

                  {/* Info Wi-Fi */}
                  {settings.receipt.show_wifi_info && (
                    <div className="py-2 border-b border-dashed border-zinc-400 text-center text-[10px] text-zinc-700 space-y-0.5">
                      <p className="font-semibold flex items-center justify-center gap-1">
                        <Wifi className="h-3 w-3" /> Wi-Fi Restoran
                      </p>
                      <p>
                        SSID: <span className="font-bold">{settings.receipt.wifi_ssid || "FOODPOS"}</span>
                      </p>
                      <p>
                        Password: <span className="font-bold">{settings.receipt.wifi_password || "12345678"}</span>
                      </p>
                    </div>
                  )}

                  {/* Footer Message */}
                  <div className="pt-3 text-center text-[10px] text-zinc-600 whitespace-pre-wrap leading-tight">
                    {settings.receipt.footer_message || "Terima kasih atas kunjungan Anda!"}
                  </div>

                  {/* Zig-zag jagged cut edge at bottom */}
                  <div className="mt-4 pt-1 flex justify-center items-center text-zinc-400 text-[9px] tracking-widest">
                    - - - - - - - - - - - - - - - - - -
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
