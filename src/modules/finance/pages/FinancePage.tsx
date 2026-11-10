import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Coins,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  History,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  paymentService,
  type CashSessionRecord,
  type CashTransactionRecord,
} from "@/services/paymentService";
import { CashSessionModal } from "../components/CashSessionModal";
import { CashTransactionModal } from "../components/CashTransactionModal";

export const FinancePage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canOpenShift = hasPermission("cash_sessions.open");
  const canCloseShift = hasPermission("cash_sessions.close");

  const [activeTab, setActiveTab] = useState<"sessions" | "transactions">("sessions");
  const [activeSession, setActiveSession] = useState<CashSessionRecord | null>(null);
  const [sessions, setSessions] = useState<CashSessionRecord[]>([]);
  const [transactions, setTransactions] = useState<CashTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [current, sessionList, txList] = await Promise.all([
        paymentService.getCurrentCashSession(),
        paymentService.getCashSessions(),
        paymentService.getCashTransactions(),
      ]);
      setActiveSession(current);
      setSessions(sessionList);
      setTransactions(txList);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
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

  const currentDrawerCash = activeSession
    ? activeSession.opening_cash +
      activeSession.total_cash_sales +
      activeSession.total_cash_in -
      activeSession.total_cash_out
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sesi Kasir & Manajemen Keuangan (Cash Drawer)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola shift operasional kasir, rekonsiliasi kas di laci, dan pencatatan arus kas operasional.
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

          {activeSession ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransactionModalOpen(true)}
                className="text-xs gap-1.5"
              >
                <Coins className="h-3.5 w-3.5" />
                Catat Kas Masuk/Keluar
              </Button>

              {canCloseShift && (
                <Button
                  size="sm"
                  onClick={() => setIsSessionModalOpen(true)}
                  className="text-xs gap-1.5 font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Tutup Shift Kasir
                </Button>
              )}
            </>
          ) : (
            canOpenShift && (
              <Button
                size="sm"
                onClick={() => setIsSessionModalOpen(true)}
                className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Unlock className="h-3.5 w-3.5" />
                Buka Shift Kasir Baru
              </Button>
            )
          )}
        </div>
      </div>

      {/* Active Shift Status Banner */}
      {activeSession ? (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Unlock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                  Shift Aktif
                </span>
                <span className="font-bold text-base text-foreground">
                  {activeSession.opened_by_name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Dibuka sejak {formatDate(activeSession.opened_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border/80 pt-3 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Modal Awal Kas</span>
              <span className="font-bold text-foreground text-sm">
                {formatCurrency(activeSession.opening_cash)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Penjualan Tunai</span>
              <span className="font-bold text-emerald-600 text-sm">
                +{formatCurrency(activeSession.total_cash_sales)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Kas di Laci Sekarang</span>
              <span className="font-black text-base text-primary">
                {formatCurrency(currentDrawerCash)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                Tidak Ada Shift Kasir yang Sedang Berjalan
              </h4>
              <p className="text-xs text-muted-foreground">
                Buka sesi shift baru untuk memulai transaksi penjualan dan mencatat uang modal awal.
              </p>
            </div>
          </div>

          {canOpenShift && (
            <Button
              size="sm"
              onClick={() => setIsSessionModalOpen(true)}
              className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              <Unlock className="h-3.5 w-3.5" />
              Buka Shift Sekarang
            </Button>
          )}
        </div>
      )}

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Modal Awal */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Modal Kas Awal Shift</span>
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(activeSession?.opening_cash || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Uang kembalian awal kasir</p>
        </div>

        {/* Total Cash Sales */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Penjualan Kasir Tunai</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(activeSession?.total_cash_sales || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Pembayaran tunai pesanan lunas</p>
        </div>

        {/* Cash In / Out */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pengeluaran Kasir</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {formatCurrency(activeSession?.total_cash_out || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Kas keluar operasional darurat</p>
        </div>

        {/* Current Drawer Cash */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Estimasi Kas di Laci</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(currentDrawerCash)}
          </div>
          <p className="text-[11px] text-muted-foreground">Fisik uang yang wajib ada di laci</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "sessions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat Shift Kasir ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "transactions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Coins className="h-4 w-4" />
          Arus Kas di Laci / Petty Cash ({transactions.length})
        </button>
      </div>

      {/* TAB 1: SESSIONS */}
      {activeTab === "sessions" && (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu Buka / Tutup</th>
                  <th className="py-3 px-4">Kasir Pembuka & Penutup</th>
                  <th className="py-3 px-4 text-right">Modal Awal</th>
                  <th className="py-3 px-4 text-right">Penjualan Tunai</th>
                  <th className="py-3 px-4 text-right">Ekspektasi Kas</th>
                  <th className="py-3 px-4 text-right">Kas Fisik Aktual</th>
                  <th className="py-3 px-4 text-center">Selisih</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-semibold text-sm">Belum ada riwayat shift kasir</p>
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const isClosed = s.status === "CLOSED";
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground block">
                            Buka: {formatDate(s.opened_at)}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            Tutup: {formatDate(s.closed_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block">{s.opened_by_name}</span>
                          {s.closed_by_name && (
                            <span className="text-[11px] text-muted-foreground block">
                              Ditutup: {s.closed_by_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(s.opening_cash)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          +{formatCurrency(s.total_cash_sales)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {s.expected_closing_cash !== null && s.expected_closing_cash !== undefined
                            ? formatCurrency(s.expected_closing_cash)
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {s.actual_closing_cash !== null && s.actual_closing_cash !== undefined
                            ? formatCurrency(s.actual_closing_cash)
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {isClosed ? (
                            s.discrepancy === 0 ? (
                              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-[11px]">
                                Pas (Rp 0)
                              </span>
                            ) : s.discrepancy && s.discrepancy > 0 ? (
                              <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded text-[11px]">
                                +{formatCurrency(s.discrepancy)}
                              </span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded text-[11px]">
                                {formatCurrency(s.discrepancy || 0)}
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground text-[11px] italic">Sedang Berjalan</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {s.status === "OPEN" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <Unlock className="h-2.5 w-2.5" /> DIBUKA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                              <Lock className="h-2.5 w-2.5" /> DITUTUP
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Tipe Transaksi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Keperluan / Keterangan</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Coins className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-semibold text-sm">Belum ada transaksi arus kas</p>
                      <p className="text-xs text-muted-foreground">
                        Pengeluaran operasional darurat dan penambahan kas masuk akan tercatat di sini.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {t.transaction_type === "CASH_IN" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <ArrowDownLeft className="h-3 w-3" /> Kas Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <ArrowUpRight className="h-3 w-3" /> Kas Keluar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-sm">
                        <span
                          className={
                            t.transaction_type === "CASH_IN" ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {t.transaction_type === "CASH_IN" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{t.reason}</td>
                      <td className="py-3 px-4 text-muted-foreground">{t.actor_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session Modal */}
      <CashSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSuccess={loadData}
        activeSession={activeSession}
      />

      {/* Transaction Modal */}
      {activeSession && (
        <CashTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSuccess={loadData}
          sessionId={activeSession.id}
        />
      )}
    </div>
  );
};
