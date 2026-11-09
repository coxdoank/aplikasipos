import React, { useState, useEffect } from "react";
import { Search, Plus, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { storeService, type PublicProduct, type PublicCategory } from "@/services/storeService";
import { ProductDetailModal } from "@/modules/public-store/components/ProductDetailModal";

export const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          storeService.getCategories(),
          storeService.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error("Gagal memuat katalog menu:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenDetail = (product: PublicProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Sajian Segar Setiap Hari
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Katalog Menu Kuliner Kami</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Pilih menu favorit Anda dengan aneka varian porsi dan topping lezat. Pesan langsung untuk dine-in, takeaway, atau diantar cepat ke alamat Anda.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semua Menu ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari makanan atau minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border rounded-xl p-5 space-y-4 animate-pulse bg-muted/20">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-12 bg-muted rounded w-full" />
              <div className="h-8 bg-muted rounded w-1/2 pt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="group border rounded-2xl bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
                    {item.category_name || "Menu"}
                  </span>
                  {item.current_stock <= 5 && item.current_stock > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Sisa {item.current_stock}
                    </span>
                  )}
                  {item.current_stock === 0 && (
                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                      Habis
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {item.name}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description || "Menu lezat siap saji dengan bumbu spesial restoran."}
                </p>

                {/* Variants / Addons teaser pills */}
                {((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.variants && item.variants.length > 0 && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                        {item.variants.length} Varian
                      </span>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                        +{item.addons.length} Topping
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Harga Mulai</span>
                  <span className="font-extrabold text-base text-foreground">
                    {formatRupiah(item.base_price)}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="gap-1 text-xs font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(item);
                  }}
                >
                  <Plus className="h-4 w-4" /> Pesan
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground space-y-3 bg-card border rounded-2xl p-8 max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-base text-foreground">Menu Tidak Ditemukan</h3>
          <p className="text-xs max-w-sm mx-auto">
            Tidak ada produk yang cocok dengan pencarian &quot;{searchQuery}&quot; pada kategori yang dipilih.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
          >
            Reset Filter & Pencarian
          </Button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
