import { supabase } from "@/lib/supabase";

export const DEFAULT_OUTLET_ID = "e0000000-0000-0000-0000-000000000001";

export interface OutletInfo {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface StoreSettings {
  id: string;
  outlet_id: string;
  business_name: string;
  business_tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  operating_hours: string | null;
  whatsapp_number: string | null;
  email: string | null;
  google_maps_url: string | null;
  estimated_prep_time_minutes: number;
  is_online_ordering_enabled: boolean;
  updated_at: string;
}

export interface PaymentSettings {
  id: string;
  outlet_id: string;
  qris_image_url: string | null;
  qris_merchant_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  is_cash_enabled: boolean;
  is_qris_enabled: boolean;
  is_transfer_enabled: boolean;
  is_card_enabled: boolean;
  updated_at: string;
}

export interface TaxSettings {
  id: string;
  outlet_id: string;
  is_enabled: boolean;
  tax_rate_percent: number;
  tax_name: string;
  updated_at: string;
}

export interface ServiceChargeSettings {
  id: string;
  outlet_id: string;
  is_enabled: boolean;
  service_rate_percent: number;
  updated_at: string;
}

export interface ReceiptSettings {
  id: string;
  outlet_id: string;
  header_title: string;
  header_subtitle: string;
  footer_message: string;
  show_wifi_info: boolean;
  wifi_ssid?: string;
  wifi_password?: string;
  show_logo: boolean;
  paper_width: "58mm" | "80mm";
  show_tax_detail: boolean;
  show_service_detail: boolean;
  updated_at: string;
}

export interface AllSettings {
  outlet: OutletInfo;
  store: StoreSettings;
  payment: PaymentSettings;
  tax: TaxSettings;
  serviceCharge: ServiceChargeSettings;
  receipt: ReceiptSettings;
}

const SETTINGS_STORAGE_KEY = "foodpos_settings_v1";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

export const getDefaultSettings = (outletId = DEFAULT_OUTLET_ID): AllSettings => ({
  outlet: {
    id: outletId,
    code: "JKT-01",
    name: "FOODPOS Outlet Pusat Senopati",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan 12190",
    phone: "0812-3456-7890",
    is_active: true,
  },
  store: {
    id: "set-store-001",
    outlet_id: outletId,
    business_name: "FOODPOS Nusantara & Coffee",
    business_tagline: "Sajian Lezat Berkualitas untuk Setiap Momen Berharga",
    description: "Restoran modern dengan sajian cita rasa khas Nusantara dan aneka kopi pilihan.",
    logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80",
    banner_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
    operating_hours: "Senin - Minggu: 10:00 - 22:00 WIB",
    whatsapp_number: "+62 812-3456-7890",
    email: "info@foodpos.local",
    google_maps_url: "https://maps.google.com/?q=Senopati+Jakarta",
    estimated_prep_time_minutes: 15,
    is_online_ordering_enabled: true,
    updated_at: new Date().toISOString(),
  },
  payment: {
    id: "set-pay-001",
    outlet_id: outletId,
    qris_image_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226600014ID.LINKAJA.WWW011893600918000000000002150000000000000005204581253033605802ID5919FOODPOS+SENOPATI6007JAKARTA61051219062070703A016304C4A1",
    qris_merchant_name: "FOODPOS OUTLET PUSAT",
    bank_name: "BCA (Bank Central Asia)",
    bank_account_number: "8820192831",
    bank_account_holder: "PT KULINER MAKMUR POS",
    is_cash_enabled: true,
    is_qris_enabled: true,
    is_transfer_enabled: true,
    is_card_enabled: true,
    updated_at: new Date().toISOString(),
  },
  tax: {
    id: "set-tax-001",
    outlet_id: outletId,
    is_enabled: true,
    tax_rate_percent: 10,
    tax_name: "PB1 / Pajak Restoran",
    updated_at: new Date().toISOString(),
  },
  serviceCharge: {
    id: "set-sc-001",
    outlet_id: outletId,
    is_enabled: false,
    service_rate_percent: 0,
    updated_at: new Date().toISOString(),
  },
  receipt: {
    id: "set-rcp-001",
    outlet_id: outletId,
    header_title: "FOODPOS RESTO & CAFE",
    header_subtitle: "Jl. Senopati No. 45, Jaksel • Telp: 0812-3456-7890",
    footer_message: "Terima kasih atas kunjungan Anda!\nSemoga hari Anda menyenangkan.",
    show_wifi_info: true,
    wifi_ssid: "FOODPOS_GUEST_5G",
    wifi_password: "kulinernikmat",
    show_logo: true,
    paper_width: "58mm",
    show_tax_detail: true,
    show_service_detail: false,
    updated_at: new Date().toISOString(),
  },
});

const loadSettingsFromStorage = (): AllSettings => {
  if (typeof window === "undefined") return getDefaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultSettings();
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    const defaults = getDefaultSettings();
    return {
      outlet: { ...defaults.outlet, ...(parsed.outlet || {}) },
      store: { ...defaults.store, ...(parsed.store || {}) },
      payment: { ...defaults.payment, ...(parsed.payment || {}) },
      tax: { ...defaults.tax, ...(parsed.tax || {}) },
      serviceCharge: { ...defaults.serviceCharge, ...(parsed.serviceCharge || {}) },
      receipt: { ...defaults.receipt, ...(parsed.receipt || {}) },
    };
  } catch (error) {
    console.error("Failed to load settings from storage:", error);
    return getDefaultSettings();
  }
};

const saveSettingsToStorage = (settings: AllSettings): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to storage:", error);
  }
};

export const settingService = {
  /**
   * Mengambil semua konfigurasi toko secara teragregasi
   */
  async getAllSettings(outletId: string = DEFAULT_OUTLET_ID): Promise<AllSettings> {
    if (isConfiguredSupabase()) {
      try {
        const [
          outletRes,
          storeRes,
          paymentRes,
          taxRes,
          scRes,
        ] = await Promise.all([
          supabase.from("outlets" as never).select("*").eq("id" as never, outletId as never).maybeSingle(),
          supabase.from("store_settings" as never).select("*").eq("outlet_id" as never, outletId as never).maybeSingle(),
          supabase.from("payment_settings" as never).select("*").eq("outlet_id" as never, outletId as never).maybeSingle(),
          supabase.from("tax_settings" as never).select("*").eq("outlet_id" as never, outletId as never).maybeSingle(),
          supabase.from("service_charge_settings" as never).select("*").eq("outlet_id" as never, outletId as never).maybeSingle(),
        ]);

        const local = loadSettingsFromStorage();

        const outletData = outletRes.data as unknown as OutletInfo | null;
        const storeData = storeRes.data as unknown as StoreSettings | null;
        const paymentData = paymentRes.data as unknown as PaymentSettings | null;
        const taxData = taxRes.data as unknown as TaxSettings | null;
        const scData = scRes.data as unknown as ServiceChargeSettings | null;

        return {
          outlet: outletData
            ? {
                id: outletData.id,
                code: outletData.code,
                name: outletData.name,
                address: outletData.address,
                phone: outletData.phone,
                is_active: outletData.is_active,
              }
            : local.outlet,
          store: storeData
            ? {
                id: storeData.id,
                outlet_id: storeData.outlet_id,
                business_name: storeData.business_name,
                business_tagline: storeData.business_tagline,
                description: storeData.description,
                logo_url: storeData.logo_url,
                banner_url: storeData.banner_url,
                operating_hours: storeData.operating_hours,
                whatsapp_number: storeData.whatsapp_number,
                email: storeData.email,
                google_maps_url: storeData.google_maps_url,
                estimated_prep_time_minutes: storeData.estimated_prep_time_minutes,
                is_online_ordering_enabled: storeData.is_online_ordering_enabled,
                updated_at: storeData.updated_at,
              }
            : local.store,
          payment: paymentData
            ? {
                id: paymentData.id,
                outlet_id: paymentData.outlet_id,
                qris_image_url: paymentData.qris_image_url,
                qris_merchant_name: paymentData.qris_merchant_name,
                bank_name: paymentData.bank_name,
                bank_account_number: paymentData.bank_account_number,
                bank_account_holder: paymentData.bank_account_holder,
                is_cash_enabled: paymentData.is_cash_enabled,
                is_qris_enabled: paymentData.is_qris_enabled,
                is_transfer_enabled: paymentData.is_transfer_enabled,
                is_card_enabled: paymentData.is_card_enabled,
                updated_at: paymentData.updated_at,
              }
            : local.payment,
          tax: taxData
            ? {
                id: taxData.id,
                outlet_id: taxData.outlet_id,
                is_enabled: taxData.is_enabled,
                tax_rate_percent: Number(taxData.tax_rate_percent),
                tax_name: taxData.tax_name,
                updated_at: taxData.updated_at,
              }
            : local.tax,
          serviceCharge: scData
            ? {
                id: scData.id,
                outlet_id: scData.outlet_id,
                is_enabled: scData.is_enabled,
                service_rate_percent: Number(scData.service_rate_percent),
                updated_at: scData.updated_at,
              }
            : local.serviceCharge,
          receipt: local.receipt,
        };
      } catch (err) {
        console.warn("Supabase fetch settings failed, fallback to local storage:", err);
      }
    }

    return loadSettingsFromStorage();
  },

  /**
   * Mengambil informasi outlet
   */
  async getOutletInfo(outletId: string = DEFAULT_OUTLET_ID): Promise<OutletInfo> {
    const all = await this.getAllSettings(outletId);
    return all.outlet;
  },

  /**
   * Mengupdate informasi outlet
   */
  async updateOutletInfo(
    outletId: string = DEFAULT_OUTLET_ID,
    payload: Partial<OutletInfo>
  ): Promise<OutletInfo> {
    const current = loadSettingsFromStorage();
    const updatedOutlet: OutletInfo = {
      ...current.outlet,
      ...payload,
      id: outletId,
    };

    current.outlet = updatedOutlet;
    saveSettingsToStorage(current);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("outlets" as never)
          .update({
            code: updatedOutlet.code,
            name: updatedOutlet.name,
            address: updatedOutlet.address,
            phone: updatedOutlet.phone,
            is_active: updatedOutlet.is_active,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id" as never, outletId as never);
      } catch (err) {
        console.warn("Supabase update outlets failed:", err);
      }
    }

    return updatedOutlet;
  },

  /**
   * Mengambil profil toko & operasional
   */
  async getStoreSettings(outletId: string = DEFAULT_OUTLET_ID): Promise<StoreSettings> {
    const all = await this.getAllSettings(outletId);
    return all.store;
  },

  /**
   * Mengupdate profil toko & operasional
   */
  async updateStoreSettings(
    outletId: string = DEFAULT_OUTLET_ID,
    payload: Partial<StoreSettings>
  ): Promise<StoreSettings> {
    const current = loadSettingsFromStorage();
    const updatedStore: StoreSettings = {
      ...current.store,
      ...payload,
      outlet_id: outletId,
      updated_at: new Date().toISOString(),
    };

    current.store = updatedStore;
    saveSettingsToStorage(current);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("store_settings" as never)
          .upsert({
            outlet_id: outletId,
            business_name: updatedStore.business_name,
            business_tagline: updatedStore.business_tagline,
            description: updatedStore.description,
            logo_url: updatedStore.logo_url,
            banner_url: updatedStore.banner_url,
            operating_hours: updatedStore.operating_hours,
            whatsapp_number: updatedStore.whatsapp_number,
            email: updatedStore.email,
            google_maps_url: updatedStore.google_maps_url,
            estimated_prep_time_minutes: updatedStore.estimated_prep_time_minutes,
            is_online_ordering_enabled: updatedStore.is_online_ordering_enabled,
            updated_at: updatedStore.updated_at,
          } as never, { onConflict: "outlet_id" } as never);
      } catch (err) {
        console.warn("Supabase update store_settings failed:", err);
      }
    }

    return updatedStore;
  },

  /**
   * Mengambil pengaturan metode pembayaran
   */
  async getPaymentSettings(outletId: string = DEFAULT_OUTLET_ID): Promise<PaymentSettings> {
    const all = await this.getAllSettings(outletId);
    return all.payment;
  },

  /**
   * Mengupdate pengaturan metode pembayaran
   */
  async updatePaymentSettings(
    outletId: string = DEFAULT_OUTLET_ID,
    payload: Partial<PaymentSettings>
  ): Promise<PaymentSettings> {
    const current = loadSettingsFromStorage();
    const updatedPayment: PaymentSettings = {
      ...current.payment,
      ...payload,
      outlet_id: outletId,
      updated_at: new Date().toISOString(),
    };

    current.payment = updatedPayment;
    saveSettingsToStorage(current);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("payment_settings" as never)
          .upsert({
            outlet_id: outletId,
            qris_image_url: updatedPayment.qris_image_url,
            qris_merchant_name: updatedPayment.qris_merchant_name,
            bank_name: updatedPayment.bank_name,
            bank_account_number: updatedPayment.bank_account_number,
            bank_account_holder: updatedPayment.bank_account_holder,
            is_cash_enabled: updatedPayment.is_cash_enabled,
            is_qris_enabled: updatedPayment.is_qris_enabled,
            is_transfer_enabled: updatedPayment.is_transfer_enabled,
            is_card_enabled: updatedPayment.is_card_enabled,
            updated_at: updatedPayment.updated_at,
          } as never, { onConflict: "outlet_id" } as never);
      } catch (err) {
        console.warn("Supabase update payment_settings failed:", err);
      }
    }

    return updatedPayment;
  },

  /**
   * Mengambil pengaturan tarif pajak PB1
   */
  async getTaxSettings(outletId: string = DEFAULT_OUTLET_ID): Promise<TaxSettings> {
    const all = await this.getAllSettings(outletId);
    return all.tax;
  },

  /**
   * Mengupdate pengaturan tarif pajak PB1
   */
  async updateTaxSettings(
    outletId: string = DEFAULT_OUTLET_ID,
    payload: Partial<TaxSettings>
  ): Promise<TaxSettings> {
    const current = loadSettingsFromStorage();
    const updatedTax: TaxSettings = {
      ...current.tax,
      ...payload,
      outlet_id: outletId,
      updated_at: new Date().toISOString(),
    };

    current.tax = updatedTax;
    saveSettingsToStorage(current);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("tax_settings" as never)
          .upsert({
            outlet_id: outletId,
            is_enabled: updatedTax.is_enabled,
            tax_rate_percent: updatedTax.tax_rate_percent,
            tax_name: updatedTax.tax_name,
            updated_at: updatedTax.updated_at,
          } as never, { onConflict: "outlet_id" } as never);
      } catch (err) {
        console.warn("Supabase update tax_settings failed:", err);
      }
    }

    return updatedTax;
  },

  /**
   * Mengambil pengaturan service charge
   */
  async getServiceChargeSettings(outletId: string = DEFAULT_OUTLET_ID): Promise<ServiceChargeSettings> {
    const all = await this.getAllSettings(outletId);
    return all.serviceCharge;
  },

  /**
   * Mengupdate pengaturan service charge
   */
  async updateServiceChargeSettings(
    outletId: string = DEFAULT_OUTLET_ID,
    payload: Partial<ServiceChargeSettings>
  ): Promise<ServiceChargeSettings> {
    const current = loadSettingsFromStorage();
    const updatedSc: ServiceChargeSettings = {
      ...current.serviceCharge,
      ...payload,
      outlet_id: outletId,
      updated_at: new Date().toISOString(),
    };

    current.serviceCharge = updatedSc;
    saveSettingsToStorage(current);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("service_charge_settings" as never)
          .upsert({
            outlet_id: outletId,
            is_enabled: updatedSc.is_enabled,
            service_rate_percent: updatedSc.service_rate_percent,
            updated_at: updatedSc.updated_at,
          } as never, { onConflict: "outlet_id" } as never);
      } catch (err) {
        console.warn("Supabase update service_charge_settings failed:", err);
      }
    }

    return updatedSc;
  },

  /**
   * Mengambil pengaturan template struk kasir
   */
  async getReceiptSettings(outletId: string = DEFAULT_OUTLET_ID): Promise<ReceiptSettings> {
    const all = await this.getAllSettings(outletId);
    return all.receipt;
  },

  /**
   * Mengupdate pengaturan template struk kasir
   */
  async updateReceiptSettings(
    outletId: string = DEFAULT_OUTLET_ID,
    payload: Partial<ReceiptSettings>
  ): Promise<ReceiptSettings> {
    const current = loadSettingsFromStorage();
    const updatedReceipt: ReceiptSettings = {
      ...current.receipt,
      ...payload,
      outlet_id: outletId,
      updated_at: new Date().toISOString(),
    };

    current.receipt = updatedReceipt;
    saveSettingsToStorage(current);
    return updatedReceipt;
  },

  /**
   * Reset seluruh konfigurasi ke nilai bawaan pabrik / default
   */
  async resetToDefaults(outletId: string = DEFAULT_OUTLET_ID): Promise<AllSettings> {
    const defaults = getDefaultSettings(outletId);
    saveSettingsToStorage(defaults);
    return defaults;
  },
};
