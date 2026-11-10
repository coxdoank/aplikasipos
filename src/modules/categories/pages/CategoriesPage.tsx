import React, { useState, useEffect, useCallback } from "react";
import { Plus, Layers, Edit, Trash2, CheckCircle2, XCircle, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalogService, type CategoryItem } from "@/services/catalogService";
import { useAuthStore } from "@/stores/authStore";
import { CategoryModal } from "../components/CategoryModal";

export const CategoriesPage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission("products.manage");

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await catalogService.getCategories(true);
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateNew = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: CategoryItem) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: CategoryItem) => {
    if (!canManage) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`
    );
    if (!confirmDelete) return;

    const res = await catalogService.deleteCategory(category.id);
    if (res.success) {
      showToast(res.message);
      loadCategories();
    } else {
      alert(res.message);
    }
  };

  const handleFormSubmit = async (values: {
    name: string;
    slug?: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
  }) => {
    if (selectedCategory) {
      await catalogService.updateCategory(selectedCategory.id, values);
      showToast(`Kategori "${values.name}" berhasil diperbarui.`);
    } else {
      await catalogService.createCategory(values);
      showToast(`Kategori "${values.name}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
    loadCategories();
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Layers className="h-6 w-6 text-primary" />
            Kategori Menu Restoran
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola pengelompokan menu hidangan untuk mempermudah navigasi pemesanan pelanggan dan kasir POS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="gap-1.5 text-xs"
            title="Muat Ulang Kategori"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {canManage && (
            <Button size="sm" onClick={handleCreateNew} className="gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" /> Tambah Kategori
            </Button>
          )}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kategori atau slug..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Total: {filteredCategories.length} Kategori
        </span>
      </div>

      {/* Categories Table */}
      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5 w-16 text-center">Urutan</th>
                <th className="p-3.5">Nama Kategori</th>
                <th className="p-3.5">Slug URL</th>
                <th className="p-3.5">Deskripsi</th>
                <th className="p-3.5 text-center">Jumlah Produk</th>
                <th className="p-3.5 text-center">Status</th>
                {canManage && <th className="p-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Memuat daftar kategori menu...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Tidak ada kategori yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 text-center font-mono font-bold text-muted-foreground">
                      #{cat.display_order}
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-foreground text-sm block">
                        {cat.name}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-[11px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
                        {cat.slug}
                      </span>
                    </td>

                    <td className="p-3.5 text-muted-foreground max-w-xs truncate">
                      {cat.description || "-"}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-primary/10 text-primary">
                        {cat.products_count ?? 0} menu
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {cat.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          <XCircle className="h-3 w-3" /> Nonaktif
                        </span>
                      )}
                    </td>

                    {canManage && (
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cat)}
                            className="h-7 text-xs px-2"
                            title="Edit Kategori"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat)}
                            className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                            title="Hapus Kategori"
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

      {/* Modal */}
      <CategoryModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
