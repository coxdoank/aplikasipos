import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Volume2,
  VolumeX,
  LayoutGrid,
  List,
  RefreshCw,
  Clock,
  Eye,
  ChefHat,
  BellRing,
  CheckCircle2,
  Ban,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  orderService,
  type OrderDetail,
  type OrderStatus,
  type OrderChannel,
  type ServiceType,
  type OrderSummaryStats,
} from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";
import { OrderKanban } from "../components/OrderKanban";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { CancelOrderDialog } from "../components/CancelOrderDialog";

export const OrdersPage: React.FC = () => {
  const { user, profile, hasPermission } = useAuthStore();
  const canUpdateStatus = hasPermission("orders.update_status");

  // State
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "ALL">("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Summary
  const [summary, setSummary] = useState<OrderSummaryStats>({
    total: 0,
    newCount: 0,
    processingCount: 0,
    readyCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
  });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<OrderDetail | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);

  // Load orders
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await orderService.getOrders({
        search: searchQuery,
        status: statusFilter,
        channel: channelFilter,
        serviceType: serviceTypeFilter,
        sortBy,
      });
      setOrders(fetched);

      const stats = await orderService.getOrdersSummary();
      setSummary(stats);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, channelFilter, serviceTypeFilter, sortBy]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Periodic Polling for new orders
  useEffect(() => {
    const interval = setInterval(async () => {
      const stats = await orderService.getOrdersSummary();
      if (stats.newCount > summary.newCount && summary.newCount !== 0) {
        if (soundEnabled) {
          orderService.playKitchenChime();
        }
        setNotificationToast("🔔 Pesanan baru masuk! Periksa antrean pesanan.");
        setTimeout(() => setNotificationToast(null), 5000);
        loadOrders();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [summary.newCount, soundEnabled, loadOrders]);

  // Status transitions
  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    const actorName = profile?.fullName || user?.email || "Staf Operasional";
    const res = await orderService.updateOrderStatus(orderId, nextStatus, {
      id: user?.id,
      name: actorName,
    });

    if (res.success) {
      if (soundEnabled && (nextStatus === "PROCESSING" || nextStatus === "READY")) {
        orderService.playKitchenChime();
      }
      setNotificationToast(res.message);
      setTimeout(() => setNotificationToast(null), 4000);
      await loadOrders();

      if (selectedOrder && selectedOrder.id === orderId && res.order) {
        setSelectedOrder(res.order);
      }
    } else {
      alert(res.message);
    }
  };

  // Cancellation handler
  const handleConfirmCancel = async (orderId: string, reason: string) => {
    const actorName = profile?.fullName || user?.email || "Staf Operasional";
    const res = await orderService.cancelOrder(orderId, reason, {
      id: user?.id,
      name: actorName,
    });

    if (res.success) {
      setNotificationToast(res.message);
      setTimeout(() => setNotificationToast(null), 4000);
      await loadOrders();

      if (selectedOrder && selectedOrder.id === orderId && res.order) {
        setSelectedOrder(res.order);
      }
    } else {
      alert(res.message);
    }
  };

  const handleOpenDetail = (order: OrderDetail) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleOpenCancelDialog = (order: OrderDetail) => {
    setCancelTargetOrder(order);
    setIsCancelOpen(true);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {notificationToast && (
        <div className="p-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <span>{notificationToast}</span>
          <button
            onClick={() => setNotificationToast(null)}
            className="text-xs underline ml-3 opacity-90 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            Manajemen Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola alur dapur, status pesanan kasir, dan pemesanan online secara realtime.
          </p>
        </div>

        {/* View mode & sound controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`gap-1.5 text-xs ${
              soundEnabled ? "text-primary border-primary/30" : "text-muted-foreground"
            }`}
            title={soundEnabled ? "Notifikasi Suara Aktif" : "Notifikasi Suara Senyap"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Suara Aktif" : "Senyap"}</span>
          </Button>

          <div className="border rounded-lg p-0.5 flex bg-muted/40">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            className="gap-1.5 text-xs"
            title="Muat Ulang Pesanan"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === "ALL" ? "border-primary bg-primary/5 shadow-sm" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] text-muted-foreground font-medium">Semua Pesanan</p>
          <p className="text-xl font-bold mt-1 text-foreground">{summary.total}</p>
        </button>

        <button
          onClick={() => setStatusFilter("NEW")}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === "NEW" ? "border-blue-500 bg-blue-500/10 shadow-sm" : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-blue-600 font-medium">Pesanan Baru</p>
            {summary.newCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            )}
          </div>
          <p className="text-xl font-bold mt-1 text-blue-600">{summary.newCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter("PROCESSING")}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === "PROCESSING" ? "border-amber-500 bg-amber-500/10 shadow-sm" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] text-amber-600 font-medium">Sedang Dimasak</p>
          <p className="text-xl font-bold mt-1 text-amber-600">{summary.processingCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter("READY")}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === "READY" ? "border-emerald-500 bg-emerald-500/10 shadow-sm" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] text-emerald-600 font-medium">Siap Saji / Kirim</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">{summary.readyCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter("COMPLETED")}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === "COMPLETED" ? "border-muted-foreground bg-muted shadow-sm" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] text-muted-foreground font-medium">Selesai</p>
          <p className="text-xl font-bold mt-1 text-muted-foreground">{summary.completedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter("CANCELLED")}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === "CANCELLED" ? "border-destructive bg-destructive/10 shadow-sm" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] text-destructive font-medium">Dibatalkan</p>
          <p className="text-xl font-bold mt-1 text-destructive">{summary.cancelledCount}</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID pesanan, nama pelanggan, atau nomor telepon..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as OrderChannel | "ALL")}
            className="text-xs px-2.5 py-2 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Semua Saluran</option>
            <option value="ONLINE">Online Web</option>
            <option value="POS">POS Kasir</option>
          </select>

          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value as ServiceType | "ALL")}
            className="text-xs px-2.5 py-2 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Semua Layanan</option>
            <option value="DINE_IN">Dine-in (Makan di Tempat)</option>
            <option value="TAKEAWAY">Takeaway (Bawa Pulang)</option>
            <option value="DELIVERY">Delivery (Pengiriman)</option>
            <option value="PICKUP">Pickup (Ambil Sendiri)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="text-xs px-2.5 py-2 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="newest">Waktu: Terbaru</option>
            <option value="oldest">Waktu: Terlama</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" ? (
        <OrderKanban
          orders={orders}
          onSelectOrder={handleOpenDetail}
          onStatusChange={handleStatusChange}
          onCancelClick={handleOpenCancelDialog}
        />
      ) : (
        /* Table View */
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">ID Pesanan</th>
                  <th className="p-3.5">Pelanggan</th>
                  <th className="p-3.5">Saluran & Layanan</th>
                  <th className="p-3.5">Menu Dipesan</th>
                  <th className="p-3.5">Total Tagihan</th>
                  <th className="p-3.5">Pembayaran</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Tidak ada pesanan yang sesuai dengan kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-foreground block">
                          {ord.order_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(ord.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-foreground block">
                          {ord.customer_name_snapshot}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {ord.customer_phone_snapshot}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                            {ord.channel}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            {ord.service_type}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[200px]">
                        <p className="text-[11px] text-foreground truncate">
                          {ord.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(", ")}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {ord.items.length} jenis hidangan
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-foreground">
                        {formatCurrency(ord.grand_total)}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          ord.payment?.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : ord.payment?.status === "REFUNDED"
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {ord.payment?.status || "LUNAS"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {ord.payment?.payment_method || "CASH"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          ord.order_status === "COMPLETED"
                            ? "bg-muted text-muted-foreground"
                            : ord.order_status === "READY"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : ord.order_status === "PROCESSING"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : ord.order_status === "NEW"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}>
                          {ord.order_status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(ord)}
                            className="h-7 text-xs px-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {canUpdateStatus && ord.order_status === "NEW" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(ord.id, "PROCESSING")}
                              className="h-7 text-[11px] px-2 bg-amber-600 hover:bg-amber-700 text-white"
                              title="Mulai Masak"
                            >
                              <ChefHat className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {canUpdateStatus && ord.order_status === "PROCESSING" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(ord.id, "READY")}
                              className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Tandai Siap"
                            >
                              <BellRing className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {canUpdateStatus && ord.order_status === "READY" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(ord.id, "COMPLETED")}
                              className="h-7 text-[11px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                              title="Selesaikan"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {ord.order_status !== "COMPLETED" && ord.order_status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenCancelDialog(ord)}
                              className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Batalkan Pesanan"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
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
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
        onCancelOrder={handleConfirmCancel}
      />

      {/* Cancel Confirmation Dialog */}
      <CancelOrderDialog
        order={cancelTargetOrder}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
};
