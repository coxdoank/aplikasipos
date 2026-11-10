import React, { useState, useEffect } from "react";
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/stores/posStore";
import { orderService, type OrderDetail } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

interface PosPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: OrderDetail, cashReceived: number, changeAmount: number) => void;
}

type PaymentTab = "CASH" | "QRIS" | "DEBIT_CARD" | "BANK_TRANSFER";

export const PosPaymentModal: React.FC<PosPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuthStore();
  const {
    items,
    customerName,
    customerPhone,
    tableNumber,
    serviceType,
    orderNotes,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getGrandTotal,
    clearCart,
  } = usePosStore();

  const grandTotal = getGrandTotal();
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount();

  const [activeTab, setActiveTab] = useState<PaymentTab>("CASH");
  const [receivedCash, setReceivedCash] = useState<number>(grandTotal);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [cardBank, setCardBank] = useState<string>("BCA");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReceivedCash(grandTotal);
      setReferenceNumber("");
      setErrorMessage(null);
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, receivedCash - grandTotal);
  const isCashSufficient = receivedCash >= grandTotal;

  const handleQuickAdd = (amount: number) => {
    setReceivedCash((prev) => prev + amount);
  };

  const handleExactCash = () => {
    setReceivedCash(grandTotal);
  };

  const handleResetCash = () => {
    setReceivedCash(0);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const handleProcessPayment = async () => {
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Keranjang pesanan masih kosong.");
      return;
    }

    if (activeTab === "CASH" && !isCashSufficient) {
      setErrorMessage("Uang tunai yang diterima kurang dari total tagihan.");
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${datePart}-${randomPart}`;
      const orderId = `pos-${Date.now()}`;
      const cashierName = profile?.fullName || user?.email || "Kasir Operasional";

      const finalRefNumber =
        activeTab === "CASH"
          ? `CASH-${Date.now().toString().slice(-6)}`
          : activeTab === "QRIS"
          ? referenceNumber.trim() || `QRIS-${Date.now().toString().slice(-6)}`
          : activeTab === "DEBIT_CARD"
          ? `${cardBank}-${referenceNumber.trim() || Date.now().toString().slice(-6)}`
          : referenceNumber.trim() || `TRF-BCA-${Date.now().toString().slice(-6)}`;

      const newOrder: OrderDetail = {
        id: orderId,
        outlet_id: "e0000000-0000-0000-0000-000000000001",
        order_number: orderNumber,
        channel: "POS",
        service_type: serviceType,
        order_status: "PROCESSING", // POS orders go directly to kitchen
        customer_name_snapshot: customerName || "Tamu Kasir",
        customer_phone_snapshot: customerPhone || "-",
        delivery_address_snapshot: null,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        service_charge_amount: 0,
        delivery_fee: 0,
        grand_total: grandTotal,
        notes: [
          serviceType === "DINE_IN" ? tableNumber : null,
          orderNotes ? `Catatan: ${orderNotes}` : null,
        ]
          .filter(Boolean)
          .join(" • ") || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        items: items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          order_id: orderId,
          product_id: item.productId,
          product_name_snapshot: item.name,
          sku_snapshot: item.sku,
          variant_name_snapshot: item.variant?.name || null,
          addons_snapshot: item.addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
          unit_price: item.unitPrice,
          quantity: item.quantity,
          discount_amount: 0,
          line_total: item.unitPrice * item.quantity,
          item_notes: item.itemNotes || null,
        })),
        history: [
          {
            id: `h-${Date.now()}`,
            order_id: orderId,
            previous_status: null,
            new_status: "NEW",
            actor_name: cashierName,
            reason: `Transaksi kasir dibuat (${serviceType})`,
            created_at: now.toISOString(),
          },
          {
            id: `h-${Date.now() + 1}`,
            order_id: orderId,
            previous_status: "NEW",
            new_status: "PROCESSING",
            actor_name: cashierName,
            reason: "Pesanan lunas & langsung dikirim ke dapur",
            created_at: now.toISOString(),
          },
        ],
        payment: {
          id: `pay-${Date.now()}`,
          order_id: orderId,
          payment_method: activeTab,
          status: "PAID",
          amount: grandTotal,
          cash_received: activeTab === "CASH" ? receivedCash : grandTotal,
          change_amount: activeTab === "CASH" ? changeAmount : 0,
          reference_number: finalRefNumber,
          verified_by: cashierName,
          verified_at: now.toISOString(),
          created_at: now.toISOString(),
        },
      };

      // Register with order service & play chime
      orderService.registerOnlineOrder(newOrder);
      orderService.playKitchenChime();

      // Clear cart
      clearCart();

      // Callback to success modal
      onSuccess(newOrder, activeTab === "CASH" ? receivedCash : grandTotal, activeTab === "CASH" ? changeAmount : 0);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pembayaran kasir.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-card border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-foreground">
              Pembayaran Kasir POS
            </h3>
            <p className="text-xs text-muted-foreground">
              {customerName} • {serviceType} ({tableNumber})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-primary/10 border-b p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Total Tagihan Lunas
            </span>
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            {discountAmount > 0 && <p className="text-emerald-600 font-semibold">- Diskon: {formatCurrency(discountAmount)}</p>}
            <p>Pajak PB1 (10%): {formatCurrency(taxAmount)}</p>
          </div>
        </div>

        {/* Payment Tabs */}
        <div className="grid grid-cols-4 border-b bg-muted/10 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setActiveTab("CASH")}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "CASH"
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Banknote className="h-4 w-4" /> Tunai
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("QRIS")}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "QRIS"
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-4 w-4" /> QRIS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DEBIT_CARD")}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "DEBIT_CARD"
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" /> EDC / Kartu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("BANK_TRANSFER")}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "BANK_TRANSFER"
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building className="h-4 w-4" /> Transfer
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 1: CASH */}
          {activeTab === "CASH" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Uang Tunai Diterima (Rp):
                </label>
                <input
                  type="number"
                  value={receivedCash || ""}
                  onChange={(e) => setReceivedCash(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 text-lg font-mono font-bold rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground text-[11px] block">
                  Pecahan Cepat Uang Kertas:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 20000, 50000, 100000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => handleQuickAdd(denom)}
                      className="py-2 rounded-xl border bg-background font-bold text-xs hover:bg-muted active:scale-95 transition-all"
                    >
                      +{denom / 1000}k
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all"
                  >
                    Uang Pas ({formatCurrency(grandTotal)})
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCash}
                    className="py-2 rounded-xl border bg-background text-muted-foreground font-semibold text-xs hover:bg-muted transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Input
                  </button>
                </div>
              </div>

              {/* Change Box */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
                  isCashSufficient
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                <div>
                  <span className="font-semibold text-xs block">
                    {isCashSufficient ? "Kembalian Pelanggan:" : "Status Uang Tunai:"}
                  </span>
                  <span className="text-xl font-black">
                    {isCashSufficient ? formatCurrency(changeAmount) : "Uang Kurang"}
                  </span>
                </div>
                {isCashSufficient && <CheckCircle2 className="h-7 w-7 text-emerald-600" />}
              </div>
            </div>
          )}

          {/* TAB 2: QRIS */}
          {activeTab === "QRIS" && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl border bg-muted/10 inline-block mx-auto space-y-2">
                {/* SVG Simulated QR Code */}
                <div className="h-44 w-44 mx-auto bg-white p-3 rounded-xl shadow-inner flex flex-col items-center justify-center border">
                  <QrCode className="h-32 w-32 text-zinc-900" />
                  <span className="text-[10px] font-mono font-bold text-zinc-700">QRIS STANDAR NASIONAL</span>
                </div>
                <p className="font-bold text-sm text-foreground">FOODPOS RESTO OUTLET PUSAT</p>
                <p className="text-[11px] text-muted-foreground">NMID: ID1029384756182</p>
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto text-left">
                <label className="font-semibold text-muted-foreground block text-[11px]">
                  Nomor Referensi Transaksi QRIS (Opsional):
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Misal: QRIS-982143 (Otomatis jika kosong)"
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: EDC / KARTU DEBIT */}
          {activeTab === "DEBIT_CARD" && (
            <div className="space-y-3.5 max-w-md mx-auto">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Pilih Bank Mesin EDC:</label>
                <div className="grid grid-cols-4 gap-2">
                  {["BCA", "Mandiri", "BRI", "BNI"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCardBank(b)}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        cardBank === b
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Nomor Jejak / Approval Code EDC:
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Contoh: APPR-882194 / Trace 0021"
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border text-[11px] text-muted-foreground">
                Pastikan struk fisik dari mesin EDC bank telah keluar dan berstatus <strong>SUCCESS / APPROVE</strong> sebelum menekan tombol konfirmasi.
              </div>
            </div>
          )}

          {/* TAB 4: BANK TRANSFER */}
          {activeTab === "BANK_TRANSFER" && (
            <div className="space-y-3 max-w-md mx-auto">
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                <span className="font-semibold text-muted-foreground text-[10px] uppercase">
                  Rekening Penerimaan Kasir:
                </span>
                <p className="text-sm font-bold text-foreground">BCA: 8820-1928-33</p>
                <p className="text-[11px] text-muted-foreground">a/n PT FOODPOS RESTORAN INDONESIA</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Nomor Referensi Transfer Bank:
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Misal: TRF-BCA-98124"
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex items-center justify-between gap-3 bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>

          <Button
            size="sm"
            onClick={handleProcessPayment}
            disabled={isSubmitting || (activeTab === "CASH" && !isCashSufficient)}
            className="gap-2 font-bold px-6 shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? "Memproses Transaksi..." : `Konfirmasi Bayar (${formatCurrency(grandTotal)})`}
          </Button>
        </div>
      </div>
    </div>
  );
};
