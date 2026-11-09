import React, { useState } from "react";
import {
  Clock,
  ChefHat,
  BellRing,
  CheckCircle2,
  Ban,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderDetail, OrderStatus } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

interface OrderKanbanProps {
  orders: OrderDetail[];
  onSelectOrder: (order: OrderDetail) => void;
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onCancelClick: (order: OrderDetail) => void;
}

interface KanbanColumn {
  id: OrderStatus;
  title: string;
  subtitle: string;
  accentClass: string;
  badgeBg: string;
  badgeText: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "NEW",
    title: "Pesanan Baru",
    subtitle: "Menunggu konfirmasi & proses",
    accentClass: "border-blue-500/40 bg-blue-500/5",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
  },
  {
    id: "PROCESSING",
    title: "Sedang Dimasak",
    subtitle: "Dapur menyiapkan hidangan",
    accentClass: "border-amber-500/40 bg-amber-500/5",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600",
  },
  {
    id: "READY",
    title: "Siap Saji / Kirim",
    subtitle: "Makanan siap disajikan / dijemput",
    accentClass: "border-emerald-500/40 bg-emerald-500/5",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
  },
  {
    id: "COMPLETED",
    title: "Selesai",
    subtitle: "Transaksi selesai & lunas",
    accentClass: "border-muted bg-muted/20",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
  },
];

export const OrderKanban: React.FC<OrderKanbanProps> = ({
  orders,
  onSelectOrder,
  onStatusChange,
  onCancelClick,
}) => {
  const { hasPermission } = useAuthStore();
  const canUpdateStatus = hasPermission("orders.update_status");

  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<OrderStatus | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const getElapsedTime = (isoString: string) => {
    const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} mnt lalu`;
    const hours = Math.floor(minutes / 60);
    return `${hours} jam lalu`;
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("text/plain", orderId);
    setDraggedOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: OrderStatus) => {
    e.preventDefault();
    if (activeDropColumn !== colStatus) {
      setActiveDropColumn(colStatus);
    }
  };

  const handleDragLeave = () => {
    setActiveDropColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const orderId = e.dataTransfer.getData("text/plain") || draggedOrderId;
    setDraggedOrderId(null);

    if (!orderId || !canUpdateStatus) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.order_status === targetStatus) return;

    // Validate state machine
    let isValid = false;
    if (order.order_status === "NEW" && targetStatus === "PROCESSING") isValid = true;
    else if (order.order_status === "PROCESSING" && targetStatus === "READY") isValid = true;
    else if (order.order_status === "READY" && targetStatus === "COMPLETED") isValid = true;

    if (isValid) {
      await onStatusChange(order.id, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {KANBAN_COLUMNS.map((col) => {
        const columnOrders = orders.filter((o) => o.order_status === col.id);
        const isDropTarget = activeDropColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border transition-all duration-200 bg-card ${
              isDropTarget ? "ring-2 ring-primary border-primary shadow-lg scale-[1.01]" : ""
            }`}
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between ${col.accentClass}`}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">{col.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg} ${col.badgeText}`}>
                    {columnOrders.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{col.subtitle}</p>
              </div>
            </div>

            {/* Column Cards */}
            <div className="p-3 space-y-3 min-h-[450px] max-h-[75vh] overflow-y-auto">
              {columnOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl text-muted-foreground">
                  <p className="text-xs">Tidak ada pesanan</p>
                  <p className="text-[10px] mt-1 text-muted-foreground/70">
                    {col.id === "NEW" ? "Menunggu pesanan baru masuk" : "Belum ada item di tahapan ini"}
                  </p>
                </div>
              ) : (
                columnOrders.map((order) => {
                  const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60));
                  const isUrgent = order.order_status !== "COMPLETED" && minutesAgo > 20;

                  return (
                    <div
                      key={order.id}
                      draggable={order.order_status !== "COMPLETED"}
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className={`group p-3.5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                        isUrgent ? "border-amber-500/50 bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {order.order_number}
                          </span>
                          <p className="font-semibold text-xs text-foreground">{order.customer_name_snapshot}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                            {order.channel}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            {order.service_type}
                          </span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="text-[11px] text-muted-foreground line-clamp-2 bg-muted/20 p-2 rounded-lg border">
                        {order.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(", ")}
                      </div>

                      {order.notes && (
                        <p className="text-[10px] italic text-muted-foreground truncate">
                          &ldquo;{order.notes}&rdquo;
                        </p>
                      )}

                      {/* Time & Total */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className={isUrgent ? "text-amber-600 font-bold" : ""}>
                            {getElapsedTime(order.created_at)}
                          </span>
                        </div>
                        <span className="font-bold text-foreground">
                          {formatCurrency(order.grand_total)}
                        </span>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectOrder(order)}
                          className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-3 w-3" /> Detail
                        </Button>

                        <div className="flex items-center gap-1">
                          {canUpdateStatus && order.order_status === "NEW" && (
                            <Button
                              size="sm"
                              onClick={() => onStatusChange(order.id, "PROCESSING")}
                              className="h-7 text-[11px] gap-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <ChefHat className="h-3 w-3" /> Masak
                            </Button>
                          )}

                          {canUpdateStatus && order.order_status === "PROCESSING" && (
                            <Button
                              size="sm"
                              onClick={() => onStatusChange(order.id, "READY")}
                              className="h-7 text-[11px] gap-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <BellRing className="h-3 w-3" /> Siap
                            </Button>
                          )}

                          {canUpdateStatus && order.order_status === "READY" && (
                            <Button
                              size="sm"
                              onClick={() => onStatusChange(order.id, "COMPLETED")}
                              className="h-7 text-[11px] gap-1 px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Selesai
                            </Button>
                          )}

                          {order.order_status !== "COMPLETED" && (
                            <button
                              onClick={() => onCancelClick(order)}
                              title="Batalkan Pesanan"
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
