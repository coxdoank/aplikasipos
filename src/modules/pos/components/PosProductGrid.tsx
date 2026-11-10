import React, { useState } from "react";
import { Search, Plus, SlidersHorizontal, AlertCircle } from "lucide-react";
import type { PublicProduct, PublicCategory } from "@/services/storeService";
import { usePosStore } from "@/stores/posStore";

interface PosProductGridProps {
  products: PublicProduct[];
  categories: PublicCategory[];
  onCustomizeProduct: (product: PublicProduct) => void;
  isLoading: boolean;
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  products,
  categories,
  onCustomizeProduct,
  isLoading,
}) => {
  const { addItem, items } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategoryId === "ALL" || p.category_id === selectedCategoryId;
    const matchQuery =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const handleProductClick = (product: PublicProduct) => {
    if (!product.is_available || product.current_stock <= 0) return;

    const hasOptions =
      (product.variants && product.variants.length > 0) ||
      (product.addons && product.addons.length > 0);

    if (hasOptions) {
      onCustomizeProduct(product);
    } else {
      // Instant add simple item
      addItem({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        basePrice: product.base_price,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
        imageUrl: product.image_url,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col border rounded-2xl bg-card overflow-hidden shadow-sm h-full">
      {/* Category Tabs & Search Bar */}
      <div className="p-3.5 border-b bg-muted/20 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
            <button
              onClick={() => setSelectedCategoryId("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === "ALL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background border text-muted-foreground hover:bg-muted"
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-background border text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu atau SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
            Memuat katalog menu kasir...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl p-4 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground/60 mb-2" />
            <p className="font-semibold text-foreground">Menu tidak ditemukan</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Coba sesuaikan kata kunci pencarian atau pilih kategori menu lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = !product.is_available || product.current_stock <= 0;
              const hasOptions =
                (product.variants && product.variants.length > 0) ||
                (product.addons && product.addons.length > 0);

              const inCartCount = items
                .filter((i) => i.productId === product.id)
                .reduce((sum, i) => sum + i.quantity, 0);

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`relative p-3.5 rounded-xl border text-left bg-background transition-all flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? "opacity-60 cursor-not-allowed bg-muted/30"
                      : "cursor-pointer hover:border-primary/60 hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  {/* Cart Count Badge */}
                  {inCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-50">
                      {inCartCount}
                    </span>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        {product.sku}
                      </span>
                      {hasOptions && (
                        <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <SlidersHorizontal className="h-2.5 w-2.5" /> Varian
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-foreground line-clamp-2 leading-snug pt-0.5">
                      {product.name}
                    </h4>

                    {product.category_name && (
                      <p className="text-[10px] text-muted-foreground">
                        {product.category_name}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-primary block">
                        {formatCurrency(product.base_price)}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold text-destructive">
                          Stok Habis
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">
                          Stok: {product.current_stock}
                        </span>
                      )}
                    </div>

                    {!isOutOfStock && (
                      <button
                        type="button"
                        className="h-7 w-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center shadow-sm"
                        title={hasOptions ? "Pilih Opsi Varian" : "Tambah Cepat"}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
