import { supabase } from "@/lib/supabase";

export const DEFAULT_OUTLET_ID = "e0000000-0000-0000-0000-000000000001";

export type NotificationType =
  | "ORDER_NEW"
  | "STOCK_LOW"
  | "PAYMENT_PENDING"
  | "REFUND_REQUEST"
  | "SYSTEM_SECURITY";

export interface NotificationItem {
  id: string;
  outlet_id: string;
  recipient_user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: NotificationType | "ALL";
}

const NOTIFICATIONS_STORAGE_KEY = "foodpos_notifications_v1";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

const getInitialNotifications = (): NotificationItem[] => [
  {
    id: "notif-001",
    outlet_id: DEFAULT_OUTLET_ID,
    recipient_user_id: null,
    title: "Pesanan Online Baru Masuk",
    message: "Pesanan #ORD-20261110-003 (Rp 96.800) menunggu konfirmasi pembayaran transfer bank.",
    type: "ORDER_NEW",
    is_read: false,
    metadata: { order_id: "ord-mock-003", order_number: "ORD-20261110-003", channel: "ONLINE" },
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 menit lalu
  },
  {
    id: "notif-002",
    outlet_id: DEFAULT_OUTLET_ID,
    recipient_user_id: null,
    title: "Peringatan Stok Menipis",
    message: "Stok produk 'Kentang Goreng Truffle Savory' tersisa 5 porsi (di bawah batas minimum 10).",
    type: "STOCK_LOW",
    is_read: false,
    metadata: { product_id: "m0000000-0000-0000-0000-000000000007", current_stock: 5 },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 menit lalu
  },
  {
    id: "notif-003",
    outlet_id: DEFAULT_OUTLET_ID,
    recipient_user_id: null,
    title: "Pengajuan Refund Memerlukan Approval",
    message: "Kasir mengajukan refund untuk pesanan #ORD-20261110-001 senilai Rp 66.000.",
    type: "REFUND_REQUEST",
    is_read: false,
    metadata: { payment_id: "pay-mock-001", amount: 66000 },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 jam lalu
  },
  {
    id: "notif-004",
    outlet_id: DEFAULT_OUTLET_ID,
    recipient_user_id: null,
    title: "Sesi Kas Kasir Berhasil Dibuka",
    message: "Rian Kasir telah membuka sesi shift pagi dengan kas awal Rp 200.000.",
    type: "SYSTEM_SECURITY",
    is_read: true,
    metadata: { session_id: "cs-001", opening_cash: 200000 },
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 jam lalu
  },
];

const loadNotificationsFromStorage = (): NotificationItem[] => {
  if (typeof window === "undefined") return getInitialNotifications();
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      const initials = getInitialNotifications();
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initials));
      return initials;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gagal membaca notifikasi dari storage:", error);
    return getInitialNotifications();
  }
};

const saveNotificationsToStorage = (items: NotificationItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Gagal menyimpan notifikasi ke storage:", error);
  }
};

export const notificationService = {
  /**
   * Mengambil daftar notifikasi dengan opsi filter
   */
  async getNotifications(filters?: NotificationFilters): Promise<NotificationItem[]> {
    let items = loadNotificationsFromStorage();

    if (isConfiguredSupabase()) {
      try {
        const { data, error } = await supabase
          .from("notifications" as never)
          .select("*")
          .order("created_at" as never, { ascending: false })
          .limit(50);

        if (!error && data && Array.isArray(data) && data.length > 0) {
          items = (data as unknown as NotificationItem[]).map((row) => ({
            id: row.id,
            outlet_id: row.outlet_id,
            recipient_user_id: row.recipient_user_id,
            title: row.title,
            message: row.message,
            type: row.type as NotificationType,
            is_read: row.is_read,
            metadata: (row.metadata as Record<string, unknown>) || {},
            created_at: row.created_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase fetch notifications failed, fallback to local:", err);
      }
    }

    if (filters?.unreadOnly) {
      items = items.filter((n) => !n.is_read);
    }

    if (filters?.type && filters.type !== "ALL") {
      items = items.filter((n) => n.type === filters.type);
    }

    return items;
  },

  /**
   * Mengambil jumlah notifikasi yang belum dibaca
   */
  async getUnreadCount(): Promise<number> {
    const items = loadNotificationsFromStorage();
    return items.filter((n) => !n.is_read).length;
  },

  /**
   * Menandai satu notifikasi sebagai sudah dibaca
   */
  async markAsRead(id: string): Promise<boolean> {
    const items = loadNotificationsFromStorage();
    const item = items.find((n) => n.id === id);
    if (!item) return false;

    item.is_read = true;
    saveNotificationsToStorage(items);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("notifications" as never)
          .update({ is_read: true } as never)
          .eq("id" as never, id as never);
      } catch (err) {
        console.warn("Supabase mark as read failed:", err);
      }
    }

    return true;
  },

  /**
   * Menandai seluruh notifikasi aktif sebagai sudah dibaca
   */
  async markAllAsRead(): Promise<boolean> {
    const items = loadNotificationsFromStorage();
    items.forEach((n) => {
      n.is_read = true;
    });
    saveNotificationsToStorage(items);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("notifications" as never)
          .update({ is_read: true } as never)
          .eq("is_read" as never, false as never);
      } catch (err) {
        console.warn("Supabase mark all as read failed:", err);
      }
    }

    return true;
  },

  /**
   * Menambahkan notifikasi baru ke sistem
   */
  async addNotification(payload: {
    outlet_id?: string;
    recipient_user_id?: string | null;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      outlet_id: payload.outlet_id || DEFAULT_OUTLET_ID,
      recipient_user_id: payload.recipient_user_id || null,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      is_read: false,
      metadata: payload.metadata || {},
      created_at: new Date().toISOString(),
    };

    const items = loadNotificationsFromStorage();
    items.unshift(newItem);
    if (items.length > 200) {
      items.length = 200;
    }
    saveNotificationsToStorage(items);

    if (isConfiguredSupabase()) {
      try {
        await supabase.from("notifications" as never).insert({
          outlet_id: newItem.outlet_id,
          recipient_user_id: newItem.recipient_user_id,
          title: newItem.title,
          message: newItem.message,
          type: newItem.type,
          is_read: false,
          metadata: newItem.metadata,
          created_at: newItem.created_at,
        } as never);
      } catch (err) {
        console.warn("Supabase add notification failed:", err);
      }
    }

    return newItem;
  },

  /**
   * Reset data notifikasi (untuk pengujian)
   */
  async clearNotifications(): Promise<void> {
    saveNotificationsToStorage([]);
  },
};
