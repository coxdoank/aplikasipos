import React from "react";
import { Clock, Play, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStore, type ParkedCart } from "@/stores/posStore";

interface PosParkedBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PosParkedBillsModal: React.FC<PosParkedBillsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { parkedCarts, resumeParkedCart, deleteParkedCart, items } = usePosStore();

  if (!isOpen) return null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const handleResume = (cart: ParkedCart) => {
    if (items.length > 0) {
      const confirmSwap = window.confirm(
        "Keranjang kasir aktif saat ini memiliki item. Apakah Anda ingin menahan pesanan saat ini terlebih dahulu, atau menimpanya dengan pesanan yang dipulihkan?"
      );
      if (!confirmSwap) return;
    }
    resumeParkedCart(cart.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Daftar Pesanan Ditahan (Hold Bill)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Terdapat {parkedCarts.length} transaksi kasir yang sedang diparkir sementara.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {parkedCarts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed rounded-xl p-4 text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">Tidak ada pesanan ditahan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gunakan tombol &ldquo;Tahan Pesanan (Hold)&rdquo; pada kasir saat pelanggan ingin menambah menu atau menunggu.
              </p>
            </div>
          ) : (
            parkedCarts.map((cart) => (
              <div
                key={cart.id}
                className="p-3.5 rounded-xl border bg-background hover:border-primary/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {cart.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {cart.tableNumber || "Tanpa Meja"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                      {cart.serviceType}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {cart.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                    <span>{new Date(cart.createdAt).toLocaleTimeString("id-ID")} WIB</span>
                    <span>•</span>
                    <span className="font-bold text-foreground">
                      Total: {formatCurrency(cart.subtotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteParkedCart(cart.id)}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                    title="Hapus Pesanan Parkir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleResume(cart)}
                    className="h-8 text-xs gap-1.5 font-bold"
                  >
                    <Play className="h-3.5 w-3.5" /> Lanjutkan
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-end bg-muted/10">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
