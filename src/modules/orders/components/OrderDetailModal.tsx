import React, { useState } from "react";
import {
  X,
  Phone,
  MapPin,
  Clock,
  Printer,
  Ban,
  CheckCircle2,
  ChefHat,
  BellRing,
  Check,
  CreditCard,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderDetail, OrderStatus } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";
import { ReceiptPrintModal } from "./ReceiptPrintModal";
import { CancelOrderDialog } from "./CancelOrderDialog";

interface OrderDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onCancelOrder: (orderId: string, reason: string) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onCancelOrder,
}) => {
  const { hasPermission } = useAuthStore();
  const canUpdateStatus = hasPermission("orders.update_status");

  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const handleNextStatus = async () => {
    let next: OrderStatus | null = null;
    if (order.order_status === "NEW") next = "PROCESSING";
    else if (order.order_status === "PROCESSING") next = "READY";
    else if (order.order_status === "READY") next = "COMPLETED";

    if (!next) return;

    try {
      setIsUpdating(true);
      await onStatusChange(order.id, next);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "NEW":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">BARU (NEW)</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">SEDANG DIMASAK</span>;
      case "READY":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">SIAP SAJI / KIRIM</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border">SELESAI</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">DIBATALKAN</span>;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-3xl bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-foreground">
                  {order.order_number}
                </h2>
                {getStatusBadge(order.order_status)}
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground">
                  {order.channel}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                  {order.service_type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Dibuat: {new Date(order.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Tutup Detail Pesanan"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Customer & Delivery Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/10 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Informasi Pelanggan
                </p>
                <p className="font-bold text-sm text-foreground">{order.customer_name_snapshot}</p>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <a
                    href={`https://wa.me/${order.customer_phone_snapshot.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary font-medium"
                  >
                    {order.customer_phone_snapshot} (WhatsApp)
                  </a>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Detail Layanan & Catatan
                </p>
                {order.delivery_address_snapshot ? (
                  <div className="flex items-start gap-1.5 text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span>{order.delivery_address_snapshot}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Layanan Tanpa Pengiriman (Dine-in / Takeaway / Pickup)</p>
                )}
                {order.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg border">
                    <span className="font-semibold">Catatan:</span> &ldquo;{order.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Daftar Menu Pesanan ({order.items.length} Menu)
              </h3>
              <div className="border rounded-xl overflow-hidden divide-y text-xs">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {item.quantity}x {item.product_name_snapshot}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {item.sku_snapshot}
                        </span>
                      </div>
                      {item.variant_name_snapshot && (
                        <p className="text-xs text-muted-foreground">
                          Varian: <strong className="text-foreground">{item.variant_name_snapshot}</strong>
                        </p>
                      )}
                      {item.addons_snapshot && item.addons_snapshot.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Topping/Addon: {item.addons_snapshot.map((a) => `${a.name} (+${formatCurrency(a.price)})`).join(", ")}
                        </p>
                      )}
                      {item.item_notes && (
                        <p className="text-[11px] italic text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded inline-block">
                          Catatan item: &ldquo;{item.item_notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="text-right sm:shrink-0">
                      <p className="font-bold text-sm text-foreground">{formatCurrency(item.line_total)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        @{formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Info */}
              <div className="p-4 rounded-xl border bg-card space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Informasi Pembayaran</span>
                </div>
                <div className="space-y-1 text-muted-foreground pt-1">
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <strong className="text-foreground">{order.payment?.payment_method || "CASH"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {order.payment?.status || "LUNAS"}
                    </span>
                  </div>
                  {order.payment?.reference_number && (
                    <div className="flex justify-between">
                      <span>No. Referensi:</span>
                      <span className="font-mono text-foreground">{order.payment.reference_number}</span>
                    </div>
                  )}
                  {order.payment?.cash_received != null && (
                    <>
                      <div className="flex justify-between">
                        <span>Tunai Diterima:</span>
                        <span>{formatCurrency(order.payment.cash_received)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kembalian:</span>
                        <span>{formatCurrency(order.payment.change_amount || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Menu:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pajak Restoran PB1 (10%):</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ongkos Kirim:</span>
                    <span>{formatCurrency(order.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-foreground pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-primary">{formatCurrency(order.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <History className="h-3.5 w-3.5" />
                <span>Riwayat Perjalanan Pesanan</span>
              </div>
              <div className="border rounded-xl p-4 bg-card divide-y text-xs">
                {order.history && order.history.length > 0 ? (
                  order.history.map((h, i) => (
                    <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            {h.new_status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(h.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>
                        {h.actor_name && (
                          <p className="text-[11px] text-muted-foreground">
                            Oleh: <span className="font-medium text-foreground">{h.actor_name}</span>
                          </p>
                        )}
                        {h.reason && (
                          <p className="text-[11px] text-muted-foreground italic">
                            &ldquo;{h.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Belum ada riwayat tercatat.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReceiptOpen(true)}
                className="gap-1.5 text-xs flex-1 sm:flex-initial"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Struk
              </Button>

              {order.order_status !== "COMPLETED" && order.order_status !== "CANCELLED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 flex-1 sm:flex-initial"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Batalkan Pesanan
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Tutup
              </Button>

              {canUpdateStatus && order.order_status === "NEW" && (
                <Button
                  size="sm"
                  onClick={handleNextStatus}
                  disabled={isUpdating}
                  className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  {isUpdating ? "Memproses..." : "Terima & Mulai Masak"}
                </Button>
              )}

              {canUpdateStatus && order.order_status === "PROCESSING" && (
                <Button
                  size="sm"
                  onClick={handleNextStatus}
                  disabled={isUpdating}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  {isUpdating ? "Memproses..." : "Tandai Siap Saji / Kirim"}
                </Button>
              )}

              {canUpdateStatus && order.order_status === "READY" && (
                <Button
                  size="sm"
                  onClick={handleNextStatus}
                  disabled={isUpdating}
                  className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isUpdating ? "Memproses..." : "Selesaikan Pesanan"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <ReceiptPrintModal
        order={order}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <CancelOrderDialog
        order={order}
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirmCancel={onCancelOrder}
      />
    </>
  );
};
