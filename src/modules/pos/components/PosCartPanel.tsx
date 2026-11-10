import React, { useState } from "react";
import {
  Trash2,
  Plus,
  Minus,
  User,
  Clock,
  Percent,
  CreditCard,
  Edit2,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/stores/posStore";

interface PosCartPanelProps {
  onOpenCustomerModal: () => void;
  onOpenParkedBills: () => void;
  onOpenPaymentModal: () => void;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  onOpenCustomerModal,
  onOpenParkedBills,
  onOpenPaymentModal,
}) => {
  const {
    items,
    customerName,
    tableNumber,
    serviceType,
    discountType,
    discountValue,
    parkedCarts,
    updateQuantity,
    removeItem,
    clearCart,
    setServiceType,
    setDiscount,
    holdCurrentCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getGrandTotal,
    getTotalItemsCount,
  } = usePosStore();

  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);
  const [customDiscountText, setCustomDiscountText] = useState<string>("");

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount();
  const grandTotal = getGrandTotal();
  const totalItemsCount = getTotalItemsCount();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const handleHoldCart = () => {
    if (items.length === 0) return;
    const success = holdCurrentCart();
    if (success) {
      alert("Pesanan kasir berhasil ditahan (parkir). Anda dapat memuatnya kembali melalui tombol 'Pesanan Ditahan'.");
    }
  };

  const handleApplyCustomDiscount = () => {
    const val = Number(customDiscountText.replace(/\D/g, "")) || 0;
    setDiscount("FIXED", val);
    setShowDiscountInput(false);
  };

  return (
    <div className="w-full lg:w-96 flex flex-col border rounded-2xl bg-card shadow-sm overflow-hidden h-full">
      {/* Top Header: Customer Info & Clear Cart */}
      <div className="p-3.5 border-b bg-muted/20 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpenCustomerModal}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
            title="Ubah info pelanggan dan meja"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-foreground line-clamp-1">
                  {customerName || "Tamu Kasir"}
                </span>
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {serviceType === "DINE_IN" ? tableNumber : serviceType}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {parkedCarts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenParkedBills}
                className="h-8 text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2"
                title="Buka daftar pesanan ditahan"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{parkedCarts.length} Ditahan</span>
              </Button>
            )}

            {items.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Kosongkan keranjang pesanan kasir ini?")) {
                    clearCart();
                  }
                }}
                className="h-8 w-8 rounded-lg border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center"
                title="Kosongkan Keranjang"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Service Type Switcher */}
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl border bg-muted/30 text-[11px] font-bold">
          {(["DINE_IN", "TAKEAWAY", "DELIVERY", "PICKUP"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setServiceType(type)}
              className={`py-1 rounded-lg transition-all ${
                serviceType === type
                  ? "bg-card text-foreground shadow-sm font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "DINE_IN"
                ? "Dine-in"
                : type === "TAKEAWAY"
                ? "Takeaway"
                : type === "DELIVERY"
                ? "Delivery"
                : "Pickup"}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Bookmark className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="font-semibold text-xs text-foreground">Keranjang Kasir Kosong</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Klik menu hidangan di sebelah kiri untuk menambahkan pesanan pelanggan.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.posItemId}
              className="p-2.5 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <h5 className="font-bold text-foreground leading-snug">
                    {item.name}
                  </h5>
                  {item.variant && (
                    <span className="text-[10px] text-primary font-semibold block">
                      Varian: {item.variant.name}
                    </span>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <span className="text-[10px] text-muted-foreground block">
                      + {item.addons.map((a) => a.name).join(", ")}
                    </span>
                  )}
                  {item.itemNotes && (
                    <span className="text-[10px] italic text-amber-600 block">
                      Catatan: &ldquo;{item.itemNotes}&rdquo;
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-foreground block">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    @{formatCurrency(item.unitPrice)}
                  </span>
                </div>
              </div>

              {/* Stepper & Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-muted/40">
                <button
                  onClick={() => removeItem(item.posItemId)}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Hapus
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.posItemId, -1)}
                    className="h-6 w-6 rounded-lg border bg-background flex items-center justify-center hover:bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.posItemId, 1)}
                    className="h-6 w-6 rounded-lg border bg-background flex items-center justify-center hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Actions Bottom Panel */}
      <div className="p-3.5 border-t bg-muted/20 space-y-3">
        {/* Discount Buttons */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3 text-primary" /> Diskon Pesanan:
            </span>
            {discountAmount > 0 && (
              <span className="text-emerald-600 font-bold">
                -{formatCurrency(discountAmount)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => setDiscount("PERCENTAGE", pct)}
                className={`py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  discountType === "PERCENTAGE" && discountValue === pct
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {pct === 0 ? "0%" : `${pct}%`}
              </button>
            ))}
          </div>

          {showDiscountInput ? (
            <div className="flex gap-1 pt-1">
              <input
                type="number"
                value={customDiscountText}
                onChange={(e) => setCustomDiscountText(e.target.value)}
                placeholder="Nominal Rp diskon..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border bg-background"
              />
              <Button size="sm" onClick={handleApplyCustomDiscount} className="h-7 text-xs px-2">
                Terapkan
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowDiscountInput(true)}
              className="text-[10px] text-primary hover:underline block pt-0.5"
            >
              + Masukkan Diskon Nominal Tetap (Rp)
            </button>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-1 text-xs border-t pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal ({totalItemsCount} item):</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Diskon:</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Pajak Restoran PB1 (10%):</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-foreground pt-1.5 border-t">
            <span>Total Tagihan:</span>
            <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleHoldCart}
            disabled={items.length === 0}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            title="Tahan transaksi untuk melayani pelanggan lain"
          >
            Tahan
          </Button>

          <Button
            size="sm"
            onClick={onOpenPaymentModal}
            disabled={items.length === 0}
            className="col-span-2 text-xs font-bold gap-1.5 shadow-md"
          >
            <CreditCard className="h-4 w-4" /> Bayar ({formatCurrency(grandTotal)})
          </Button>
        </div>
      </div>
    </div>
  );
};
