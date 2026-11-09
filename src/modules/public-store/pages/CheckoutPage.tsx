import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  Store,
  Utensils,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { storeService } from "@/services/storeService";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceType, setServiceType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP">("TAKEAWAY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD">("QRIS");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = getSubtotal();
  const deliveryFee = serviceType === "DELIVERY" ? 10000 : 0;
  const taxAmount = Math.round(subtotal * 0.1); // 10% PB1
  const grandTotal = subtotal + taxAmount + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-16 max-w-lg text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Keranjang Anda Kosong</h2>
        <p className="text-xs text-muted-foreground">
          Silakan tambahkan menu sebelum melanjutkan ke tahap pembayaran.
        </p>
        <Link to="/menu">
          <Button size="sm">Buka Katalog Menu</Button>
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!customerName.trim()) {
      setErrorMessage("Silakan masukkan nama lengkap Anda.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 8) {
      setErrorMessage("Silakan masukkan nomor WhatsApp yang valid untuk konfirmasi pesanan.");
      return;
    }

    if (serviceType === "DELIVERY" && !deliveryAddress.trim()) {
      setErrorMessage("Alamat pengantaran wajib diisi untuk layanan Delivery.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await storeService.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceType,
        deliveryAddress: serviceType === "DELIVERY" ? deliveryAddress.trim() : undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        items,
      });

      if (result.success) {
        clearCart();
        navigate("/order-confirmation", {
          state: {
            orderData: result,
          },
        });
      } else {
        setErrorMessage("Gagal membuat pesanan. Silakan coba kembali.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat memproses pesanan.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Link to="/cart">
          <Button variant="ghost" size="icon" aria-label="Kembali ke keranjang">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checkout Pesanan</h1>
          <p className="text-xs text-muted-foreground">
            Lengkapi data pemesan dan pilih metode pembayaran resmi.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Contact */}
          <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
              Informasi Pemesan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Service Type & Address */}
          <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              Opsi Layanan Pengambilan
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: "TAKEAWAY", label: "Takeaway", sub: "Bungkus Bawa Pulang", icon: ShoppingBag },
                { type: "DINE_IN", label: "Dine-in", sub: "Makan di Resto", icon: Utensils },
                { type: "DELIVERY", label: "Delivery", sub: "Antar ke Rumah (+Rp10rb)", icon: Truck },
                { type: "PICKUP", label: "Pickup", sub: "Ambil Sendiri", icon: Store },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = serviceType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setServiceType(opt.type as "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-muted-foreground/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <span className="text-xs font-bold block">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight block">{opt.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {serviceType === "DELIVERY" && (
              <div className="space-y-1.5 pt-2 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-foreground">Alamat Lengkap Pengantaran *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Sebutkan nama jalan, nomor rumah, patokan, RT/RW, dan kelurahan..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Section 3: Payment Method */}
          <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
              Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { method: "QRIS", name: "QRIS Static", desc: "BCA / GoPay / OVO / Dana / Mandiri", icon: QrCode },
                { method: "BANK_TRANSFER", name: "Transfer Bank BCA", desc: "BCA 8820192831 a/n PT Kuliner Makmur POS", icon: Building },
                { method: "CASH", name: "Bayar Tunai", desc: "Bayar di kasir / saat pesanan diserahkan", icon: Banknote },
                { method: "DEBIT_CARD", name: "Kartu Debit / EDC", desc: "Gesek kartu di kasir outlet", icon: CreditCard },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = paymentMethod === p.method;
                return (
                  <button
                    key={p.method}
                    type="button"
                    onClick={() => setPaymentMethod(p.method as "CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD")}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-muted-foreground/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground leading-tight block">{p.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: General Order Notes */}
          <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-2">
            <label className="text-xs font-bold text-foreground">Catatan Tambahan untuk Keseluruhan Pesanan</label>
            <textarea
              rows={2}
              placeholder="Contoh: tolong berikan sendok dan garpu plastik tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation Button */}
        <div className="space-y-6">
          <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-6 sticky top-24">
            <h2 className="font-bold text-lg border-b pb-3">Ringkasan Checkout</h2>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.cartItemId} className="flex justify-between text-xs py-1 border-b border-muted">
                  <div className="flex-1 pr-2">
                    <span className="font-semibold block">{i.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {i.quantity}x @ {formatRupiah(i.unitPrice)}
                      {i.variant && ` (${i.variant.name})`}
                    </span>
                  </div>
                  <span className="font-bold">{formatRupiah(i.unitPrice * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs border-t pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-medium text-foreground">{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Pajak Restoran (PB1 10%):</span>
                <span className="font-medium text-foreground">{formatRupiah(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Ongkos Kirim ({serviceType}):</span>
                <span className="font-medium text-foreground">
                  {deliveryFee > 0 ? formatRupiah(deliveryFee) : "Gratis"}
                </span>
              </div>

              <div className="border-t pt-2 flex justify-between items-baseline font-black text-sm text-foreground">
                <span>Grand Total:</span>
                <span className="text-primary text-xl font-black">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 font-bold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Token Akses Pelacakan Otomatis
              </div>
              <p>Setelah pesanan dibuat, Anda akan menerima token pelacakan rahasia untuk memantau status pesanan kapan saja.</p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 font-bold text-sm shadow-md h-11"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses Pesanan...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Konfirmasi & Buat Pesanan
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
