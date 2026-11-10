import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Layers,
  AlertTriangle,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  History,
  CheckCircle2,
  SlidersHorizontal,
  TrendingDown,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  inventoryService,
  type StockMovementItem,
  type StockMovementType,
  type InventoryStats,
  LOW_STOCK_THRESHOLD,
} from "@/services/inventoryService";
import {
  catalogService,
  type ProductItem,
  type CategoryItem,
} from "@/services/catalogService";
import { StockAdjustmentModal } from "../components/StockAdjustmentModal";

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canAdjust = hasPermission("inventory.adjust");

  const [activeTab, setActiveTab] = useState<"catalog" | "movements">("catalog");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalPhysicalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Catalog tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [stockHealthFilter, setStockHealthFilter] = useState<"ALL" | "HEALTHY" | "LOW" | "OUT">("ALL");

  // Filters for Movements tab
  const [movementTypeFilter, setMovementTypeFilter] = useState<StockMovementType | "ALL">("ALL");
  const [movementSearchQuery, setMovementSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductItem | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats, movs, st] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getCategories(),
        inventoryService.getStockMovements(),
        inventoryService.getInventoryStats(),
      ]);

      setProducts(prods);
      setCategories(cats);
      setMovements(movs);
      setStats(st);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open adjustment modal for a specific product
  const handleOpenAdjustment = (product?: ProductItem) => {
    setSelectedProductForModal(product || null);
    setIsModalOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    loadData();
  };

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || prod.category_id === selectedCategory;

    let matchesHealth = true;
    if (stockHealthFilter === "OUT") {
      matchesHealth = prod.current_stock === 0;
    } else if (stockHealthFilter === "LOW") {
      matchesHealth = prod.current_stock > 0 && prod.current_stock <= LOW_STOCK_THRESHOLD;
    } else if (stockHealthFilter === "HEALTHY") {
      matchesHealth = prod.current_stock > LOW_STOCK_THRESHOLD;
    }

    return matchesSearch && matchesCategory && matchesHealth;
  });

  // Filtered Movements
  const filteredMovements = movements.filter((mov) => {
    const matchesType =
      movementTypeFilter === "ALL" || mov.movement_type === movementTypeFilter;
    const matchesSearch =
      mov.product_name.toLowerCase().includes(movementSearchQuery.toLowerCase()) ||
      mov.sku.toLowerCase().includes(movementSearchQuery.toLowerCase()) ||
      mov.reason.toLowerCase().includes(movementSearchQuery.toLowerCase()) ||
      mov.actor_name.toLowerCase().includes(movementSearchQuery.toLowerCase()) ||
      (mov.reference_id && mov.reference_id.toLowerCase().includes(movementSearchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const getMovementTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case "IN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ArrowDownLeft className="h-3 w-3" /> Masuk (IN)
          </span>
        );
      case "OUT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <ArrowUpRight className="h-3 w-3" /> Keluar (OUT)
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <RefreshCw className="h-3 w-3" /> Opname
          </span>
        );
      case "SALE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <ShoppingBag className="h-3 w-3" /> Penjualan
          </span>
        );
      case "REFUND":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <TrendingDown className="h-3 w-3" /> Refund
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Stok & Inventori Produk Jadi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pantau stok produk siap jual, riwayat pergerakan stok, dan penyesuaian opname.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {canAdjust && (
            <Button
              size="sm"
              onClick={() => handleOpenAdjustment()}
              className="text-xs gap-1.5 font-semibold"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Penyesuaian Stok (Opname)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Menu Dimonitor</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{stats.totalProducts}</div>
          <p className="text-[11px] text-muted-foreground">Item produk terdaftar di katalog</p>
        </div>

        {/* Total Physical Stock */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Stok Fisik</span>
            <Package className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.totalPhysicalStock}{" "}
            <span className="text-xs font-normal text-muted-foreground">unit</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Siap disajikan / dipesan</p>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => {
            setActiveTab("catalog");
            setStockHealthFilter("LOW");
          }}
          className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm space-y-1 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">Stok Menipis (≤10)</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats.lowStockCount}
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70">Perlu restok produksi dapur</p>
        </div>

        {/* Out of Stock Alert */}
        <div
          onClick={() => {
            setActiveTab("catalog");
            setStockHealthFilter("OUT");
          }}
          className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-medium">Stok Habis (0)</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
            {stats.outOfStockCount}
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70">Otomatis dinonaktifkan di menu</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "catalog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Daftar Stok Produk Jadi ({filteredProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "movements"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat Mutasi Stok (Ledger) ({filteredMovements.length})
        </button>
      </div>

      {/* TAB 1: CATALOG STOCKS */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu atau SKU..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Health Filter */}
              <select
                value={stockHealthFilter}
                onChange={(e) =>
                  setStockHealthFilter(e.target.value as "ALL" | "HEALTHY" | "LOW" | "OUT")
                }
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Kondisi Stok</option>
                <option value="HEALTHY">Stok Aman (&gt;10)</option>
                <option value="LOW">Stok Menipis (1-10)</option>
                <option value="OUT">Stok Habis (0)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Menu & SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Dasar</th>
                    <th className="py-3 px-4 text-center">Status Jual</th>
                    <th className="py-3 px-4 text-right">Stok Fisik</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-sm">Tidak ada produk ditemukan</p>
                        <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isOutOfStock = p.current_stock === 0;
                      const isLowStock =
                        p.current_stock > 0 && p.current_stock <= LOW_STOCK_THRESHOLD;

                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          {/* Name & SKU */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-foreground block text-sm">
                                  {p.name}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {p.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-muted-foreground">
                            {p.category_name || "Tanpa Kategori"}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {formatCurrency(p.base_price)}
                          </td>

                          {/* Availability status */}
                          <td className="py-3 px-4 text-center">
                            {p.is_available ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Tersedia
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                <AlertTriangle className="h-2.5 w-2.5" /> Habis
                              </span>
                            )}
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex flex-col items-end">
                              <span
                                className={`text-sm font-extrabold px-2 py-0.5 rounded-md ${
                                  isOutOfStock
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : isLowStock
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                }`}
                              >
                                {p.current_stock} <span className="text-[10px] font-normal">unit</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {isOutOfStock ? "Habis" : isLowStock ? "Menipis" : "Stok Aman"}
                              </span>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            {canAdjust ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAdjustment(p)}
                                className="text-xs h-8 gap-1"
                              >
                                <SlidersHorizontal className="h-3 w-3" />
                                Sesuaikan
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-[11px] italic">
                                Hanya Baca
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS (LEDGER) */}
      {activeTab === "movements" && (
        <div className="space-y-4">
          {/* Movement Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={movementSearchQuery}
                onChange={(e) => setMovementSearchQuery(e.target.value)}
                placeholder="Cari referensi PO, nama produk, alasan, atau staf..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={movementTypeFilter}
                onChange={(e) =>
                  setMovementTypeFilter(e.target.value as StockMovementType | "ALL")
                }
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Jenis Mutasi</option>
                <option value="IN">Barang Masuk (IN)</option>
                <option value="OUT">Barang Keluar (OUT)</option>
                <option value="ADJUSTMENT">Opname Fisik (ADJUSTMENT)</option>
                <option value="SALE">Penjualan Kasir (SALE)</option>
                <option value="REFUND">Pengembalian (REFUND)</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk & SKU</th>
                    <th className="py-3 px-4">Tipe Mutasi</th>
                    <th className="py-3 px-4 text-center">Selisih</th>
                    <th className="py-3 px-4 text-center">Awal → Akhir</th>
                    <th className="py-3 px-4">Alasan & Referensi</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <History className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-sm">Belum ada riwayat mutasi stok</p>
                        <p className="text-xs text-muted-foreground">
                          Setiap penyesuaian opname dan transaksi kasir akan tercatat otomatis di sini.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(m.created_at)}
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block">
                            {m.product_name}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {m.sku}
                          </span>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getMovementTypeBadge(m.movement_type)}
                        </td>

                        {/* Quantity change */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-extrabold text-xs px-2 py-0.5 rounded ${
                              m.quantity_change > 0
                                ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : m.quantity_change < 0
                                ? "text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
                                : "text-muted-foreground bg-muted"
                            }`}
                          >
                            {m.quantity_change > 0
                              ? `+${m.quantity_change}`
                              : m.quantity_change}
                          </span>
                        </td>

                        {/* Previous -> New */}
                        <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                          <span className="text-muted-foreground">{m.previous_stock}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-bold text-foreground">{m.new_stock}</span>
                        </td>

                        {/* Reason & Reference */}
                        <td className="py-3 px-4">
                          <p className="text-foreground font-medium">{m.reason}</p>
                          {m.reference_id && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1 py-0.5 rounded">
                              Ref: {m.reference_id}
                            </span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {m.actor_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProductForModal(null);
        }}
        onSuccess={handleAdjustmentSuccess}
        initialProduct={selectedProductForModal}
        products={products}
      />
    </div>
  );
};
