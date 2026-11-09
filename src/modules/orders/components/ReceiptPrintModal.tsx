import React from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderDetail } from "@/services/orderService";

interface ReceiptPrintModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b flex items-center justify-between bg-muted/40 print:hidden">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Printer className="h-4 w-4 text-primary" />
            <span>Pratinjau Struk Kasir</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-foreground bg-white dark:bg-zinc-950 shadow-inner">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-muted-foreground/40">
            <h2 className="font-extrabold text-base tracking-wider">FOODPOS RESTO</h2>
            <p className="text-[11px] text-muted-foreground">Outlet Pusat - Jl. Sudirman No. 45</p>
            <p className="text-[11px] text-muted-foreground">Telp: 0812-3456-7890</p>
          </div>

          <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-muted-foreground/40">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Pesanan:</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waktu:</span>
              <span>{new Date(order.created_at).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Layanan:</span>
              <span className="font-semibold">{order.channel} - {order.service_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pelanggan:</span>
              <span>{order.customer_name_snapshot}</span>
            </div>
            {order.delivery_address_snapshot && (
              <div className="text-[10px] text-muted-foreground pt-1">
                Alamat: {order.delivery_address_snapshot}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="py-2.5 space-y-2 border-b border-dashed border-muted-foreground/40 text-[11px]">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span>{item.quantity}x {item.product_name_snapshot}</span>
                  <span>{formatCurrency(item.line_total)}</span>
                </div>
                {item.variant_name_snapshot && (
                  <p className="text-[10px] text-muted-foreground pl-3">
                    Varian: {item.variant_name_snapshot}
                  </p>
                )}
                {item.addons_snapshot && item.addons_snapshot.length > 0 && (
                  <p className="text-[10px] text-muted-foreground pl-3">
                    + {item.addons_snapshot.map((a) => a.name).join(", ")}
                  </p>
                )}
                {item.item_notes && (
                  <p className="text-[10px] italic text-muted-foreground pl-3">
                    Catatan: &ldquo;{item.item_notes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-muted-foreground/40">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak Resto (10%):</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos Kirim:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold pt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.grand_total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="py-2 text-[11px] space-y-0.5 border-b border-dashed border-muted-foreground/40">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pembayaran:</span>
              <span className="font-semibold">{order.payment?.payment_method || "CASH"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-bold text-emerald-600">
                {order.payment?.status || "LUNAS"}
              </span>
            </div>
            {order.payment?.reference_number && (
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Ref / TRX:</span>
                <span>{order.payment.reference_number}</span>
              </div>
            )}
          </div>

          {/* Footer message */}
          <div className="pt-4 text-center space-y-1 text-[10px] text-muted-foreground">
            <p>*** TERIMA KASIH ***</p>
            <p>Selamat Menikmati Hidangan Kami!</p>
            <p className="pt-2 text-[9px]">Sistem Kasir FOODPOS Cloud POS</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t flex items-center justify-end gap-2 bg-muted/20 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Cetak Struk
          </Button>
        </div>
      </div>
    </div>
  );
};
