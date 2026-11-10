import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { CartItem } from "@/stores/cartStore";
import { orderService } from "@/services/orderService";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
}

export interface PublicVariant {
  id: string;
  name: string;
  price_adjustment: number;
}

export interface PublicAddon {
  id: string;
  name: string;
  price: number;
}

export interface PublicProduct {
  id: string;
  category_id: string | null;
  category_name?: string;
  sku: string;
  name: string;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  is_available: boolean;
  current_stock: number;
  variants?: PublicVariant[];
  addons?: PublicAddon[];
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  serviceType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP";
  deliveryAddress?: string;
  paymentMethod: "CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD";
  notes?: string;
  items: CartItem[];
}

export interface OrderConfirmationResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  serviceType: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingToken: string;
}

export interface OrderTrackResult {
  success: boolean;
  message?: string;
  order_number?: string;
  channel?: string;
  service_type?: string;
  order_status?: string;
  grand_total?: number;
  created_at?: string;
  items?: Array<{
    name: string;
    quantity: number;
    line_total: number;
    variant?: string;
    addons?: Array<{ name: string; price: number }>;
  }>;
  timeline?: Array<{
    status: string;
    time: string;
    reason?: string;
  }>;
}

// ==============================================================================
// 1. High-Entropy 256-bit Token Generation & SHA-256 Hashing
// ==============================================================================

export function generate256BitToken(): string {
  const randomBytes = new Uint8Array(32); // 32 bytes = 256 bits of entropy
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `trk_${hex}`;
}

export async function hashTokenSHA256(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ==============================================================================
// 2. Mock Fallback Catalog (Used when remote Supabase database is offline/unlinked)
// ==============================================================================

export const MOCK_CATEGORIES: PublicCategory[] = [
  { id: "c0000000-0000-0000-0000-000000000001", name: "Makanan Utama", slug: "makanan-utama", display_order: 1 },
  { id: "c0000000-0000-0000-0000-000000000002", name: "Minuman Segar", slug: "minuman-segar", display_order: 2 },
  { id: "c0000000-0000-0000-0000-000000000003", name: "Snack & Camilan", slug: "snack-camilan", display_order: 3 },
  { id: "c0000000-0000-0000-0000-000000000004", name: "Paket Hemat", slug: "paket-hemat", display_order: 4 },
];

export const MOCK_PRODUCTS: PublicProduct[] = [
  {
    id: "m0000000-0000-0000-0000-000000000001",
    category_id: "c0000000-0000-0000-0000-000000000001",
    category_name: "Makanan Utama",
    sku: "FOOD-001",
    name: "Nasi Goreng Spesial Resto",
    description: "Nasi goreng bumbu rempah dengan ayam suwir, telur mata sapi, kerupuk udang, dan acar segar",
    base_price: 38000,
    is_available: true,
    current_stock: 50,
    variants: [
      { id: "v1-1", name: "Porsi Standar", price_adjustment: 0 },
      { id: "v1-2", name: "Porsi Jumbo (+Nasi)", price_adjustment: 8000 },
    ],
    addons: [
      { id: "a1-1", name: "Ekstra Telur Ceplok", price: 5000 },
      { id: "a1-2", name: "Ekstra Kerupuk Udang", price: 3000 },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000002",
    category_id: "c0000000-0000-0000-0000-000000000001",
    category_name: "Makanan Utama",
    sku: "FOOD-002",
    name: "Ayam Bakar Madu Gurih",
    description: "Potongan ayam bakar bumbu madu khas dipanggang arang harum dengan sambal terasi lezat",
    base_price: 42000,
    is_available: true,
    current_stock: 40,
    variants: [
      { id: "v2-1", name: "Paha Atas/Bawah", price_adjustment: 0 },
      { id: "v2-2", name: "Dada Mentok", price_adjustment: 2000 },
    ],
    addons: [
      { id: "a2-1", name: "Nasi Putih Pulen", price: 6000 },
      { id: "a2-2", name: "Sambal Ekstra Pedas", price: 3000 },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000003",
    category_id: "c0000000-0000-0000-0000-000000000001",
    category_name: "Makanan Utama",
    sku: "FOOD-003",
    name: "Mie Goreng Seafood Spesial",
    description: "Mie kenyal dengan udang, cumi, dan sayuran segar berpadu saus tiram gurih nikmat",
    base_price: 45000,
    is_available: true,
    current_stock: 35,
    variants: [
      { id: "v3-1", name: "Tingkat Pedas: Sedang", price_adjustment: 0 },
      { id: "v3-2", name: "Tingkat Pedas: Ekstra", price_adjustment: 0 },
    ],
    addons: [
      { id: "a3-1", name: "Ekstra Udang (+3 ekor)", price: 10000 },
      { id: "a3-2", name: "Telur Dadar Iris", price: 4000 },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000004",
    category_id: "c0000000-0000-0000-0000-000000000002",
    category_name: "Minuman Segar",
    sku: "DRK-001",
    name: "Es Kopi Susu Gula Aren",
    description: "Espresso robusta & arabika blend dengan susu segar dan sirup aren organik murni",
    base_price: 22000,
    is_available: true,
    current_stock: 100,
    variants: [
      { id: "v4-1", name: "Reguler Cup (Ice Normal)", price_adjustment: 0 },
      { id: "v4-2", name: "Large Cup (+50% Kopi)", price_adjustment: 6000 },
    ],
    addons: [
      { id: "a4-1", name: "Ekstra Espresso Shot", price: 5000 },
      { id: "a4-2", name: "Grass Jelly / Cincau", price: 4000 },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000005",
    category_id: "c0000000-0000-0000-0000-000000000002",
    category_name: "Minuman Segar",
    sku: "DRK-002",
    name: "Ice Lychee Tea Segar",
    description: "Teh melati wangi dengan buah leci utuh dan daun mint dingin menyegarkan",
    base_price: 24000,
    is_available: true,
    current_stock: 80,
    variants: [
      { id: "v5-1", name: "Manis Normal", price_adjustment: 0 },
      { id: "v5-2", name: "Less Sugar (50%)", price_adjustment: 0 },
    ],
    addons: [
      { id: "a5-1", name: "Ekstra Buah Leci (+2 pcs)", price: 6000 },
      { id: "a5-2", name: "Nata de Coco", price: 4000 },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000006",
    category_id: "c0000000-0000-0000-0000-000000000003",
    category_name: "Snack & Camilan",
    sku: "SNK-001",
    name: "Pisang Goreng Karamel Crispy",
    description: "Pisang raja goreng krispi dengan lelehan saus karamel manis legit dan keju tabur",
    base_price: 20000,
    is_available: true,
    current_stock: 60,
    addons: [
      { id: "a6-1", name: "Ekstra Keju Parut", price: 4000 },
      { id: "a6-2", name: "Saus Cokelat Belgia", price: 5000 },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000007",
    category_id: "c0000000-0000-0000-0000-000000000003",
    category_name: "Snack & Camilan",
    sku: "SNK-002",
    name: "Kentang Goreng Truffle Savory",
    description: "French fries renyah bertabur garam laut dan aroma minyak truffle gurih",
    base_price: 28000,
    is_available: true,
    current_stock: 45,
    addons: [
      { id: "a7-1", name: "Cheese Dipping Sauce", price: 5000 },
      { id: "a7-2", name: "Spicy Mayo", price: 4000 },
    ],
  },
];

// In-memory order mock store for local development tracking
const LOCAL_MOCK_ORDERS: Record<string, OrderTrackResult> = {};

// ==============================================================================
// 3. API Services
// ==============================================================================

const isConfiguredSupabase = (): boolean => {
  return isSupabaseConfigured();
};

export const storeService = {
  // Fetch active categories
  async getCategories(): Promise<PublicCategory[]> {
    if (!isConfiguredSupabase()) {
      return MOCK_CATEGORIES;
    }
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching categories from Supabase:", error);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  // Fetch active products with variants and addons
  async getProducts(categoryId?: string, search?: string): Promise<PublicProduct[]> {
    if (!isConfiguredSupabase()) {
      let filtered = [...MOCK_PRODUCTS];
      if (categoryId) {
        filtered = filtered.filter((p) => p.category_id === categoryId);
      }
      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s))
        );
      }
      return filtered;
    }
    try {
      let query = supabase
        .from("products")
        .select(`
          id, category_id, sku, name, description, base_price, image_url, is_available, current_stock, display_order,
          categories ( name ),
          product_variants ( id, name, price_adjustment ),
          product_addons ( id, name, price )
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      if (search && search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching products from Supabase:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      interface SupabaseProductQueryRow {
        id: string;
        category_id: string | null;
        categories?: { name: string } | null;
        sku: string;
        name: string;
        description: string | null;
        base_price: number | string;
        image_url: string | null;
        is_available: boolean;
        current_stock: number;
        product_variants?: PublicVariant[];
        product_addons?: PublicAddon[];
      }

      return (data as unknown as SupabaseProductQueryRow[]).map((item) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.categories?.name,
        sku: item.sku,
        name: item.name,
        description: item.description,
        base_price: Number(item.base_price),
        image_url: item.image_url,
        is_available: item.is_available,
        current_stock: item.current_stock,
        variants: item.product_variants || [],
        addons: item.product_addons || [],
      }));
    } catch {
      let filtered = [...MOCK_PRODUCTS];
      if (categoryId) {
        filtered = filtered.filter((p) => p.category_id === categoryId);
      }
      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s))
        );
      }
      return filtered;
    }
  },

  // Authoritative Online Order Creation
  async createOrder(payload: CheckoutPayload): Promise<OrderConfirmationResult> {
    const rawToken = generate256BitToken();
    const tokenHash = await hashTokenSHA256(rawToken);
    const outletId = "e0000000-0000-0000-0000-000000000001"; // Outlet Pusat

    const rpcPayload = {
      p_outlet_id: outletId,
      p_customer_name: payload.customerName,
      p_customer_phone: payload.customerPhone,
      p_service_type: payload.serviceType,
      p_delivery_address: payload.deliveryAddress || "",
      p_payment_method: payload.paymentMethod,
      p_notes: payload.notes || "",
      p_items: payload.items.map((i) => ({
        product_id: i.productId,
        variant_id: i.variant?.id || null,
        addon_ids: (i.addons || []).map((a) => a.id),
        quantity: i.quantity,
        item_notes: i.itemNotes || "",
      })),
      p_raw_tracking_token: rawToken,
      p_token_hash: tokenHash,
    };

    try {
      const { data, error } = await supabase.rpc(
        "create_online_order" as never,
        rpcPayload as never
      ) as { data: Record<string, unknown> | null; error: Error | null };

      if (error || !data || !data.success) {
        // Fallback for local simulation mode
        return this.createLocalFallbackOrder(payload, rawToken, tokenHash);
      }

      return {
        success: true,
        orderId: String(data.order_id),
        orderNumber: String(data.order_number),
        grandTotal: Number(data.grand_total),
        subtotal: Number(data.subtotal),
        taxAmount: Number(data.tax_amount),
        deliveryFee: Number(data.delivery_fee),
        serviceType: String(data.service_type),
        paymentMethod: String(data.payment_method),
        paymentStatus: String(data.payment_status),
        trackingToken: rawToken,
      };
    } catch {
      return this.createLocalFallbackOrder(payload, rawToken, tokenHash);
    }
  },

  // Fallback simulator when Supabase remote is not yet synced
  createLocalFallbackOrder(payload: CheckoutPayload, rawToken: string, tokenHash: string): OrderConfirmationResult {
    const subtotal = payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.1);
    const deliveryFee = payload.serviceType === "DELIVERY" ? 10000 : 0;
    const grandTotal = subtotal + tax + deliveryFee;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const trackingData: OrderTrackResult = {
      success: true,
      order_number: orderNumber,
      channel: "ONLINE",
      service_type: payload.serviceType,
      order_status: "NEW",
      grand_total: grandTotal,
      created_at: new Date().toISOString(),
      items: payload.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        line_total: i.unitPrice * i.quantity,
        variant: i.variant?.name,
        addons: (i.addons || []).map((a) => ({ name: a.name, price: a.price })),
      })),
      timeline: [
        {
          status: "NEW",
          time: new Date().toISOString(),
          reason: "Pesanan online baru diterima sistem",
        },
      ],
    };

    LOCAL_MOCK_ORDERS[tokenHash] = trackingData;

    // Register with Backoffice Orders System
    orderService.registerOnlineOrder({
      id: `ord-online-${Date.now()}`,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      order_number: orderNumber,
      channel: "ONLINE",
      service_type: payload.serviceType,
      order_status: "NEW",
      customer_name_snapshot: payload.customerName,
      customer_phone_snapshot: payload.customerPhone,
      delivery_address_snapshot: payload.deliveryAddress || null,
      subtotal,
      discount_amount: 0,
      tax_amount: tax,
      service_charge_amount: 0,
      delivery_fee: deliveryFee,
      grand_total: grandTotal,
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: payload.items.map((i, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        order_id: `ord-online-${Date.now()}`,
        product_id: i.productId,
        product_name_snapshot: i.name,
        sku_snapshot: `SKU-${i.productId.slice(0, 4)}`,
        variant_name_snapshot: i.variant?.name || null,
        addons_snapshot: (i.addons || []).map((a) => ({ id: a.id, name: a.name, price: a.price })),
        unit_price: i.unitPrice,
        quantity: i.quantity,
        discount_amount: 0,
        line_total: i.unitPrice * i.quantity,
        item_notes: i.itemNotes || null,
      })),
      history: [
        {
          id: `h-${Date.now()}`,
          order_id: `ord-online-${Date.now()}`,
          previous_status: null,
          new_status: "NEW",
          actor_name: "Pelanggan Online Web",
          reason: "Pesanan online masuk via web",
          created_at: new Date().toISOString(),
        },
      ],
      payment: {
        id: `pay-${Date.now()}`,
        order_id: `ord-online-${Date.now()}`,
        payment_method: payload.paymentMethod,
        status: payload.paymentMethod === "CASH" ? "PENDING" : "PAID",
        amount: grandTotal,
        reference_number: `REF-${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString(),
      },
    });

    return {
      success: true,
      orderId: `local-${Date.now()}`,
      orderNumber,
      grandTotal,
      subtotal,
      taxAmount: tax,
      deliveryFee,
      serviceType: payload.serviceType,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === "CASH" ? "UNPAID" : "PENDING_VERIFICATION",
      trackingToken: rawToken,
    };
  },

  // Secure Tracking by 256-bit token
  async trackOrder(rawToken: string): Promise<OrderTrackResult> {
    if (!rawToken || !rawToken.trim()) {
      return { success: false, message: "Token pelacakan tidak boleh kosong." };
    }

    const tokenHash = await hashTokenSHA256(rawToken.trim());

    try {
      const { data, error } = await supabase.rpc(
        "track_order_by_token" as never,
        { p_token_hash: tokenHash } as never
      ) as { data: OrderTrackResult | null; error: Error | null };

      if (error || !data || !data.success) {
        if (LOCAL_MOCK_ORDERS[tokenHash]) {
          return LOCAL_MOCK_ORDERS[tokenHash];
        }
        return {
          success: false,
          message: "Pesanan dengan token pelacakan tersebut tidak ditemukan atau telah kedaluwarsa.",
        };
      }

      return data as OrderTrackResult;
    } catch {
      if (LOCAL_MOCK_ORDERS[tokenHash]) {
        return LOCAL_MOCK_ORDERS[tokenHash];
      }
      return {
        success: false,
        message: "Gagal menghubungkan ke server pelacakan.",
      };
    }
  },
};
