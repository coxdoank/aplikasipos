import React, { useState } from "react";
import { CheckCircle2, Printer, PlusCircle, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderDetail } from "@/services/orderService";
import { ReceiptPrintModal } from "@/modules/orders/components/ReceiptPrintModal";
import { useNavigate } from "react-router-dom";

interface PosSuccessModalProps {
  order: OrderDetail | null;
  cashReceived?: number;
  changeAmount?: number;
  isOpen: boolean;
  onNewOrder: () => void;
}

export const PosSuccessModal: React.FC<PosSuccessModalProps> = ({
  order,
  cashReceived = 0,
  changeAmount = 0,
  isOpen,
  onNewOrder,
}) => {
  const navigate = useNavigate();
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-card border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center p-6 sm:p-7 space-y-5">
          {/* Success Icon */}
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center animate-in zoom-in-75">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Transaksi Kasir Berhasil!
            </h3>
            <p className="text-xs text-muted-foreground">
              Pesanan telah masuk ke sistem dapur dan status pembayaran dinyatakan lunas.
            </p>
          </div>

          {/* Transaction Summary Card */}
          <div className="p-4 rounded-2xl bg-muted/20 border space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Nomor Order:</span>
              <span className="font-mono font-bold text-foreground">{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Pelanggan:</span>
              <span className="font-semibold text-foreground">{order.customer_name_snapshot}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Total Tagihan:</span>
              <span className="font-bold text-sm text-foreground">{formatCurrency(order.grand_total)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Metode Pembayaran:</span>
              <span className="font-bold text-primary">{order.payment?.payment_method || "CASH"}</span>
            </div>

            {order.payment?.payment_method === "CASH" && (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Tunai Diterima:</span>
                  <span className="font-medium text-foreground">{formatCurrency(cashReceived)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t font-bold text-sm bg-emerald-500/10 -mx-4 -mb-2 px-4 rounded-b-xl text-emerald-700 dark:text-emerald-400">
                  <span>Uang Kembalian:</span>
                  <span className="text-base">{formatCurrency(changeAmount)}</span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => setIsReceiptOpen(true)}
              className="w-full gap-2 font-bold shadow-sm"
            >
              <Printer className="h-4 w-4" /> Cetak Struk Kasir
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={onNewOrder}
                className="gap-1.5 text-xs font-semibold"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Pesanan Baru
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onNewOrder();
                  navigate("/backoffice/orders");
                }}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Utensils className="h-3.5 w-3.5" /> Antrean Dapur
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptPrintModal
        order={order}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </>
  );
};
