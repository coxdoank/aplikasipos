import React, { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import type { PublicProduct, PublicVariant, PublicAddon } from "@/services/storeService";
import { useCartStore } from "@/stores/cartStore";

interface ProductDetailModalProps {
  product: PublicProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const addItem = useCartStore((state) => state.addItem);

  const [selectedVariant, setSelectedVariant] = useState<PublicVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<PublicAddon[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>("");
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Reset state when a new product is selected
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
      setSelectedAddons([]);
      setQuantity(1);
      setItemNotes("");
      setAddedSuccess(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const variantPriceAdjustment = selectedVariant ? selectedVariant.price_adjustment : 0;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = product.base_price + variantPriceAdjustment + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: PublicAddon) => {
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
      name: product.name,
      basePrice: product.base_price,
      variant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            priceAdjustment: selectedVariant.price_adjustment,
          }
        : null,
      addons: selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      quantity,
      itemNotes,
      imageUrl: product.image_url,
    });

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b bg-muted/20">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {product.category_name || "Menu Restoran"}
            </span>
            <h2 className="text-xl font-black text-foreground mt-0.5">{product.name}</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {product.description || "Hidangan spesial diolah dengan bahan-bahan terbaik."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Options */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Base Price & Stock */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Harga Dasar</span>
              <span className="text-lg font-black text-primary">
                {formatRupiah(product.base_price)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block font-medium">Status Stok</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  product.current_stock > 0
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {product.current_stock > 0 ? `Tersedia (${product.current_stock} porsi)` : "Habis"}
              </span>
            </div>
          </div>

          {/* Variants Selection (if any) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Pilih Varian Menu (Wajib 1)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 bg-background"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{variant.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {variant.price_adjustment > 0
                            ? `+${formatRupiah(variant.price_adjustment)}`
                            : "Harga Normal"}
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Selection (if any) */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Tambahan / Topping Ekstra (Opsional)
              </label>
              <div className="space-y-2">
                {product.addons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground/30 bg-background"
                      }`}
                    >
                      <span className="text-xs font-medium text-foreground">{addon.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          +{formatRupiah(addon.price)}
                        </span>
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Catatan Khusus untuk Dapur
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: jangan terlalu pedas, pisahkan saus, dll."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              className="w-full p-3 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-lg bg-background p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-bold text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              disabled={quantity >= product.current_stock}
              className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add to Cart Submit Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.current_stock <= 0 || addedSuccess}
            className="w-full sm:w-auto flex-1 gap-2 font-bold text-sm shadow-md"
          >
            {addedSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" /> Berhasil Ditambahkan!
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Tambah ke Keranjang — {formatRupiah(totalPrice)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
