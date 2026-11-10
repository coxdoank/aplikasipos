import { supabase } from "@/lib/supabase";
import { orderService } from "./orderService";

export type PaymentMethod = "CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD";
export type PaymentStatus =
  | "UNPAID"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface PaymentRecord {
  id: string;
  outlet_id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  channel: "ONLINE" | "POS";
  payment_method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  cash_received?: number | null;
  change_amount?: number | null;
  reference_number?: string | null;
  proof_path?: string | null;
  proof_url?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRefundRecord {
  id: string;
  outlet_id: string;
  payment_id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  payment_method: PaymentMethod;
  refund_amount: number;
  reason: string;
  status: RefundStatus;
  requested_by_id: string;
  requested_by_name: string;
  approved_by_id?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  refund_reference?: string | null;
  created_at: string;
}

export interface CashSessionRecord {
  id: string;
  outlet_id: string;
  opened_by_id: string;
  opened_by_name: string;
  closed_by_id?: string | null;
  closed_by_name?: string | null;
  opened_at: string;
  closed_at?: string | null;
  opening_cash: number;
  total_cash_sales: number;
  total_non_cash_sales: number;
  total_cash_in: number;
  total_cash_out: number;
  expected_closing_cash?: number | null;
  actual_closing_cash?: number | null;
  discrepancy?: number | null;
  status: "OPEN" | "CLOSED";
  closing_notes?: string | null;
  created_at: string;
}

export interface CashTransactionRecord {
  id: string;
  session_id: string;
  transaction_type: "CASH_IN" | "CASH_OUT";
  amount: number;
  reason: string;
  actor_name: string;
  created_at: string;
}

export interface PaymentStats {
  totalPaymentsCount: number;
  totalPaidRevenue: number;
  pendingVerificationCount: number;
  refundPendingCount: number;
  totalRefundedAmount: number;
  cashSalesAmount: number;
  nonCashSalesAmount: number;
}

const PAYMENTS_KEY = "foodpos_payments_v1";
const REFUNDS_KEY = "foodpos_refunds_v1";
const SESSIONS_KEY = "foodpos_cash_sessions_v1";
const TRANSACTIONS_KEY = "foodpos_cash_transactions_v1";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

const getInitialPayments = (): PaymentRecord[] => [
  {
    id: "pay-init-001",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_id: "ord-mock-001",
    order_number: "ORD-20261109-001",
    customer_name: "Budi Santoso",
    channel: "POS",
    payment_method: "CASH",
    status: "PAID",
    amount: 126500,
    cash_received: 150000,
    change_amount: 23500,
    reference_number: "CASH-POS-001",
    verified_by: "Budi Santoso (Kasir)",
    verified_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-init-002",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_id: "ord-mock-002",
    order_number: "ORD-20261109-002",
    customer_name: "Siti Rahma",
    channel: "ONLINE",
    payment_method: "QRIS",
    status: "PAID",
    amount: 82500,
    reference_number: "QRIS-ID-88492019",
    verified_by: "Sistem Otomatis QRIS",
    verified_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-init-003",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_id: "ord-mock-004",
    order_number: "ORD-20261109-004",
    customer_name: "Dewi Lestari",
    channel: "POS",
    payment_method: "DEBIT_CARD",
    status: "PAID",
    amount: 192500,
    reference_number: "EDC-BCA-940211",
    verified_by: "Budi Santoso (Kasir)",
    verified_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-init-004",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_id: "ord-mock-003",
    order_number: "ORD-20261109-003",
    customer_name: "Ahmad Fauzi",
    channel: "ONLINE",
    payment_method: "BANK_TRANSFER",
    status: "PENDING_VERIFICATION",
    amount: 85000,
    reference_number: "TRF-BCA-98124",
    proof_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-init-005",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    order_id: "ord-mock-005",
    order_number: "ORD-20261109-005",
    customer_name: "Rian Pratama",
    channel: "ONLINE",
    payment_method: "QRIS",
    status: "REFUND_PENDING",
    amount: 45000,
    reference_number: "QRIS-ID-77291033",
    verified_by: "Sistem Otomatis",
    verified_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

const getInitialRefunds = (): PaymentRefundRecord[] => [
  {
    id: "ref-init-001",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    payment_id: "pay-init-005",
    order_id: "ord-mock-005",
    order_number: "ORD-20261109-005",
    customer_name: "Rian Pratama",
    payment_method: "QRIS",
    refund_amount: 45000,
    reason: "Pelanggan harus segera pergi sebelum makanan sempat dimasak dapur",
    status: "PENDING",
    requested_by_id: "usr-cashier-01",
    requested_by_name: "Budi Santoso (Kasir Shift 1)",
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

const getInitialSessions = (): CashSessionRecord[] => [
  {
    id: "session-init-001",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    opened_by_id: "usr-cashier-01",
    opened_by_name: "Budi Santoso (Kasir Shift 1)",
    opened_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    opening_cash: 200000,
    total_cash_sales: 126500,
    total_non_cash_sales: 275000,
    total_cash_in: 0,
    total_cash_out: 0,
    status: "OPEN",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

const loadPayments = (): PaymentRecord[] => {
  if (typeof window === "undefined") return getInitialPayments();
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) {
      const init = getInitialPayments();
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialPayments();
  } catch {
    return getInitialPayments();
  }
};

const savePayments = (data: PaymentRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const loadRefunds = (): PaymentRefundRecord[] => {
  if (typeof window === "undefined") return getInitialRefunds();
  try {
    const raw = localStorage.getItem(REFUNDS_KEY);
    if (!raw) {
      const init = getInitialRefunds();
      localStorage.setItem(REFUNDS_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialRefunds();
  } catch {
    return getInitialRefunds();
  }
};

const saveRefunds = (data: PaymentRefundRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFUNDS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const loadSessions = (): CashSessionRecord[] => {
  if (typeof window === "undefined") return getInitialSessions();
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      const init = getInitialSessions();
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialSessions();
  } catch {
    return getInitialSessions();
  }
};

const saveSessions = (data: CashSessionRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const loadTransactions = (): CashTransactionRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTransactions = (data: CashTransactionRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const paymentService = {
  // 1. Get Payments with Filtering
  async getPayments(filters?: {
    search?: string;
    status?: PaymentStatus | "ALL";
    method?: PaymentMethod | "ALL";
    channel?: "ONLINE" | "POS" | "ALL";
  }): Promise<PaymentRecord[]> {
    if (isConfiguredSupabase()) {
      try {
        let query = supabase
          .from("order_payments")
          .select("*, orders(order_number, customer_name_snapshot, channel)")
          .order("created_at", { ascending: false });

        if (filters?.status && filters.status !== "ALL") {
          query = query.eq("status", filters.status);
        }
        if (filters?.method && filters.method !== "ALL") {
          query = query.eq("payment_method", filters.method);
        }

        const { data, error } = await query;
        if (!error && data) {
          interface SupabasePaymentRow {
            id: string;
            outlet_id: string;
            order_id: string;
            payment_method: PaymentMethod;
            status: PaymentStatus;
            amount: number;
            cash_received?: number | null;
            change_amount?: number | null;
            reference_number?: string | null;
            proof_path?: string | null;
            verified_by?: string | null;
            verified_at?: string | null;
            created_at: string;
            updated_at: string;
            orders?: {
              order_number: string;
              customer_name_snapshot: string;
              channel: "ONLINE" | "POS";
            } | null;
          }

          return (data as unknown as SupabasePaymentRow[]).map((row) => ({
            id: row.id,
            outlet_id: row.outlet_id,
            order_id: row.order_id,
            order_number: row.orders?.order_number || "-",
            customer_name: row.orders?.customer_name_snapshot || "Pelanggan",
            channel: row.orders?.channel || "ONLINE",
            payment_method: row.payment_method,
            status: row.status,
            amount: Number(row.amount),
            cash_received: row.cash_received ? Number(row.cash_received) : null,
            change_amount: row.change_amount ? Number(row.change_amount) : null,
            reference_number: row.reference_number,
            proof_path: row.proof_path,
            proof_url: row.proof_path,
            verified_by: row.verified_by,
            verified_at: row.verified_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
        }
      } catch {
        // Fall back to local
      }
    }

    let payments = loadPayments();

    if (filters?.status && filters.status !== "ALL") {
      payments = payments.filter((p) => p.status === filters.status);
    }
    if (filters?.method && filters.method !== "ALL") {
      payments = payments.filter((p) => p.payment_method === filters.method);
    }
    if (filters?.channel && filters.channel !== "ALL") {
      payments = payments.filter((p) => p.channel === filters.channel);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.order_number.toLowerCase().includes(q) ||
          p.customer_name.toLowerCase().includes(q) ||
          (p.reference_number && p.reference_number.toLowerCase().includes(q))
      );
    }

    return payments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // 2. Get Single Payment
  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    const payments = loadPayments();
    return payments.find((p) => p.id === id) || null;
  },

  // 3. Verify Payment Proof (Manual Verification for Bank Transfer / QRIS)
  async verifyPayment(
    paymentId: string,
    actorName: string,
    _notes?: string
  ): Promise<{ success: boolean; message: string; payment?: PaymentRecord }> {
    const payments = loadPayments();
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return { success: false, message: "Data pembayaran tidak ditemukan." };
    }

    const payment = payments[index];
    if (payment.status === "PAID") {
      return { success: false, message: "Pembayaran ini sudah diverifikasi sebelumnya." };
    }

    const now = new Date().toISOString();
    payment.status = "PAID";
    payment.verified_by = actorName;
    payment.verified_at = now;
    payment.updated_at = now;

    payments[index] = payment;
    savePayments(payments);

    // Also advance linked order from NEW to PROCESSING if it was awaiting verification
    const order = await orderService.getOrderById(payment.order_id);
    if (order && order.order_status === "NEW") {
      await orderService.updateOrderStatus(order.id, "PROCESSING", {
        name: `${actorName} (Verifikasi Pembayaran)`,
      });
      orderService.playKitchenChime();
    }

    return {
      success: true,
      message: `Pembayaran pesanan ${payment.order_number} berhasil diverifikasi dan disetujui.`,
      payment,
    };
  },

  // 4. Reject Payment Proof
  async rejectPayment(
    paymentId: string,
    actorName: string,
    reason: string
  ): Promise<{ success: boolean; message: string; payment?: PaymentRecord }> {
    if (!reason || !reason.trim()) {
      return { success: false, message: "Alasan penolakan bukti pembayaran wajib diisi." };
    }

    const payments = loadPayments();
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return { success: false, message: "Data pembayaran tidak ditemukan." };
    }

    const payment = payments[index];
    const now = new Date().toISOString();
    payment.status = "FAILED";
    payment.rejection_reason = reason.trim();
    payment.verified_by = actorName;
    payment.verified_at = now;
    payment.updated_at = now;

    payments[index] = payment;
    savePayments(payments);

    // Cancel order due to invalid payment
    const order = await orderService.getOrderById(payment.order_id);
    if (order && order.order_status !== "CANCELLED" && order.order_status !== "COMPLETED") {
      await orderService.cancelOrder(
        order.id,
        `Pembayaran ditolak: ${reason.trim()}`,
        { name: actorName }
      );
    }

    return {
      success: true,
      message: `Pembayaran pesanan ${payment.order_number} telah ditolak.`,
      payment,
    };
  },

  // 5. Request Refund (Dual-Custody: Staf requests refund)
  async requestRefund(
    paymentId: string,
    amount: number,
    reason: string,
    requester: { id: string; name: string }
  ): Promise<{ success: boolean; message: string; refund?: PaymentRefundRecord }> {
    if (!reason || !reason.trim()) {
      return { success: false, message: "Alasan pengajuan refund wajib diisi." };
    }

    const payments = loadPayments();
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return { success: false, message: "Pembayaran tidak ditemukan." };
    }

    const payment = payments[index];
    if (payment.status !== "PAID") {
      return {
        success: false,
        message: `Hanya pembayaran berstatus LUNAS (PAID) yang dapat diajukan refund (Status saat ini: ${payment.status}).`,
      };
    }

    if (amount <= 0 || amount > payment.amount) {
      return {
        success: false,
        message: `Nominal refund tidak valid (Maksimal: Rp ${payment.amount.toLocaleString("id-ID")}).`,
      };
    }

    // Update payment status to REFUND_PENDING
    payment.status = "REFUND_PENDING";
    payment.updated_at = new Date().toISOString();
    payments[index] = payment;
    savePayments(payments);

    // Create refund record
    const refundRecord: PaymentRefundRecord = {
      id: `ref-${Date.now()}`,
      outlet_id: payment.outlet_id,
      payment_id: payment.id,
      order_id: payment.order_id,
      order_number: payment.order_number,
      customer_name: payment.customer_name,
      payment_method: payment.payment_method,
      refund_amount: amount,
      reason: reason.trim(),
      status: "PENDING",
      requested_by_id: requester.id,
      requested_by_name: requester.name,
      created_at: new Date().toISOString(),
    };

    const refunds = loadRefunds();
    refunds.unshift(refundRecord);
    saveRefunds(refunds);

    return {
      success: true,
      message: `Pengajuan refund sebesar Rp ${amount.toLocaleString("id-ID")} untuk ${payment.order_number} berhasil dibuat dan menunggu persetujuan Owner/Admin.`,
      refund: refundRecord,
    };
  },

  // 6. Approve Refund (Dual-Custody: Owner / Admin approves, Requester != Approver)
  async approveRefund(
    refundId: string,
    approver: { id: string; name: string }
  ): Promise<{ success: boolean; message: string; refund?: PaymentRefundRecord }> {
    const refunds = loadRefunds();
    const index = refunds.findIndex((r) => r.id === refundId);
    if (index === -1) {
      return { success: false, message: "Pengajuan refund tidak ditemukan." };
    }

    const refund = refunds[index];
    if (refund.status !== "PENDING") {
      return { success: false, message: `Refund ini sudah berstatus ${refund.status}.` };
    }

    // Critical Dual-Custody Rule: Requester cannot approve their own refund!
    if (refund.requested_by_id === approver.id) {
      return {
        success: false,
        message:
          "Keamanan Dual-Custody: Pemohon refund tidak diizinkan menyetujui pengajuannya sendiri. Mintalah Owner atau Admin lain untuk menyetujui.",
      };
    }

    const now = new Date().toISOString();
    refund.status = "APPROVED";
    refund.approved_by_id = approver.id;
    refund.approved_by_name = approver.name;
    refund.approved_at = now;
    refund.refund_reference = `REF-TX-${Date.now().toString().slice(-6)}`;

    refunds[index] = refund;
    saveRefunds(refunds);

    // Update payment record to REFUNDED
    const payments = loadPayments();
    const pIndex = payments.findIndex((p) => p.id === refund.payment_id);
    if (pIndex !== -1) {
      payments[pIndex].status = "REFUNDED";
      payments[pIndex].updated_at = now;
      savePayments(payments);
    }

    // Cancel order if not yet cancelled
    const order = await orderService.getOrderById(refund.order_id);
    if (order && order.order_status !== "CANCELLED") {
      await orderService.cancelOrder(
        order.id,
        `Pengembalian dana (Refund) telah disetujui oleh ${approver.name}`,
        { id: approver.id, name: approver.name }
      );
    }

    return {
      success: true,
      message: `Refund pesanan ${refund.order_number} sebesar Rp ${refund.refund_amount.toLocaleString("id-ID")} berhasil disetujui.`,
      refund,
    };
  },

  // 7. Reject Refund
  async rejectRefund(
    refundId: string,
    approver: { id: string; name: string },
    reason: string
  ): Promise<{ success: boolean; message: string; refund?: PaymentRefundRecord }> {
    if (!reason || !reason.trim()) {
      return { success: false, message: "Alasan penolakan refund wajib diisi." };
    }

    const refunds = loadRefunds();
    const index = refunds.findIndex((r) => r.id === refundId);
    if (index === -1) {
      return { success: false, message: "Pengajuan refund tidak ditemukan." };
    }

    const refund = refunds[index];
    const now = new Date().toISOString();
    refund.status = "REJECTED";
    refund.approved_by_id = approver.id;
    refund.approved_by_name = approver.name;
    refund.approved_at = now;
    refund.rejected_reason = reason.trim();

    refunds[index] = refund;
    saveRefunds(refunds);

    // Revert payment status back to PAID
    const payments = loadPayments();
    const pIndex = payments.findIndex((p) => p.id === refund.payment_id);
    if (pIndex !== -1) {
      payments[pIndex].status = "PAID";
      payments[pIndex].updated_at = now;
      savePayments(payments);
    }

    return {
      success: true,
      message: `Pengajuan refund pesanan ${refund.order_number} telah ditolak. Status pembayaran dikembalikan ke Lunas.`,
      refund,
    };
  },

  // 8. Get Refunds List
  async getRefunds(): Promise<PaymentRefundRecord[]> {
    return loadRefunds();
  },

  // 9. Cash Drawer & Shift Sessions
  async getCurrentCashSession(): Promise<CashSessionRecord | null> {
    const sessions = loadSessions();
    const active = sessions.find((s) => s.status === "OPEN");
    return active || null;
  },

  async openCashSession(
    openingCash: number,
    actor: { id: string; name: string }
  ): Promise<{ success: boolean; message: string; session?: CashSessionRecord }> {
    const active = await this.getCurrentCashSession();
    if (active) {
      return {
        success: false,
        message: `Sesi kasir aktif (${active.opened_by_name}) masih terbuka. Tutup sesi sebelumnya sebelum membuka shift baru.`,
      };
    }

    if (openingCash < 0) {
      return { success: false, message: "Modal kas awal tidak boleh bernilai negatif." };
    }

    const newSession: CashSessionRecord = {
      id: `session-${Date.now()}`,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      opened_by_id: actor.id,
      opened_by_name: actor.name,
      opened_at: new Date().toISOString(),
      opening_cash: openingCash,
      total_cash_sales: 0,
      total_non_cash_sales: 0,
      total_cash_in: 0,
      total_cash_out: 0,
      status: "OPEN",
      created_at: new Date().toISOString(),
    };

    const sessions = loadSessions();
    sessions.unshift(newSession);
    saveSessions(sessions);

    return {
      success: true,
      message: `Shift kasir berhasil dibuka dengan modal awal Rp ${openingCash.toLocaleString("id-ID")}.`,
      session: newSession,
    };
  },

  async closeCashSession(
    sessionId: string,
    actualCash: number,
    actor: { id: string; name: string },
    notes?: string
  ): Promise<{ success: boolean; message: string; session?: CashSessionRecord }> {
    const sessions = loadSessions();
    const index = sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) {
      return { success: false, message: "Sesi kasir tidak ditemukan." };
    }

    const session = sessions[index];
    if (session.status === "CLOSED") {
      return { success: false, message: "Sesi kasir ini sudah ditutup sebelumnya." };
    }

    if (actualCash < 0) {
      return { success: false, message: "Total kas fisik aktual tidak boleh negatif." };
    }

    // Expected closing cash = opening_cash + total_cash_sales + total_cash_in - total_cash_out
    const expectedClosingCash =
      session.opening_cash +
      session.total_cash_sales +
      session.total_cash_in -
      session.total_cash_out;

    const discrepancy = actualCash - expectedClosingCash;
    const now = new Date().toISOString();

    session.closed_by_id = actor.id;
    session.closed_by_name = actor.name;
    session.closed_at = now;
    session.actual_closing_cash = actualCash;
    session.expected_closing_cash = expectedClosingCash;
    session.discrepancy = discrepancy;
    session.closing_notes = notes ? notes.trim() : null;
    session.status = "CLOSED";

    sessions[index] = session;
    saveSessions(sessions);

    const discrepancyText =
      discrepancy === 0
        ? "Tepat (Pas)"
        : discrepancy > 0
        ? `Surplus/Lebih (+Rp ${discrepancy.toLocaleString("id-ID")})`
        : `Defisit/Kurang (-Rp ${Math.abs(discrepancy).toLocaleString("id-ID")})`;

    return {
      success: true,
      message: `Shift kasir resmi ditutup. Fisik: Rp ${actualCash.toLocaleString("id-ID")}, Sistem: Rp ${expectedClosingCash.toLocaleString("id-ID")}, Selisih: ${discrepancyText}.`,
      session,
    };
  },

  async addCashTransaction(
    sessionId: string,
    type: "CASH_IN" | "CASH_OUT",
    amount: number,
    reason: string,
    actorName: string
  ): Promise<{ success: boolean; message: string; transaction?: CashTransactionRecord }> {
    if (amount <= 0) {
      return { success: false, message: "Nominal transaksi harus lebih dari 0." };
    }
    if (!reason || !reason.trim()) {
      return { success: false, message: "Keterangan alasan transaksi wajib diisi." };
    }

    const sessions = loadSessions();
    const index = sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) {
      return { success: false, message: "Sesi kasir tidak ditemukan." };
    }

    const session = sessions[index];
    if (session.status !== "OPEN") {
      return { success: false, message: "Tidak dapat menambah transaksi pada sesi kasir yang sudah ditutup." };
    }

    if (type === "CASH_IN") {
      session.total_cash_in += amount;
    } else {
      session.total_cash_out += amount;
    }

    sessions[index] = session;
    saveSessions(sessions);

    const transaction: CashTransactionRecord = {
      id: `tx-${Date.now()}`,
      session_id: sessionId,
      transaction_type: type,
      amount,
      reason: reason.trim(),
      actor_name: actorName,
      created_at: new Date().toISOString(),
    };

    const txs = loadTransactions();
    txs.unshift(transaction);
    saveTransactions(txs);

    return {
      success: true,
      message: `Arus kas ${type === "CASH_IN" ? "Masuk" : "Keluar"} sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat.`,
      transaction,
    };
  },

  async getCashTransactions(sessionId?: string): Promise<CashTransactionRecord[]> {
    const txs = loadTransactions();
    if (sessionId) {
      return txs.filter((t) => t.session_id === sessionId);
    }
    return txs;
  },

  async getCashSessions(): Promise<CashSessionRecord[]> {
    return loadSessions();
  },

  // 10. Financial & Payment Summary Statistics
  async getPaymentStats(): Promise<PaymentStats> {
    const payments = loadPayments();
    let totalPaidRevenue = 0;
    let pendingVerificationCount = 0;
    let refundPendingCount = 0;
    let totalRefundedAmount = 0;
    let cashSalesAmount = 0;
    let nonCashSalesAmount = 0;

    for (const p of payments) {
      if (p.status === "PAID") {
        totalPaidRevenue += p.amount;
        if (p.payment_method === "CASH") {
          cashSalesAmount += p.amount;
        } else {
          nonCashSalesAmount += p.amount;
        }
      } else if (p.status === "PENDING_VERIFICATION") {
        pendingVerificationCount++;
      } else if (p.status === "REFUND_PENDING") {
        refundPendingCount++;
      } else if (p.status === "REFUNDED") {
        totalRefundedAmount += p.amount;
      }
    }

    return {
      totalPaymentsCount: payments.length,
      totalPaidRevenue,
      pendingVerificationCount,
      refundPendingCount,
      totalRefundedAmount,
      cashSalesAmount,
      nonCashSalesAmount,
    };
  },

  resetDemoPayments(): void {
    savePayments(getInitialPayments());
    saveRefunds(getInitialRefunds());
    saveSessions(getInitialSessions());
    saveTransactions([]);
  },
};
