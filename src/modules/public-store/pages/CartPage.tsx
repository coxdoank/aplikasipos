import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();

  const subtotal = getSubtotal();
  const estimatedTax = Math.round(subtotal * 0.1); // 10% PB1 Resto Tax
  const estimatedTotal = subtotal + estimatedTax;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-16 max-w-2xl text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Keranjang Anda Masih Kosong</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Belum ada menu lezat yang Anda pilih. Silakan jelajahi katalog kuliner kami dan pilih hidangan favorit Anda.
          </p>
        </div>
        <Link to="/menu">
          <Button size="lg" className="gap-2 font-bold shadow-md">
            Jelajahi Menu Sekarang <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keranjang Belanja Pesanan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Periksa kembali rincian porsi, varian, dan catatan sebelum checkout.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm("Apakah Anda yakin ingin mengosongkan seluruh isi keranjang?")) {
              clearCart();
            }
          }}
          className="text-xs text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Kosongkan Keranjang
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="p-4 border rounded-2xl bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-base text-foreground">{item.name}</h3>
                
                {/* Variant Info */}
                {item.variant && (
                  <p className="text-xs text-primary font-semibold">
                    Varian: {item.variant.name}
                    {item.variant.priceAdjustment > 0 && ` (+${formatRupiah(item.variant.priceAdjustment)})`}
                  </p>
                )}

                {/* Addons Info */}
                {item.addons && item.addons.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                    <span>Topping:</span>
                    {item.addons.map((a) => (
                      <span key={a.id} className="bg-muted px-1.5 py-0.5 rounded font-medium">
                        {a.name} (+{formatRupiah(a.price)})
                      </span>
                    ))}
                  </div>
                )}

                {/* Item Notes */}
                {item.itemNotes && (
                  <p className="text-xs text-muted-foreground italic bg-muted/30 p-1.5 rounded">
                    Catatan: &ldquo;{item.itemNotes}&rdquo;
                  </p>
                )}

                <div className="text-xs font-semibold text-muted-foreground pt-1">
                  Harga Satuan: {formatRupiah(item.unitPrice)}
                </div>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-0">
                <span className="font-extrabold text-base text-foreground">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-lg bg-background p-0.5">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-muted"
                    title="Hapus menu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Link to="/menu" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2">
            <ArrowLeft className="h-4 w-4" /> Tambah Menu Lainnya
          </Link>
        </div>

        {/* Right: Order Summary Card */}
        <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-6 h-fit">
          <h2 className="font-bold text-lg border-b pb-3">Ringkasan Tagihan</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item):</span>
              <span className="font-semibold text-foreground">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Pajak Restoran (PB1 10%):</span>
              <span className="font-semibold text-foreground">{formatRupiah(estimatedTax)}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Pengantaran:</span>
              <span className="text-xs text-primary font-medium">Dihitung saat checkout</span>
            </div>

            <div className="border-t pt-3 flex justify-between items-baseline font-black text-lg">
              <span>Estimasi Total:</span>
              <span className="text-primary text-xl">{formatRupiah(estimatedTotal)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Transaksi Aman
            </div>
            <p>Harga dan perhitungan total tagihan divalidasi secara otoritatif oleh sistem server kami.</p>
          </div>

          <Link to="/checkout" className="block w-full">
            <Button size="lg" className="w-full gap-2 font-bold shadow-md">
              Lanjut ke Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
