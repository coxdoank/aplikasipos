import React, { useState, useEffect, useCallback } from "react";
import {
  Utensils,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  catalogService,
  type ProductItem,
  type CategoryItem,
} from "@/services/catalogService";
import { useAuthStore } from "@/stores/authStore";
import { ProductModal, type ProductFormValues } from "../components/ProductModal";

export const ProductsPage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission("products.manage");

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "AVAILABLE" | "UNAVAILABLE">("ALL");
  const [sortBy, setSortBy] = useState<"order" | "name_asc" | "price_asc" | "price_desc">("order");

  // Modal & Toast
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        catalogService.getCategories(true),
        catalogService.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // Quick Availability Toggle
  const handleToggleAvailability = async (product: ProductItem) => {
    if (!canManage) return;
    const nextVal = !product.is_available;
    await catalogService.toggleProductAvailability(product.id, nextVal);
    showToast(
      `Status ketersediaan "${product.name}" diubah menjadi ${nextVal ? "TERSEDIA" : "HABIS"}.`
    );
    loadData();
  };

  // Quick Active Toggle
  const handleToggleActive = async (product: ProductItem) => {
    if (!canManage) return;
    const nextVal = !product.is_active;
    await catalogService.toggleProductActive(product.id, nextVal);
    showToast(
      `Visibilitas "${product.name}" diubah menjadi ${nextVal ? "AKTIF" : "NONAKTIF"}.`
    );
    loadData();
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: ProductItem) => {
    if (!canManage) return;
    const confirmDelete = window.confirm(
      `Hapus produk "${product.name}" (${product.sku}) dari katalog menu?`
    );
    if (!confirmDelete) return;

    const res = await catalogService.deleteProduct(product.id);
    if (res.success) {
      showToast(res.message);
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      if (selectedProduct) {
        await catalogService.updateProduct(selectedProduct.id, values);
        showToast(`Menu "${values.name}" berhasil diperbarui.`);
      } else {
        await catalogService.createProduct(values);
        showToast(`Menu "${values.name}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan produk.";
      alert(msg);
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm("Muat ulang seluruh data menu demo awal? Perubahan kustom akan direset.")) {
      catalogService.resetDemoCatalog();
      showToast("Katalog menu berhasil dikembalikan ke data default.");
      loadData();
    }
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategoryId === "ALL" || p.category_id === selectedCategoryId;
    const matchSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAvail =
      availabilityFilter === "ALL" ||
      (availabilityFilter === "AVAILABLE" && p.is_available) ||
      (availabilityFilter === "UNAVAILABLE" && !p.is_available);

    return matchCat && matchSearch && matchAvail;
  });

  // Sorting
  filteredProducts.sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "price_asc") return a.base_price - b.base_price;
    if (sortBy === "price_desc") return b.base_price - a.base_price;
    return a.display_order - b.display_order;
  });

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const availableProducts = products.filter((p) => p.is_available).length;
  const outOfStockProducts = products.filter((p) => !p.is_available || p.current_stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-lg animate-in slide-in-from-top flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="underline opacity-90 text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            Katalog Produk & Menu
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola hidangan, harga, varian porsi, topping tambahan, dan ketersediaan stok dapur.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-1.5 text-xs"
            title="Muat Ulang Menu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetCatalog}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Reset ke Data Awal"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </Button>

          {canManage && (
            <Button size="sm" onClick={handleCreateNew} className="gap-1.5 text-xs font-semibold shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Menu Baru
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border bg-card shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Total Menu</p>
          <p className="text-2xl font-black text-foreground mt-1">{totalProducts}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-card shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Menu Aktif di Katalog</p>
          <p className="text-2xl font-black text-primary mt-1">{activeProducts}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-card shadow-sm">
          <p className="text-xs text-emerald-600 font-semibold">Tersedia di Dapur</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{availableProducts}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-card shadow-sm">
          <p className="text-xs text-destructive font-semibold">Habis / Kosong</p>
          <p className="text-2xl font-black text-destructive mt-1">{outOfStockProducts}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari hidangan atau SKU menu..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as "ALL" | "AVAILABLE" | "UNAVAILABLE")}
            className="text-xs px-2.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Semua Status Dapur</option>
            <option value="AVAILABLE">Tersedia Saja</option>
            <option value="UNAVAILABLE">Habis Saja</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "order" | "name_asc" | "price_asc" | "price_desc")}
            className="text-xs px-2.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="order">Urutan Standar</option>
            <option value="name_asc">Nama (A-Z)</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Menu & SKU</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Harga Dasar</th>
                <th className="p-3.5">Opsi Tambahan</th>
                <th className="p-3.5 text-center">Stok</th>
                <th className="p-3.5 text-center">Ketersediaan</th>
                <th className="p-3.5 text-center">Status</th>
                {canManage && <th className="p-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Memuat katalog produk menu...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Tidak ada menu yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    {/* Name & SKU */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {p.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {p.sku}
                          </span>
                        </div>
                        {p.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-sm">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                        {p.category_name}
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="p-3.5 font-bold text-foreground">
                      {formatCurrency(p.base_price)}
                    </td>

                    {/* Variants and Addons Count */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.variants.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                            {p.variants.length} Varian
                          </span>
                        )}
                        {p.addons.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
                            {p.addons.length} Topping
                          </span>
                        )}
                        {p.variants.length === 0 && p.addons.length === 0 && (
                          <span className="text-[11px] text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className={p.current_stock <= 5 ? "text-destructive" : "text-foreground"}>
                        {p.current_stock}
                      </span>
                    </td>

                    {/* Quick Availability Switch */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(p)}
                        disabled={!canManage}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          p.is_available
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        }`}
                        title="Klik untuk ubah status ketersediaan di dapur"
                      >
                        {p.is_available ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Tersedia
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Habis
                          </>
                        )}
                      </button>
                    </td>

                    {/* Active Status */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        disabled={!canManage}
                        className="text-muted-foreground hover:text-foreground"
                        title="Klik untuk tampilkan/sembunyikan di menu"
                      >
                        {p.is_active ? (
                          <ToggleRight className="h-5 w-5 text-primary inline" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground inline" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(p)}
                            className="h-7 text-xs px-2"
                            title="Edit Produk"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p)}
                            className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductModal
        product={selectedProduct}
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
