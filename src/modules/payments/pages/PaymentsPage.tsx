import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Building,
  Coins,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  Search,
  Eye,
  FileCheck,
  TrendingUp,
  Receipt,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  paymentService,
  type PaymentRecord,
  type PaymentRefundRecord,
  type PaymentStats,
  type PaymentStatus,
  type PaymentMethod,
} from "@/services/paymentService";
import { PaymentVerifyModal } from "../components/PaymentVerifyModal";
import { RefundModal } from "../components/RefundModal";

export const PaymentsPage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canVerify = hasPermission("payments.verify");
  const canRequestRefund = hasPermission("payments.refund.request");
  const canApproveRefund = hasPermission("payments.refund.approve");

  const [activeTab, setActiveTab] = useState<"all" | "verify" | "refunds">("all");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [refunds, setRefunds] = useState<PaymentRefundRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPaymentsCount: 0,
    totalPaidRevenue: 0,
    pendingVerificationCount: 0,
    refundPendingCount: 0,
    totalRefundedAmount: 0,
    cashSalesAmount: 0,
    nonCashSalesAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters for All Payments Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "ALL">("ALL");
  const [channelFilter, setChannelFilter] = useState<"ONLINE" | "POS" | "ALL">("ALL");

  // Modals
  const [verifyModalPayment, setVerifyModalPayment] = useState<PaymentRecord | null>(null);
  const [refundModalPayment, setRefundModalPayment] = useState<PaymentRecord | null>(null);
  const [reviewRefundRecord, setReviewRefundRecord] = useState<PaymentRefundRecord | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [payList, refList, statData] = await Promise.all([
        paymentService.getPayments(),
        paymentService.getRefunds(),
        paymentService.getPaymentStats(),
      ]);
      setPayments(payList);
      setRefunds(refList);
      setStats(statData);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reference_number && p.reference_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesMethod = methodFilter === "ALL" || p.payment_method === methodFilter;
    const matchesChannel = channelFilter === "ALL" || p.channel === channelFilter;

    return matchesSearch && matchesStatus && matchesMethod && matchesChannel;
  });

  // Payments awaiting verification
  const pendingVerificationList = payments.filter(
    (p) => p.status === "PENDING_VERIFICATION"
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Lunas
          </span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
            <Clock className="h-3 w-3" /> Perlu Verifikasi
          </span>
        );
      case "REFUND_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <RotateCcw className="h-3 w-3" /> Refund Pending
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <RotateCcw className="h-3 w-3" /> Direfund
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            <XCircle className="h-3 w-3" /> Ditolak / Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case "CASH":
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <Coins className="h-3.5 w-3.5" /> Tunai
          </span>
        );
      case "QRIS":
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
            <CreditCard className="h-3.5 w-3.5" /> QRIS
          </span>
        );
      case "BANK_TRANSFER":
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400">
            <Building className="h-3.5 w-3.5" /> Transfer
          </span>
        );
      case "DEBIT_CARD":
      case "CREDIT_CARD":
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400">
            <CreditCard className="h-3.5 w-3.5" /> EDC / Kartu
          </span>
        );
      default:
        return <span>{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Pembayaran & Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Rekap transaksi kas/non-kas, verifikasi bukti transfer bank, dan persetujuan refund.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {canRequestRefund && (
            <Button
              size="sm"
              onClick={() => {
                setReviewRefundRecord(null);
                setRefundModalPayment(null);
                setIsRefundModalOpen(true);
              }}
              className="text-xs gap-1.5 font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ajukan Refund
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Paid Revenue */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Pendapatan Lunas</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(stats.totalPaidRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tunai: {formatCurrency(stats.cashSalesAmount)} • Non-Tunai: {formatCurrency(stats.nonCashSalesAmount)}
          </p>
        </div>

        {/* Pending Verification Alert */}
        <div
          onClick={() => setActiveTab("verify")}
          className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm space-y-1 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">Menunggu Verifikasi</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats.pendingVerificationCount}
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70">
            Perlu dicocokkan dengan mutasi bank
          </p>
        </div>

        {/* Refund Pending Alert */}
        <div
          onClick={() => setActiveTab("refunds")}
          className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm space-y-1 cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-xs font-medium">Pengajuan Refund Tertunda</span>
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400">
            {stats.refundPendingCount}
          </div>
          <p className="text-[11px] text-purple-600/80 dark:text-purple-400/70">
            Menunggu persetujuan Owner / Admin
          </p>
        </div>

        {/* Total Refunded Amount */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Dana Direfund</span>
            <Receipt className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {formatCurrency(stats.totalRefundedAmount)}
          </div>
          <p className="text-[11px] text-muted-foreground">Transaksi yang disetujui dibatalkan</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Semua Transaksi Pembayaran ({filteredPayments.length})
        </button>

        <button
          onClick={() => setActiveTab("verify")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "verify"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Verifikasi Transfer Bank ({pendingVerificationList.length})
        </button>

        <button
          onClick={() => setActiveTab("refunds")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "refunds"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Pengajuan Refund ({refunds.length})
        </button>
      </div>

      {/* TAB 1: ALL PAYMENTS */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. pesanan, nama pelanggan, atau no. referensi..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "ALL")}
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="PAID">Lunas (PAID)</option>
                <option value="PENDING_VERIFICATION">Perlu Verifikasi</option>
                <option value="REFUND_PENDING">Refund Pending</option>
                <option value="REFUNDED">Direfund</option>
                <option value="FAILED">Ditolak / Gagal</option>
              </select>

              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | "ALL")}
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Metode</option>
                <option value="CASH">Tunai (Cash)</option>
                <option value="QRIS">QRIS</option>
                <option value="BANK_TRANSFER">Transfer Bank</option>
                <option value="DEBIT_CARD">Debit / EDC</option>
              </select>

              {/* Channel Filter */}
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as "ONLINE" | "POS" | "ALL")}
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Saluran</option>
                <option value="POS">Kasir POS</option>
                <option value="ONLINE">Website Online</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">No. Pesanan & Waktu</th>
                    <th className="py-3 px-4">Pelanggan & Saluran</th>
                    <th className="py-3 px-4">Metode & Referensi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Nominal Tagihan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-sm">Tidak ada transaksi ditemukan</p>
                        <p className="text-xs text-muted-foreground">Coba ubah kata kunci atau filter pencarian Anda.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        {/* Order & Time */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block text-sm font-mono">
                            {p.order_number}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(p.created_at)}
                          </span>
                        </td>

                        {/* Customer & Channel */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block">{p.customer_name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-block mt-0.5">
                            {p.channel}
                          </span>
                        </td>

                        {/* Method & Ref */}
                        <td className="py-3 px-4">
                          <div>{getMethodBadge(p.payment_method)}</div>
                          {p.reference_number && (
                            <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                              Ref: {p.reference_number}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(p.status)}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-extrabold text-foreground text-sm">
                          {formatCurrency(p.amount)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === "PENDING_VERIFICATION" && canVerify && (
                              <Button
                                size="sm"
                                onClick={() => setVerifyModalPayment(p)}
                                className="text-xs h-7 gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                <Eye className="h-3 w-3" />
                                Verifikasi
                              </Button>
                            )}

                            {p.status === "PAID" && canRequestRefund && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReviewRefundRecord(null);
                                  setRefundModalPayment(p);
                                  setIsRefundModalOpen(true);
                                }}
                                className="text-xs h-7 text-rose-600 hover:bg-rose-50 border-rose-200"
                              >
                                Refund
                              </Button>
                            )}

                            {p.status === "REFUND_PENDING" && (
                              <span className="text-[11px] text-purple-600 font-semibold italic">
                                Menunggu Review
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === "verify" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Antrean Verifikasi Pembayaran ({pendingVerificationList.length})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Pesanan online dengan metode transfer bank atau QRIS manual yang memerlukan pencocokan bukti transfer.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">No. Pesanan & Waktu</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Metode & Referensi</th>
                    <th className="py-3 px-4 text-right">Nominal Tagihan</th>
                    <th className="py-3 px-4 text-center">Bukti Transfer</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {pendingVerificationList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                        <p className="font-semibold text-sm">Semua pembayaran telah diverifikasi</p>
                        <p className="text-xs text-muted-foreground">Tidak ada pembayaran tertunda yang memerlukan tindakan saat ini.</p>
                      </td>
                    </tr>
                  ) : (
                    pendingVerificationList.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">{p.order_number}</td>
                        <td className="py-3 px-4 font-semibold">{p.customer_name}</td>
                        <td className="py-3 px-4">
                          {getMethodBadge(p.payment_method)}
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            {p.reference_number || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-primary text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.proof_url ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Eye className="h-3 w-3" /> Ada Lampiran
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Tanpa Gambar</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => setVerifyModalPayment(p)}
                            disabled={!canVerify}
                            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            Tinjau Bukti
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFUND MANAGEMENT */}
      {activeTab === "refunds" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Daftar Pengajuan Pengembalian Dana (Refund)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Audit ganda (dual-custody): Staf mengajukan, persetujuan wewenang khusus oleh Owner/Admin.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">No. Pesanan & Waktu</th>
                    <th className="py-3 px-4">Pelanggan & Metode</th>
                    <th className="py-3 px-4 text-right">Nominal Refund</th>
                    <th className="py-3 px-4">Alasan Pengajuan</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <RotateCcw className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-sm">Belum ada riwayat pengajuan refund</p>
                        <p className="text-xs text-muted-foreground">Setiap transaksi pengembalian dana akan tercatat di sini.</p>
                      </td>
                    </tr>
                  ) : (
                    refunds.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">
                          {r.order_number}
                          <span className="block font-normal text-[10px] text-muted-foreground font-sans">
                            {formatDate(r.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {r.customer_name}
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {r.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                          {formatCurrency(r.refund_amount)}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate text-foreground font-medium" title={r.reason}>
                            {r.reason}
                          </p>
                          {r.rejected_reason && (
                            <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                              Ditolak: {r.rejected_reason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{r.requested_by_name}</td>
                        <td className="py-3 px-4 text-center">
                          {r.status === "PENDING" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              PENDING
                            </span>
                          )}
                          {r.status === "APPROVED" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              DISETUJUI
                            </span>
                          )}
                          {r.status === "REJECTED" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              DITOLAK
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.status === "PENDING" && canApproveRefund && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setReviewRefundRecord(r);
                                setRefundModalPayment(null);
                                setIsRefundModalOpen(true);
                              }}
                              className="text-xs h-7 gap-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                            >
                              Tinjau & Setujui
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <PaymentVerifyModal
        payment={verifyModalPayment}
        isOpen={Boolean(verifyModalPayment)}
        onClose={() => setVerifyModalPayment(null)}
        onSuccess={loadData}
      />

      {/* Refund Modal */}
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setReviewRefundRecord(null);
          setRefundModalPayment(null);
        }}
        onSuccess={loadData}
        existingRefund={reviewRefundRecord}
        targetPayment={refundModalPayment}
        payments={payments}
      />
    </div>
  );
};
