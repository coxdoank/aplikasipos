import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  RotateCw,
  Eye,
  X,
  Copy,
  Check,
  Calendar,
  Lock,
  Layers,
  DollarSign,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  auditService,
  type AuditLogItem,
  type AuditStats,
} from "@/services/auditService";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    financialActionsCount: 0,
    catalogStockActionsCount: 0,
    authSecurityActionsCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal Detail State
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        auditService.getAuditLogs({
          search: searchQuery,
          action: selectedAction,
          entity_type: selectedEntity,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        auditService.getAuditStats(),
      ]);
      setLogs(data);
      setStats(statsData);
    } catch (err) {
      console.error("Gagal memuat log audit:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction, selectedEntity, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    const csvContent = auditService.generateAuditCSV(logs);
    if (typeof window !== "undefined" && window.URL && typeof window.URL.createObjectURL === "function") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `FOODPOS_AUDIT_LOGS_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyJSON = () => {
    if (!inspectLog) return;
    navigator.clipboard.writeText(JSON.stringify(inspectLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadge = (action: string) => {
    if (action.startsWith("AUTH_")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
          {action}
        </span>
      );
    }
    if (action.startsWith("PAYMENT_") || action.startsWith("REFUND_") || action.startsWith("CASH_")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          {action}
        </span>
      );
    }
    if (action.startsWith("STOCK_") || action.startsWith("PRODUCT_")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          {action}
        </span>
      );
    }
    if (action.startsWith("SETTINGS_")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-muted text-muted-foreground border">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Log Audit & Keamanan Sistem
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Rekam jejak kepatuhan aktivitas pengguna, transaksi kasir, inventori stok, dan audit trail perubahan data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* 4 SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Aktivitas</p>
            <p className="text-xl font-bold text-foreground">{stats.totalLogs}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Aksi Finansial & Kasir</p>
            <p className="text-xl font-bold text-foreground">{stats.financialActionsCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Stok & Pengaturan</p>
            <p className="text-xl font-bold text-foreground">{stats.catalogStockActionsCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Autentikasi & Keamanan</p>
            <p className="text-xl font-bold text-foreground">{stats.authSecurityActionsCount}</p>
          </div>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aksi, nama aktor, email, atau entity ID..."
              className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1 h-7 text-xs px-2.5"
            >
              Cari
            </Button>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="AUTH_LOGIN">AUTH_LOGIN</option>
              <option value="ORDER_CREATE">ORDER_CREATE</option>
              <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
              <option value="REFUND_APPROVED">REFUND_APPROVED</option>
              <option value="CASH_SESSION_OPEN">CASH_SESSION_OPEN</option>
              <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
              <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
            </select>

            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Semua Entitas</option>
              <option value="auth">auth</option>
              <option value="orders">orders</option>
              <option value="order_payments">order_payments</option>
              <option value="cash_sessions">cash_sessions</option>
              <option value="stock_movements">stock_movements</option>
              <option value="store_settings">store_settings</option>
            </select>

            {/* Date Pickers */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 text-xs rounded border border-input bg-background"
                title="Dari tanggal"
              />
              <span>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 text-xs rounded border border-input bg-background"
                title="Sampai tanggal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Aksi Operasional</th>
                <th className="py-3 px-4">Aktor / Pengguna</th>
                <th className="py-3 px-4">Entitas & ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Rincian Metadata</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                    <p>Memuat riwayat audit trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground space-y-1">
                    <ShieldCheck className="h-8 w-8 mx-auto opacity-30 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-sm">Tidak ada log audit ditemukan</p>
                    <p className="text-xs">Coba sesuaikan kriteria filter pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const formattedDate = dateObj.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      {/* Waktu */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{formattedDate}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{formattedTime}</div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Aktor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{log.actor_name || "Staf"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                          {log.actor_email || "-"}
                        </div>
                      </td>

                      {/* Entitas */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="font-semibold text-foreground">{log.entity_type}</span>
                        {log.entity_id && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {log.entity_id}
                          </div>
                        )}
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {log.ip_address || "127.0.0.1"}
                      </td>

                      {/* Detail Preview */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="truncate text-muted-foreground font-mono text-[11px]">
                          {JSON.stringify(log.details)}
                        </p>
                      </td>

                      {/* Tombol Inspeksi */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectLog(log)}
                          className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspeksi
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INSPEKSI METADATA JSON */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Inspeksi Log Audit: {inspectLog.action}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    ID: {inspectLog.id} • {inspectLog.created_at}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Tutup inspeksi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body Info */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/20 border border-border text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Aktor</p>
                  <p className="font-bold text-foreground">{inspectLog.actor_name || "Staf"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Email</p>
                  <p className="font-mono text-[11px] text-foreground truncate">{inspectLog.actor_email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Entitas</p>
                  <p className="font-mono font-bold text-foreground">{inspectLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Alamat IP</p>
                  <p className="font-mono text-foreground">{inspectLog.ip_address || "127.0.0.1"}</p>
                </div>
              </div>

              {/* JSON Payload Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Payload Metadata (Rincian Aksi):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJSON}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Salin JSON
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-zinc-800">
                  {JSON.stringify(inspectLog.details, null, 2)}
                </pre>
              </div>

              {/* Security Shield Note */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Keamanan Privasi:</strong> Seluruh kata sandi, token otorisasi, dan rahasia sistem disanitasi secara otomatis sebelum dicatat.
                </span>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
              <Button size="sm" onClick={() => setInspectLog(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
