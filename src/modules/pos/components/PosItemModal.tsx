import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicProduct, PublicVariant, PublicAddon } from "@/services/storeService";
import { usePosStore, calculatePosUnitPrice } from "@/stores/posStore";

interface PosItemModalProps {
  product: PublicProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PosItemModal: React.FC<PosItemModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem } = usePosStore();

  const [selectedVariant, setSelectedVariant] = useState<PublicVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<PublicAddon[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>("");

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
      setSelectedAddons([]);
      setQuantity(1);
      setItemNotes("");
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const unitPrice = calculatePosUnitPrice(
    product.base_price,
    selectedVariant,
    selectedAddons
  );
  const lineTotal = unitPrice * quantity;

  const handleToggleAddon = (addon: PublicAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      basePrice: product.base_price,
      variant: selectedVariant,
      addons: selectedAddons,
      quantity,
      itemNotes: itemNotes.trim(),
      imageUrl: product.image_url,
    });
    onClose();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold px-1.5 py-0.5 rounded bg-muted">
              {product.sku}
            </span>
            <h3 className="font-bold text-sm sm:text-base text-foreground mt-0.5">
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Base Price info */}
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/20 border">
            <span className="text-muted-foreground">Harga Dasar Satuan:</span>
            <span className="font-bold text-sm text-foreground">
              {formatCurrency(product.base_price)}
            </span>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                Pilih Varian Hidangan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border bg-background hover:bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{v.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <span className="text-[11px] block mt-0.5 text-muted-foreground font-normal">
                        {v.price_adjustment > 0 ? `+${formatCurrency(v.price_adjustment)}` : "Standar"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                Pilihan Topping & Tambahan:
              </label>
              <div className="space-y-1.5">
                {product.addons.map((a) => {
                  const isChecked = selectedAddons.some((sel) => sel.id === a.id);
                  return (
                    <label
                      key={a.id}
                      onClick={() => handleToggleAddon(a)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5 text-foreground font-semibold"
                          : "border-border hover:bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent label
                          className="h-3.5 w-3.5 rounded text-primary"
                        />
                        <span>{a.name}</span>
                      </div>
                      <span className="text-primary font-semibold">
                        +{formatCurrency(a.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen notes per item */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Catatan Khusus Koki / Dapur:
            </label>
            <input
              type="text"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Contoh: Tidak pakai daun bawang, sambal dipisah"
              className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
          </div>

          {/* Quantity stepper */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
            <span className="font-bold text-foreground">Jumlah Porsi:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-lg border bg-background flex items-center justify-center hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-8 w-8 rounded-lg border bg-background flex items-center justify-center hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Subtotal & Add Button */}
        <div className="p-4 border-t flex items-center justify-between gap-3 bg-muted/20">
          <div>
            <span className="text-[11px] text-muted-foreground block">Total Item:</span>
            <span className="text-base font-extrabold text-primary">
              {formatCurrency(lineTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button size="sm" onClick={handleAddToCart} className="gap-1.5 font-bold">
              <Check className="h-4 w-4" /> Tambah ke Pesanan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
