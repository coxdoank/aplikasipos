import { supabase } from "@/lib/supabase";

export type OrderStatus = "NEW" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED";
export type OrderChannel = "ONLINE" | "POS";
export type ServiceType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP";
export type PaymentStatus = "PENDING" | "PENDING_VERIFICATION" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItemDetail {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  variant_name_snapshot?: string | null;
  addons_snapshot?: Array<{ id?: string; name: string; price: number }>;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  line_total: number;
  item_notes?: string | null;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  actor_id?: string | null;
  actor_name?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface OrderPaymentDetail {
  id: string;
  order_id: string;
  payment_method: string;
  status: PaymentStatus;
  amount: number;
  cash_received?: number | null;
  change_amount?: number | null;
  reference_number?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface OrderDetail {
  id: string;
  outlet_id: string;
  customer_id?: string | null;
  order_number: string;
  channel: OrderChannel;
  service_type: ServiceType;
  order_status: OrderStatus;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  delivery_address_snapshot?: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge_amount: number;
  delivery_fee: number;
  grand_total: number;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemDetail[];
  history: OrderStatusHistoryEntry[];
  payment?: OrderPaymentDetail | null;
}

export interface OrderFilterOptions {
  search?: string;
  status?: OrderStatus | "ALL";
  channel?: OrderChannel | "ALL";
  serviceType?: ServiceType | "ALL";
  sortBy?: "newest" | "oldest";
}

export interface OrderSummaryStats {
  total: number;
  newCount: number;
  processingCount: number;
  readyCount: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
}

const STORAGE_KEY = "foodpos_backoffice_orders_v1";

// Helper to check if remote Supabase is configured
const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

// Initial Seed Data for local / offline operation
const INITIAL_ORDERS: OrderDetail[] = [
  {
    id: "ord-mock-001",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_number: "ORD-20261109-001",
    channel: "POS",
    service_type: "DINE_IN",
    order_status: "PROCESSING",
    customer_name_snapshot: "Budi Santoso",
    customer_phone_snapshot: "081234567890",
    delivery_address_snapshot: null,
    subtotal: 104545,
    discount_amount: 0,
    tax_amount: 10455,
    service_charge_amount: 0,
    delivery_fee: 0,
    grand_total: 115000,
    notes: "Meja 04 - Minta sambal dipisah",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-001",
        order_id: "ord-mock-001",
        product_name_snapshot: "Ayam Goreng Lengkuas",
        sku_snapshot: "AYM-001",
        variant_name_snapshot: "Paha Atas",
        addons_snapshot: [{ name: "Nasi Uduk", price: 6000 }],
        unit_price: 38000,
        quantity: 2,
        discount_amount: 0,
        line_total: 76000,
        item_notes: "Goreng garing",
      },
      {
        id: "item-002",
        order_id: "ord-mock-001",
        product_name_snapshot: "Es Teh Manis Segar",
        sku_snapshot: "MNM-001",
        addons_snapshot: [],
        unit_price: 6000,
        quantity: 2,
        discount_amount: 0,
        line_total: 12000,
      },
    ],
    history: [
      {
        id: "h-001",
        order_id: "ord-mock-001",
        previous_status: null,
        new_status: "NEW",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Pesanan POS dibuat",
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: "h-002",
        order_id: "ord-mock-001",
        previous_status: "NEW",
        new_status: "PROCESSING",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Dapur mulai menyiapkan pesanan",
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    payment: {
      id: "pay-001",
      order_id: "ord-mock-001",
      payment_method: "QRIS",
      status: "PAID",
      amount: 115000,
      reference_number: "QRIS-8937194",
      verified_by: "Kasir Shift 1",
      verified_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "ord-mock-002",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_number: "ORD-20261109-002",
    channel: "POS",
    service_type: "TAKEAWAY",
    order_status: "READY",
    customer_name_snapshot: "Siti Rahma",
    customer_phone_snapshot: "085612345678",
    delivery_address_snapshot: null,
    subtotal: 38182,
    discount_amount: 0,
    tax_amount: 3818,
    service_charge_amount: 0,
    delivery_fee: 0,
    grand_total: 42000,
    notes: "Bungkus plastik ganda",
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-003",
        order_id: "ord-mock-002",
        product_name_snapshot: "Nasi Goreng Spesial Resto",
        sku_snapshot: "NAS-001",
        addons_snapshot: [{ name: "Telur Ceplok", price: 5000 }],
        unit_price: 37000,
        quantity: 1,
        discount_amount: 0,
        line_total: 37000,
        item_notes: "Sedang, tidak pakai acar",
      },
    ],
    history: [
      {
        id: "h-003",
        order_id: "ord-mock-002",
        previous_status: null,
        new_status: "NEW",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Pesanan POS dibuat",
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
      {
        id: "h-004",
        order_id: "ord-mock-002",
        previous_status: "NEW",
        new_status: "PROCESSING",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Dimasak di wajan utama",
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "h-005",
        order_id: "ord-mock-002",
        previous_status: "PROCESSING",
        new_status: "READY",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Pesanan telah dikemas siap diambil",
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ],
    payment: {
      id: "pay-002",
      order_id: "ord-mock-002",
      payment_method: "CASH",
      status: "PAID",
      amount: 42000,
      cash_received: 50000,
      change_amount: 8000,
      verified_by: "Kasir Shift 1",
      verified_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "ord-mock-003",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_number: "ORD-20261109-003",
    channel: "ONLINE",
    service_type: "DELIVERY",
    order_status: "NEW",
    customer_name_snapshot: "Ahmad Fauzi",
    customer_phone_snapshot: "087798765432",
    delivery_address_snapshot: "Jl. Melati Indah No. 12B, RT 03/05, Kebayoran Baru",
    subtotal: 68182,
    discount_amount: 0,
    tax_amount: 6818,
    service_charge_amount: 0,
    delivery_fee: 10000,
    grand_total: 85000,
    notes: "Tolong titip di pos satpam bila rumah kosong",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-004",
        order_id: "ord-mock-003",
        product_name_snapshot: "Ayam Bakar Madu",
        sku_snapshot: "AYM-002",
        variant_name_snapshot: "Dada",
        addons_snapshot: [{ name: "Ekstra Sambal Bawang", price: 3000 }],
        unit_price: 36000,
        quantity: 2,
        discount_amount: 0,
        line_total: 72000,
      },
    ],
    history: [
      {
        id: "h-006",
        order_id: "ord-mock-003",
        previous_status: null,
        new_status: "NEW",
        actor_name: "Pelanggan Online Web",
        reason: "Pesanan online masuk via web",
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
    ],
    payment: {
      id: "pay-003",
      order_id: "ord-mock-003",
      payment_method: "BANK_TRANSFER",
      status: "PAID",
      amount: 85000,
      reference_number: "TRF-BCA-98124",
      verified_by: "Sistem Otomatis",
      verified_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "ord-mock-004",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_number: "ORD-20261109-004",
    channel: "POS",
    service_type: "DINE_IN",
    order_status: "COMPLETED",
    customer_name_snapshot: "Dewi Lestari",
    customer_phone_snapshot: "081923456789",
    delivery_address_snapshot: null,
    subtotal: 58182,
    discount_amount: 0,
    tax_amount: 5818,
    service_charge_amount: 0,
    delivery_fee: 0,
    grand_total: 64000,
    notes: "Meja 02",
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-005",
        order_id: "ord-mock-004",
        product_name_snapshot: "Mie Goreng Jawa",
        sku_snapshot: "MIE-001",
        addons_snapshot: [],
        unit_price: 32000,
        quantity: 2,
        discount_amount: 0,
        line_total: 64000,
      },
    ],
    history: [
      {
        id: "h-007",
        order_id: "ord-mock-004",
        previous_status: null,
        new_status: "NEW",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Pesanan masuk",
        created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      },
      {
        id: "h-008",
        order_id: "ord-mock-004",
        previous_status: "NEW",
        new_status: "PROCESSING",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Diproses dapur",
        created_at: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
      },
      {
        id: "h-009",
        order_id: "ord-mock-004",
        previous_status: "PROCESSING",
        new_status: "READY",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Disajikan ke meja",
        created_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
      },
      {
        id: "h-010",
        order_id: "ord-mock-004",
        previous_status: "READY",
        new_status: "COMPLETED",
        actor_name: "Budi Santoso (Kasir Shift 1)",
        reason: "Pelanggan selesai bersantap & tagihan lunas",
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
    payment: {
      id: "pay-004",
      order_id: "ord-mock-004",
      payment_method: "DEBIT_CARD",
      status: "PAID",
      amount: 64000,
      reference_number: "EDC-MDR-49182",
      verified_by: "Kasir Shift 1",
      verified_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "ord-mock-005",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_number: "ORD-20261109-005",
    channel: "ONLINE",
    service_type: "DELIVERY",
    order_status: "CANCELLED",
    customer_name_snapshot: "Rian Pratama",
    customer_phone_snapshot: "081399887766",
    delivery_address_snapshot: "Apartemen Grand Central Tower B No. 1204",
    subtotal: 45455,
    discount_amount: 0,
    tax_amount: 4545,
    service_charge_amount: 0,
    delivery_fee: 10000,
    grand_total: 60000,
    notes: "Sambal level 5",
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-006",
        order_id: "ord-mock-005",
        product_name_snapshot: "Ayam Geprek Sambal Korek",
        sku_snapshot: "AYM-003",
        addons_snapshot: [],
        unit_price: 28000,
        quantity: 1,
        discount_amount: 0,
        line_total: 28000,
      },
    ],
    history: [
      {
        id: "h-011",
        order_id: "ord-mock-005",
        previous_status: null,
        new_status: "NEW",
        actor_name: "Pelanggan Online Web",
        reason: "Pesanan dibuat online",
        created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      },
      {
        id: "h-012",
        order_id: "ord-mock-005",
        previous_status: "NEW",
        new_status: "CANCELLED",
        actor_name: "Ratna Sari (Manajer Resto)",
        reason: "Bahan baku ayam geprek habis untuk hari ini",
        created_at: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
      },
    ],
    payment: {
      id: "pay-005",
      order_id: "ord-mock-005",
      payment_method: "QRIS",
      status: "REFUNDED",
      amount: 60000,
      reference_number: "QRIS-REFUND-9128",
      created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "ord-mock-006",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_number: "ORD-20261109-006",
    channel: "ONLINE",
    service_type: "PICKUP",
    order_status: "NEW",
    customer_name_snapshot: "Maya Putri",
    customer_phone_snapshot: "081287654321",
    delivery_address_snapshot: null,
    subtotal: 50000,
    discount_amount: 0,
    tax_amount: 5000,
    service_charge_amount: 0,
    delivery_fee: 0,
    grand_total: 55000,
    notes: "Akan diambil sekitar jam 20:30 WIB",
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-007",
        order_id: "ord-mock-006",
        product_name_snapshot: "Ayam Bakar Madu",
        sku_snapshot: "AYM-002",
        variant_name_snapshot: "Paha Atas",
        addons_snapshot: [{ name: "Nasi Uduk", price: 6000 }],
        unit_price: 36000,
        quantity: 1,
        discount_amount: 0,
        line_total: 42000,
      },
    ],
    history: [
      {
        id: "h-013",
        order_id: "ord-mock-006",
        previous_status: null,
        new_status: "NEW",
        actor_name: "Pelanggan Online Web",
        reason: "Pesanan pickup baru diterima",
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
    ],
    payment: {
      id: "pay-006",
      order_id: "ord-mock-006",
      payment_method: "QRIS",
      status: "PAID",
      amount: 55000,
      reference_number: "QRIS-992144",
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
  },
];

// In-memory / LocalStorage Store Helper
const loadOrdersFromStorage = (): OrderDetail[] => {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw) as OrderDetail[];
    return Array.isArray(parsed) ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
};

const saveOrdersToStorage = (orders: OrderDetail[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore local storage quota errors
  }
};

export const orderService = {
  // Web Audio Kitchen Notification Sound (Synthesizer, zero external mp3 dependency)
  playKitchenChime(): void {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First Tone (880Hz / A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      // Second Tone (1318.5Hz / E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio autoplay policy might prevent playback without user interaction
    }
  },

  // State Machine Validation
  isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    if (current === next) return false;
    if (current === "COMPLETED" || current === "CANCELLED") return false; // terminal

    if (next === "CANCELLED") {
      // Any non-terminal order can be cancelled
      return current === "NEW" || current === "PROCESSING" || current === "READY";
    }

    if (current === "NEW") {
      return next === "PROCESSING";
    }
    if (current === "PROCESSING") {
      return next === "READY";
    }
    if (current === "READY") {
      return next === "COMPLETED";
    }

    return false;
  },

  // Check if order can be cancelled
  canCancelOrder(current: OrderStatus): boolean {
    return current === "NEW" || current === "PROCESSING" || current === "READY";
  },

  // Fetch list of orders with filters and sorting
  async getOrders(filters: OrderFilterOptions = {}): Promise<OrderDetail[]> {
    if (isConfiguredSupabase()) {
      try {
        let query = supabase
          .from("orders")
          .select(`
            *,
            items:order_items(*),
            history:order_status_history(*),
            payment:order_payments(*)
          `);

        if (filters.status && filters.status !== "ALL") {
          query = query.eq("order_status", filters.status);
        }
        if (filters.channel && filters.channel !== "ALL") {
          query = query.eq("channel", filters.channel);
        }
        if (filters.serviceType && filters.serviceType !== "ALL") {
          query = query.eq("service_type", filters.serviceType);
        }

        const isAscending = filters.sortBy === "oldest";
        query = query.order("created_at", { ascending: isAscending });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as unknown as OrderDetail[];
        }
      } catch {
        // Fall back to local store
      }
    }

    // Local / Offline store logic
    let orders = loadOrdersFromStorage();

    if (filters.status && filters.status !== "ALL") {
      orders = orders.filter((o) => o.order_status === filters.status);
    }
    if (filters.channel && filters.channel !== "ALL") {
      orders = orders.filter((o) => o.channel === filters.channel);
    }
    if (filters.serviceType && filters.serviceType !== "ALL") {
      orders = orders.filter((o) => o.service_type === filters.serviceType);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name_snapshot.toLowerCase().includes(q) ||
          o.customer_phone_snapshot.includes(q) ||
          (o.notes && o.notes.toLowerCase().includes(q))
      );
    }

    const isAscending = filters.sortBy === "oldest";
    orders.sort((a, b) => {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      return isAscending ? tA - tB : tB - tA;
    });

    return orders;
  },

  // Get single order detail
  async getOrderById(orderId: string): Promise<OrderDetail | null> {
    if (isConfiguredSupabase()) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            items:order_items(*),
            history:order_status_history(*),
            payment:order_payments(*)
          `)
          .eq("id", orderId)
          .single();

        if (!error && data) {
          return data as unknown as OrderDetail;
        }
      } catch {
        // Fall back
      }
    }

    const orders = loadOrdersFromStorage();
    const found = orders.find((o) => o.id === orderId || o.order_number === orderId);
    return found || null;
  },

  // Advance / Update Order Status
  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    actor: { id?: string; name: string }
  ): Promise<{ success: boolean; message: string; order?: OrderDetail }> {
    const orders = loadOrdersFromStorage();
    const index = orders.findIndex((o) => o.id === orderId || o.order_number === orderId);

    if (index === -1) {
      return { success: false, message: "Pesanan tidak ditemukan." };
    }

    const currentOrder = orders[index];
    const prevStatus = currentOrder.order_status;

    if (!this.isValidTransition(prevStatus, nextStatus)) {
      return {
        success: false,
        message: `Transisi status tidak valid dari ${prevStatus} ke ${nextStatus}.`,
      };
    }

    const now = new Date().toISOString();
    const reasonText =
      nextStatus === "PROCESSING"
        ? "Pesanan mulai disiapkan dapur / staf"
        : nextStatus === "READY"
        ? "Pesanan siap disajikan / dikirim"
        : nextStatus === "COMPLETED"
        ? "Pesanan telah selesai & diserahkan"
        : `Status diperbarui menjadi ${nextStatus}`;

    const newHistoryEntry: OrderStatusHistoryEntry = {
      id: `h-${Date.now()}`,
      order_id: currentOrder.id,
      previous_status: prevStatus,
      new_status: nextStatus,
      actor_id: actor.id || null,
      actor_name: actor.name,
      reason: reasonText,
      created_at: now,
    };

    const updatedOrder: OrderDetail = {
      ...currentOrder,
      order_status: nextStatus,
      updated_at: now,
      history: [...(currentOrder.history || []), newHistoryEntry],
    };

    orders[index] = updatedOrder;
    saveOrdersToStorage(orders);

    // If Supabase is connected, attempt remote sync
    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("orders")
          .update({ order_status: nextStatus } as never)
          .eq("id", currentOrder.id);

        await supabase.from("order_status_history" as never).insert({
          order_id: currentOrder.id,
          previous_status: prevStatus,
          new_status: nextStatus,
          actor_id: actor.id || null,
          actor_name: actor.name,
          reason: reasonText,
        } as never);
      } catch {
        // Continue with local update
      }
    }

    return {
      success: true,
      message: `Status pesanan ${currentOrder.order_number} berhasil diperbarui menjadi ${nextStatus}.`,
      order: updatedOrder,
    };
  },

  // Cancel Order with Mandatory Reason
  async cancelOrder(
    orderId: string,
    reason: string,
    actor: { id?: string; name: string }
  ): Promise<{ success: boolean; message: string; order?: OrderDetail }> {
    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan pembatalan pesanan wajib diisi.",
      };
    }

    const orders = loadOrdersFromStorage();
    const index = orders.findIndex((o) => o.id === orderId || o.order_number === orderId);

    if (index === -1) {
      return { success: false, message: "Pesanan tidak ditemukan." };
    }

    const currentOrder = orders[index];
    const prevStatus = currentOrder.order_status;

    if (!this.canCancelOrder(prevStatus)) {
      return {
        success: false,
        message: `Pesanan berstatus ${prevStatus} tidak dapat dibatalkan.`,
      };
    }

    const now = new Date().toISOString();
    const newHistoryEntry: OrderStatusHistoryEntry = {
      id: `h-${Date.now()}`,
      order_id: currentOrder.id,
      previous_status: prevStatus,
      new_status: "CANCELLED",
      actor_id: actor.id || null,
      actor_name: actor.name,
      reason: reason.trim(),
      created_at: now,
    };

    const updatedOrder: OrderDetail = {
      ...currentOrder,
      order_status: "CANCELLED",
      updated_at: now,
      history: [...(currentOrder.history || []), newHistoryEntry],
    };

    orders[index] = updatedOrder;
    saveOrdersToStorage(orders);

    // If Supabase is connected, attempt remote sync
    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("orders")
          .update({ order_status: "CANCELLED" } as never)
          .eq("id", currentOrder.id);

        await supabase.from("order_status_history" as never).insert({
          order_id: currentOrder.id,
          previous_status: prevStatus,
          new_status: "CANCELLED",
          actor_id: actor.id || null,
          actor_name: actor.name,
          reason: reason.trim(),
        } as never);
      } catch {
        // Continue
      }
    }

    return {
      success: true,
      message: `Pesanan ${currentOrder.order_number} berhasil dibatalkan.`,
      order: updatedOrder,
    };
  },

  // Summary statistics for badge counters & dashboards
  async getOrdersSummary(): Promise<OrderSummaryStats> {
    const orders = await this.getOrders();
    const summary: OrderSummaryStats = {
      total: orders.length,
      newCount: 0,
      processingCount: 0,
      readyCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      totalRevenue: 0,
    };

    for (const o of orders) {
      if (o.order_status === "NEW") summary.newCount++;
      else if (o.order_status === "PROCESSING") summary.processingCount++;
      else if (o.order_status === "READY") summary.readyCount++;
      else if (o.order_status === "COMPLETED") {
        summary.completedCount++;
        summary.totalRevenue += o.grand_total;
      } else if (o.order_status === "CANCELLED") {
        summary.cancelledCount++;
      }
    }

    return summary;
  },

  // Helper for newly created online orders (syncing from public store)
  registerOnlineOrder(newOrder: OrderDetail): void {
    const orders = loadOrdersFromStorage();
    const exists = orders.some((o) => o.order_number === newOrder.order_number);
    if (!exists) {
      orders.unshift(newOrder);
      saveOrdersToStorage(orders);
    }
  },

  // Reset to initial mock data (useful for testing or demo resets)
  resetDemoOrders(): void {
    saveOrdersToStorage(INITIAL_ORDERS);
  },
};
