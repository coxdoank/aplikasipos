import { supabase } from "@/lib/supabase";

export const DEFAULT_OUTLET_ID = "e0000000-0000-0000-0000-000000000001";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "ORDER_CREATE"
  | "ORDER_STATUS_UPDATE"
  | "ORDER_CANCEL"
  | "PAYMENT_CREATE"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "REFUND_REQUESTED"
  | "REFUND_APPROVED"
  | "REFUND_REJECTED"
  | "CASH_SESSION_OPEN"
  | "CASH_SESSION_CLOSE"
  | "CASH_TRANSACTION_ADD"
  | "STOCK_ADJUSTMENT"
  | "SETTINGS_UPDATE"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "CUSTOMER_CREATE"
  | "CUSTOMER_UPDATE"
  | "CUSTOMER_DELETE";

export interface AuditLogItem {
  id: string;
  outlet_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  actor_name?: string | null;
  action: AuditAction | string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  entity_type?: string;
  actor_email?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStats {
  totalLogs: number;
  financialActionsCount: number;
  catalogStockActionsCount: number;
  authSecurityActionsCount: number;
}

const AUDIT_STORAGE_KEY = "foodpos_audit_logs_v1";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

const getInitialAuditLogs = (): AuditLogItem[] => [
  {
    id: "aud-001",
    outlet_id: DEFAULT_OUTLET_ID,
    actor_id: "usr-owner-001",
    actor_email: "owner@foodpos.local",
    actor_name: "Owner Utama",
    action: "AUTH_LOGIN",
    entity_type: "auth",
    entity_id: "usr-owner-001",
    details: { method: "password", role: "OWNER", browser: "Chrome 125" },
    ip_address: "192.168.1.10",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "aud-002",
    outlet_id: DEFAULT_OUTLET_ID,
    actor_id: "usr-cashier-001",
    actor_email: "cashier@foodpos.local",
    actor_name: "Rian Kasir",
    action: "CASH_SESSION_OPEN",
    entity_type: "cash_sessions",
    entity_id: "cs-001",
    details: { opening_cash: 200000, shift: "Pagi", notes: "Modal laci uang pas" },
    ip_address: "192.168.1.15",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "aud-003",
    outlet_id: DEFAULT_OUTLET_ID,
    actor_id: "usr-cashier-001",
    actor_email: "cashier@foodpos.local",
    actor_name: "Rian Kasir",
    action: "ORDER_CREATE",
    entity_type: "orders",
    entity_id: "ord-mock-001",
    details: { order_number: "ORD-20261110-001", grand_total: 66000, channel: "POS", service_type: "DINE_IN" },
    ip_address: "192.168.1.15",
    created_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
  },
  {
    id: "aud-004",
    outlet_id: DEFAULT_OUTLET_ID,
    actor_id: "usr-admin-001",
    actor_email: "admin@foodpos.local",
    actor_name: "Siti Admin",
    action: "STOCK_ADJUSTMENT",
    entity_type: "stock_movements",
    entity_id: "m0000000-0000-0000-0000-000000000001",
    details: { product_sku: "FOOD-001", previous_stock: 50, new_stock: 60, reason: "Restock stok dapur pagi" },
    ip_address: "192.168.1.12",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "aud-005",
    outlet_id: DEFAULT_OUTLET_ID,
    actor_id: "usr-admin-001",
    actor_email: "admin@foodpos.local",
    actor_name: "Siti Admin",
    action: "PAYMENT_VERIFIED",
    entity_type: "order_payments",
    entity_id: "pay-mock-003",
    details: { order_number: "ORD-20261110-003", payment_method: "BANK_TRANSFER", amount: 96800 },
    ip_address: "192.168.1.12",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "aud-006",
    outlet_id: DEFAULT_OUTLET_ID,
    actor_id: "usr-owner-001",
    actor_email: "owner@foodpos.local",
    actor_name: "Owner Utama",
    action: "SETTINGS_UPDATE",
    entity_type: "store_settings",
    entity_id: "set-store-001",
    details: { updated_fields: ["tax_rate_percent", "operating_hours"], tax_rate: 10 },
    ip_address: "192.168.1.10",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

const loadAuditLogsFromStorage = (): AuditLogItem[] => {
  if (typeof window === "undefined") return getInitialAuditLogs();
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      const initials = getInitialAuditLogs();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initials));
      return initials;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gagal membaca audit logs dari storage:", error);
    return getInitialAuditLogs();
  }
};

const saveAuditLogsToStorage = (logs: AuditLogItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Gagal menyimpan audit logs ke storage:", error);
  }
};

/**
 * Masking informasi sensitif seperti kata sandi, token, dan secret
 * agar tidak bocor ke dalam data log audit sistem
 */
const sanitizeAuditDetails = (details: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = { ...details };
  const sensitiveKeys = [
    "password",
    "pin",
    "token",
    "secret",
    "service_role",
    "apikey",
    "api_key",
    "credit_card_number",
    "cvv",
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s.toLowerCase()))) {
      sanitized[key] = "******** [TERLINDUNGI]";
    } else if (
      typeof sanitized[key] === "object" &&
      sanitized[key] !== null &&
      !Array.isArray(sanitized[key])
    ) {
      sanitized[key] = sanitizeAuditDetails(sanitized[key] as Record<string, unknown>);
    }
  }

  return sanitized;
};

export const auditService = {
  /**
   * Mencatat aktivitas log audit baru ke sistem
   */
  async logAudit(entry: {
    outlet_id?: string | null;
    actor_id?: string | null;
    actor_email?: string | null;
    actor_name?: string | null;
    action: AuditAction | string;
    entity_type: string;
    entity_id?: string | null;
    details?: Record<string, unknown>;
    ip_address?: string | null;
  }): Promise<AuditLogItem> {
    const safeDetails = sanitizeAuditDetails(entry.details || {});

    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      outlet_id: entry.outlet_id || DEFAULT_OUTLET_ID,
      actor_id: entry.actor_id || null,
      actor_email: entry.actor_email || "system@foodpos.local",
      actor_name: entry.actor_name || "Sistem FOODPOS",
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      details: safeDetails,
      ip_address: entry.ip_address || "127.0.0.1",
      created_at: new Date().toISOString(),
    };

    const currentLogs = loadAuditLogsFromStorage();
    currentLogs.unshift(newLog);
    // Simpan maksimal 500 entri log terakhir secara lokal
    if (currentLogs.length > 500) {
      currentLogs.length = 500;
    }
    saveAuditLogsToStorage(currentLogs);

    if (isConfiguredSupabase()) {
      try {
        await supabase.from("audit_logs" as never).insert({
          outlet_id: newLog.outlet_id,
          actor_id: newLog.actor_id,
          actor_email: newLog.actor_email,
          action: newLog.action,
          entity_type: newLog.entity_type,
          entity_id: newLog.entity_id,
          details: newLog.details,
          ip_address: newLog.ip_address,
          created_at: newLog.created_at,
        } as never);
      } catch (err) {
        console.warn("Supabase log audit failed, persisted locally:", err);
      }
    }

    return newLog;
  },

  /**
   * Mengambil daftar log audit dengan dukungan filter dan pencarian
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogItem[]> {
    let logs = loadAuditLogsFromStorage();

    if (isConfiguredSupabase()) {
      try {
        const { data, error } = await supabase
          .from("audit_logs" as never)
          .select("*")
          .order("created_at" as never, { ascending: false })
          .limit(100);

        if (!error && data && Array.isArray(data) && data.length > 0) {
          logs = (data as unknown as AuditLogItem[]).map((row) => ({
            id: row.id,
            outlet_id: row.outlet_id,
            actor_id: row.actor_id,
            actor_email: row.actor_email,
            actor_name: row.actor_email?.split("@")[0] || "Staf",
            action: row.action,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            details: (row.details as Record<string, unknown>) || {},
            ip_address: row.ip_address,
            created_at: row.created_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase fetch audit logs failed, fallback to local:", err);
      }
    }

    // Apply client-side filters
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity_type.toLowerCase().includes(q) ||
          (l.entity_id && l.entity_id.toLowerCase().includes(q)) ||
          (l.actor_email && l.actor_email.toLowerCase().includes(q)) ||
          (l.actor_name && l.actor_name.toLowerCase().includes(q))
      );
    }

    if (filters?.action && filters.action !== "ALL") {
      logs = logs.filter((l) => l.action === filters.action);
    }

    if (filters?.entity_type && filters.entity_type !== "ALL") {
      logs = logs.filter((l) => l.entity_type === filters.entity_type);
    }

    if (filters?.actor_email && filters.actor_email !== "ALL") {
      logs = logs.filter((l) => l.actor_email === filters.actor_email);
    }

    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      logs = logs.filter((l) => new Date(l.created_at).getTime() >= start);
    }

    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime() + 86400000;
      logs = logs.filter((l) => new Date(l.created_at).getTime() <= end);
    }

    return logs;
  },

  /**
   * Menghitung ringkasan statistik aktivitas log audit
   */
  async getAuditStats(): Promise<AuditStats> {
    const logs = loadAuditLogsFromStorage();

    const financialActions = [
      "ORDER_CREATE",
      "PAYMENT_CREATE",
      "PAYMENT_VERIFIED",
      "PAYMENT_REJECTED",
      "REFUND_REQUESTED",
      "REFUND_APPROVED",
      "CASH_SESSION_OPEN",
      "CASH_SESSION_CLOSE",
      "CASH_TRANSACTION_ADD",
    ];

    const catalogStockActions = [
      "STOCK_ADJUSTMENT",
      "PRODUCT_CREATE",
      "PRODUCT_UPDATE",
      "PRODUCT_DELETE",
      "SETTINGS_UPDATE",
    ];

    const authSecurityActions = [
      "AUTH_LOGIN",
      "AUTH_LOGOUT",
      "SECURITY_ALERT",
      "PASSWORD_CHANGE",
    ];

    const financialCount = logs.filter((l) => financialActions.includes(l.action)).length;
    const catalogCount = logs.filter((l) => catalogStockActions.includes(l.action)).length;
    const authCount = logs.filter((l) => authSecurityActions.includes(l.action)).length;

    return {
      totalLogs: logs.length,
      financialActionsCount: financialCount,
      catalogStockActionsCount: catalogCount,
      authSecurityActionsCount: authCount,
    };
  },

  /**
   * Mengenerate data CSV dari log audit untuk kepatuhan compliance & pelaporan
   */
  generateAuditCSV(logs: AuditLogItem[]): string {
    const headers = [
      "Waktu (ISO)",
      "Aksi",
      "Aktor",
      "Email Aktor",
      "Entitas",
      "Entity ID",
      "Alamat IP",
      "Rincian Metadata",
    ];

    const sanitizeCell = (val: unknown): string => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = logs.map((log) => [
      sanitizeCell(log.created_at),
      sanitizeCell(log.action),
      sanitizeCell(log.actor_name || "Staf"),
      sanitizeCell(log.actor_email || "-"),
      sanitizeCell(log.entity_type),
      sanitizeCell(log.entity_id || "-"),
      sanitizeCell(log.ip_address || "-"),
      sanitizeCell(JSON.stringify(log.details)),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  },

  /**
   * Reset data audit (untuk pengujian)
   */
  async clearAuditLogs(): Promise<void> {
    saveAuditLogsToStorage([]);
  },
};
