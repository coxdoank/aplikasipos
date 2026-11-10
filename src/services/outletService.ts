import { supabase } from "@/lib/supabase";
import type { OutletInfo } from "@/services/settingService";

export const DEFAULT_OUTLET_ID = "e0000000-0000-0000-0000-000000000001";

const OUTLETS_STORAGE_KEY = "foodpos_outlets_v1";
const ACTIVE_OUTLET_STORAGE_KEY = "foodpos_active_outlet_id";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

export const INITIAL_OUTLETS: OutletInfo[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    code: "JKT-01",
    name: "FOODPOS Outlet Pusat Senopati",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan 12190",
    phone: "0812-3456-7890",
    is_active: true,
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    code: "JKT-02",
    name: "FOODPOS Cabang Kemang Urban",
    address: "Jl. Kemang Raya No. 18, Mampang Prapatan, Jakarta Selatan 12730",
    phone: "0813-8899-7711",
    is_active: true,
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    code: "BDG-01",
    name: "FOODPOS Cabang Dago Heritage",
    address: "Jl. Ir. H. Juanda No. 120, Dago, Coblong, Kota Bandung 40132",
    phone: "0821-4455-6677",
    is_active: true,
  },
];

const loadOutletsFromStorage = (): OutletInfo[] => {
  if (typeof window === "undefined") return INITIAL_OUTLETS;
  try {
    const raw = localStorage.getItem(OUTLETS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(INITIAL_OUTLETS));
      return INITIAL_OUTLETS;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gagal membaca outlets dari storage:", error);
    return INITIAL_OUTLETS;
  }
};

const saveOutletsToStorage = (outlets: OutletInfo[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(outlets));
  } catch (error) {
    console.error("Gagal menyimpan outlets ke storage:", error);
  }
};

export const outletService = {
  /**
   * Mengambil daftar seluruh outlet restoran
   */
  async getOutlets(): Promise<OutletInfo[]> {
    let outlets = loadOutletsFromStorage();

    if (isConfiguredSupabase()) {
      try {
        const { data, error } = await supabase
          .from("outlets" as never)
          .select("*")
          .order("code" as never, { ascending: true });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          outlets = (data as unknown as OutletInfo[]).map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            address: row.address,
            phone: row.phone,
            is_active: row.is_active,
          }));
          saveOutletsToStorage(outlets);
        }
      } catch (err) {
        console.warn("Supabase fetch outlets failed, fallback to local:", err);
      }
    }

    return outlets;
  },

  /**
   * Mengambil satu outlet berdasarkan ID
   */
  async getOutletById(id: string): Promise<OutletInfo | null> {
    const outlets = await this.getOutlets();
    return outlets.find((o) => o.id === id) || null;
  },

  /**
   * Mengambil ID outlet aktif yang sedang digunakan pengguna
   */
  getActiveOutletId(): string {
    if (typeof window === "undefined") return DEFAULT_OUTLET_ID;
    return localStorage.getItem(ACTIVE_OUTLET_STORAGE_KEY) || DEFAULT_OUTLET_ID;
  },

  /**
   * Mengubah ID outlet aktif dan menyimpan ke storage
   */
  setActiveOutletId(id: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACTIVE_OUTLET_STORAGE_KEY, id);
  },

  /**
   * Beralih ke outlet lain (Outlet Switcher)
   */
  async switchOutlet(id: string): Promise<OutletInfo> {
    const target = await this.getOutletById(id);
    if (!target) {
      throw new Error(`Outlet dengan ID "${id}" tidak ditemukan.`);
    }
    this.setActiveOutletId(id);
    return target;
  },

  /**
   * Mendaftarkan outlet cabang baru (Owner wewenang)
   */
  async createOutlet(payload: {
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    is_active?: boolean;
  }): Promise<OutletInfo> {
    const outlets = loadOutletsFromStorage();

    // Validasi keunikan kode outlet
    if (outlets.some((o) => o.code.toUpperCase() === payload.code.toUpperCase())) {
      throw new Error(`Kode outlet "${payload.code}" sudah digunakan.`);
    }

    const newOutlet: OutletInfo = {
      id: `out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      address: payload.address || null,
      phone: payload.phone || null,
      is_active: payload.is_active ?? true,
    };

    outlets.push(newOutlet);
    saveOutletsToStorage(outlets);

    if (isConfiguredSupabase()) {
      try {
        await supabase.from("outlets" as never).insert({
          id: newOutlet.id,
          code: newOutlet.code,
          name: newOutlet.name,
          address: newOutlet.address,
          phone: newOutlet.phone,
          is_active: newOutlet.is_active,
        } as never);
      } catch (err) {
        console.warn("Supabase create outlet failed:", err);
      }
    }

    return newOutlet;
  },

  /**
   * Mengupdate informasi outlet cabang
   */
  async updateOutlet(id: string, payload: Partial<OutletInfo>): Promise<OutletInfo> {
    const outlets = loadOutletsFromStorage();
    const idx = outlets.findIndex((o) => o.id === id);
    if (idx === -1) {
      throw new Error("Outlet tidak ditemukan.");
    }

    const updated = {
      ...outlets[idx],
      ...payload,
      id,
    };

    outlets[idx] = updated;
    saveOutletsToStorage(outlets);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("outlets" as never)
          .update({
            code: updated.code,
            name: updated.name,
            address: updated.address,
            phone: updated.phone,
            is_active: updated.is_active,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id" as never, id as never);
      } catch (err) {
        console.warn("Supabase update outlet failed:", err);
      }
    }

    return updated;
  },

  /**
   * Reset data outlet ke initial state
   */
  async resetOutlets(): Promise<void> {
    saveOutletsToStorage(INITIAL_OUTLETS);
    this.setActiveOutletId(DEFAULT_OUTLET_ID);
  },
};
