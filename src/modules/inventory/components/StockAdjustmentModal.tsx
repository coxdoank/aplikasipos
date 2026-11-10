import React, { useState, useEffect } from "react";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { inventoryService } from "@/services/inventoryService";
import type { ProductItem } from "@/services/catalogService";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct?: ProductItem) => void;
  initialProduct?: ProductItem | null;
  products: ProductItem[];
}

const PRESET_REASONS: Record<"IN" | "OUT" | "ADJUSTMENT", string[]> = {
  IN: [
    "Restok produksi dapur harian",
    "Penerimaan pasokan bahan/produk",
    "Koreksi kelebihan stok opname",
  ],
  OUT: [
    "Bahan makanan rusak / basi / kadaluarsa",
    "Porsi tumpah saat penyiapan dapur",
    "Pengurangan uji rasa (quality control)",
  ],
  ADJUSTMENT: [
    "Hasil stock opname fisik berkala",
    "Penyesuaian selisih fisik shift kerja",
    "Koreksi kesalahan input kasir/staf",
  ],
};

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
  products,
}) => {
  const { profile, hasPermission } = useAuthStore();
  const canAdjust = hasPermission("inventory.adjust");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT" | "ADJUSTMENT">("ADJUSTMENT");
  const [quantity, setQuantity] = useState<number | string>("");
  const [reason, setReason] = useState<string>("");
  const [referenceId, setReferenceId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync when initialProduct changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialProduct) {
        setSelectedProductId(initialProduct.id);
        setQuantity(initialProduct.current_stock);
      } else if (products.length > 0) {
        const defaultProd = products[0];
        setSelectedProductId(defaultProd.id);
        setQuantity(defaultProd.current_stock);
      }
      setAdjustmentType("ADJUSTMENT");
      setReason("");
      setReferenceId("");
    }
  }, [isOpen, initialProduct, products]);

  if (!isOpen) return null;

  const currentProduct =
    products.find((p) => p.id === selectedProductId) || initialProduct || null;

  const currentStock = currentProduct ? currentProduct.current_stock : 0;
  const numQuantity = typeof quantity === "number" ? quantity : parseInt(quantity, 10) || 0;

  // Calculate live preview
  let calculatedNewStock = currentStock;
  let quantityDelta = 0;
  let isQuantityValid = true;
  let validationWarning: string | null = null;

  if (adjustmentType === "IN") {
    quantityDelta = numQuantity;
    calculatedNewStock = currentStock + numQuantity;
    if (numQuantity <= 0) {
      isQuantityValid = false;
      validationWarning = "Jumlah barang masuk harus lebih dari 0.";
    }
  } else if (adjustmentType === "OUT") {
    quantityDelta = -numQuantity;
    calculatedNewStock = currentStock - numQuantity;
    if (numQuantity <= 0) {
      isQuantityValid = false;
      validationWarning = "Jumlah barang keluar harus lebih dari 0.";
    } else if (numQuantity > currentStock) {
      isQuantityValid = false;
      validationWarning = `Jumlah keluar melebihi stok fisik saat ini (${currentStock} unit).`;
    }
  } else {
    // ADJUSTMENT (Opname)
    calculatedNewStock = numQuantity;
    quantityDelta = numQuantity - currentStock;
    if (numQuantity < 0) {
      isQuantityValid = false;
      validationWarning = "Stok fisik hasil opname tidak boleh negatif.";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canAdjust) {
      setErrorMessage("Anda tidak memiliki izin (inventory.adjust) untuk melakukan penyesuaian stok.");
      return;
    }

    if (!currentProduct) {
      setErrorMessage("Silakan pilih produk yang akan disesuaikan.");
      return;
    }

    if (!isQuantityValid || validationWarning) {
      setErrorMessage(validationWarning || "Periksa kembali jumlah unit yang dimasukkan.");
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Alasan penyesuaian stok wajib diisi demi akurasi audit ledger.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inventoryService.adjustStock({
        productId: currentProduct.id,
        type: adjustmentType,
        quantity: numQuantity,
        reason: reason.trim(),
        referenceId: referenceId.trim() || undefined,
        actorName: profile?.fullName || "Staf Operasional",
      });

      if (!res.success) {
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      onSuccess(res.product);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyesuaikan stok.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Penyesuaian Stok Produk Jadi</h2>
              <p className="text-xs text-muted-foreground">
                Audit fisik, pencatatan barang masuk/keluar, dan mutasi ledger.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Permission Warning */}
          {!canAdjust && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                <strong>Akses Terbatas:</strong> Akun Anda tidak memiliki izin{" "}
                <code className="bg-destructive/15 px-1 py-0.5 rounded">inventory.adjust</code>.
                Hanya Owner dan Admin yang berwenang menyesuaikan stok fisik.
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Produk Menu yang Disesuaikan</label>
            {initialProduct ? (
              <div className="p-3 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{initialProduct.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border text-muted-foreground">
                      {initialProduct.sku}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {initialProduct.category_name || "Menu"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Stok Saat Ini</span>
                  <span className="text-base font-extrabold text-foreground">
                    {initialProduct.current_stock} <span className="text-xs font-normal">porsi</span>
                  </span>
                </div>
              </div>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p && adjustmentType === "ADJUSTMENT") {
                    setQuantity(p.current_stock);
                  }
                }}
                className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stok: {p.current_stock} unit
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Adjustment Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Jenis Penyesuaian</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType("ADJUSTMENT");
                  if (currentProduct) setQuantity(currentProduct.current_stock);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  adjustmentType === "ADJUSTMENT"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <RefreshCw className="h-4 w-4 mb-1" />
                Opname Fisik
                <span className="text-[10px] font-normal opacity-75">Hitung Total Real</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentType("IN");
                  setQuantity(10);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  adjustmentType === "IN"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 mb-1" />
                Barang Masuk
                <span className="text-[10px] font-normal opacity-75">Restok / Pembelian</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentType("OUT");
                  setQuantity(1);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  adjustmentType === "OUT"
                    ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 mb-1" />
                Barang Keluar
                <span className="text-[10px] font-normal opacity-75">Basi / Rusak / Hilang</span>
              </button>
            </div>
          </div>

          {/* Quantity Input & Live Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {adjustmentType === "IN" && "Jumlah Tambahan Masuk (Unit)"}
                {adjustmentType === "OUT" && "Jumlah Pengurangan Keluar (Unit)"}
                {adjustmentType === "ADJUSTMENT" && "Stok Fisik Aktual Hasil Opname (Unit)"}
              </label>
              <input
                type="number"
                min={adjustmentType === "ADJUSTMENT" ? 0 : 1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Masukkan jumlah..."
                className="w-full text-sm font-bold bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {validationWarning && (
                <p className="text-[11px] text-destructive font-medium">{validationWarning}</p>
              )}
            </div>

            {/* Live Calculation Preview Card */}
            <div className="rounded-xl border border-border bg-muted/40 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Perhitungan Stok</span>
                <span className="font-mono text-[10px]">PREVIEW</span>
              </div>
              <div className="flex items-center justify-between my-1">
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground block">Awal</span>
                  <span className="text-sm font-bold">{currentStock}</span>
                </div>
                <div className="text-center font-bold text-xs text-muted-foreground">
                  {quantityDelta >= 0 ? `+${quantityDelta}` : `${quantityDelta}`}
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground block">Stok Baru</span>
                  <span
                    className={`text-base font-extrabold ${
                      calculatedNewStock === 0
                        ? "text-rose-600"
                        : calculatedNewStock <= 10
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {isQuantityValid ? calculatedNewStock : "-"}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {calculatedNewStock === 0 && (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Menu akan ditandai Habis.
                  </span>
                )}
                {calculatedNewStock > 0 && currentStock === 0 && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Menu akan kembali Tersedia.
                  </span>
                )}
                {calculatedNewStock > 0 && currentStock > 0 && (
                  <span>Status ketersediaan tetap aktif.</span>
                )}
              </div>
            </div>
          </div>

          {/* Reference ID (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nomor Referensi Dokumen / PO <span className="text-muted-foreground font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="Contoh: PO-202611-001, OPN-SHIFT-PAGI"
              className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
          </div>

          {/* Reason Input with Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Alasan Penyesuaian <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">Wajib diisi</span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS[adjustmentType].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="text-[11px] bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50 transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan keterangan detail alasan penyesuaian stok ini..."
              className="w-full text-xs bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !canAdjust || !isQuantityValid}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menyimpan Mutasi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Simpan Penyesuaian Stok
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
