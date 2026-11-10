import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Check, Utensils, Plus, Trash2, SlidersHorizontal, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductItem, CategoryItem } from "@/services/catalogService";

const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter").max(100, "Maksimal 100 karakter"),
  sku: z.string().min(2, "SKU minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  category_id: z.string().min(1, "Pilih kategori menu"),
  base_price: z.coerce.number().min(100, "Harga minimal Rp 100"),
  description: z.string().max(300, "Maksimal 300 karakter").optional(),
  image_url: z.string().optional(),
  is_active: z.boolean(),
  is_available: z.boolean(),
  current_stock: z.coerce.number().min(0, "Stok tidak boleh negatif"),
  display_order: z.coerce.number().min(0, "Urutan minimal 0"),
  variants: z.array(
    z.object({
      name: z.string().min(1, "Nama varian wajib diisi"),
      price_adjustment: z.coerce.number(),
    })
  ),
  addons: z.array(
    z.object({
      name: z.string().min(1, "Nama topping wajib diisi"),
      price: z.coerce.number().min(0, "Harga topping minimal 0"),
    })
  ),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
  product: ProductItem | null;
  categories: CategoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  categories,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "variants" | "addons">("general");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category_id: "",
      base_price: 25000,
      description: "",
      image_url: "",
      is_active: true,
      is_available: true,
      current_stock: 50,
      display_order: 1,
      variants: [],
      addons: [],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: addonFields,
    append: appendAddon,
    remove: removeAddon,
  } = useFieldArray({
    control,
    name: "addons",
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id || (categories[0]?.id || ""),
        base_price: product.base_price,
        description: product.description || "",
        image_url: product.image_url || "",
        is_active: product.is_active,
        is_available: product.is_available,
        current_stock: product.current_stock,
        display_order: product.display_order,
        variants: product.variants.map((v) => ({
          name: v.name,
          price_adjustment: v.price_adjustment,
        })),
        addons: product.addons.map((a) => ({
          name: a.name,
          price: a.price,
        })),
      });
    } else {
      reset({
        name: "",
        sku: `MENU-${Math.floor(100 + Math.random() * 900)}`,
        category_id: categories[0]?.id || "",
        base_price: 25000,
        description: "",
        image_url: "",
        is_active: true,
        is_available: true,
        current_stock: 50,
        display_order: 1,
        variants: [],
        addons: [],
      });
    }
    setActiveTab("general");
  }, [product, categories, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-card border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                {product ? `Ubah Menu: ${product.name}` : "Tambah Menu Hidangan Baru"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Konfigurasi harga dasar, ketersediaan, porsi varian, dan topping tambahan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b bg-muted/10 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-2.5 px-3 border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "general"
                ? "border-primary text-primary bg-background font-black"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" /> Informasi & Stok
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("variants")}
            className={`py-2.5 px-3 border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "variants"
                ? "border-primary text-primary bg-background font-black"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Varian Porsi ({variantFields.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("addons")}
            className={`py-2.5 px-3 border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "addons"
                ? "border-primary text-primary bg-background font-black"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="h-4 w-4" /> Topping / Add-on ({addonFields.length})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
            {/* TAB 1: INFORMASI UMUM */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-foreground block">
                      Nama Hidangan <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      placeholder="Contoh: Ayam Bakar Madu Gurih"
                      className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    {errors.name && (
                      <p className="text-[11px] text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      Kode SKU Menu <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("sku")}
                      placeholder="AYM-001"
                      className="w-full px-3 py-2 rounded-xl border bg-background font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    {errors.sku && (
                      <p className="text-[11px] text-destructive">{errors.sku.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      Kategori Hidangan <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register("category_id")}
                      className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    >
                      <option value="">Pilih Kategori...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="text-[11px] text-destructive">{errors.category_id.message}</p>
                    )}
                  </div>

                  {/* Base Price */}
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      Harga Dasar Satuan (Rp) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("base_price")}
                      className="w-full px-3 py-2 rounded-xl border bg-background font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    {errors.base_price && (
                      <p className="text-[11px] text-destructive">{errors.base_price.message}</p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      Stok Fisik Tersedia
                    </label>
                    <input
                      type="number"
                      {...register("current_stock")}
                      className="w-full px-3 py-2 rounded-xl border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    {errors.current_stock && (
                      <p className="text-[11px] text-destructive">{errors.current_stock.message}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Deskripsi Rasa & Porsi</label>
                  <textarea
                    rows={2}
                    {...register("description")}
                    placeholder="Jelaskan bumbu, bahan utama, dan cita rasa hidangan..."
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                {/* Status switches */}
                <div className="p-3.5 rounded-2xl bg-muted/20 border grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("is_available")}
                      className="h-4 w-4 rounded text-primary"
                    />
                    <div>
                      <span className="font-bold text-foreground block">Ketersediaan Dapur</span>
                      <span className="text-[10px] text-muted-foreground">
                        Tersedia untuk dipesan saat ini
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("is_active")}
                      className="h-4 w-4 rounded text-primary"
                    />
                    <div>
                      <span className="font-bold text-foreground block">Tampilkan di Menu</span>
                      <span className="text-[10px] text-muted-foreground">
                        Terlihat di website dan kasir
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: VARIAN PORSI */}
            {activeTab === "variants" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-[11px]">
                    Tambahkan opsi porsi atau potongan (misal: Porsi Standar, Porsi Jumbo, Dada, Paha).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendVariant({ name: "", price_adjustment: 0 })}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Varian
                  </Button>
                </div>

                {variantFields.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-2xl text-center text-muted-foreground text-xs">
                    Belum ada varian khusus. Menu akan disajikan dalam porsi standar tanpa opsi tambahan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variantFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-3 rounded-xl border bg-muted/10 flex items-center gap-2 text-xs"
                      >
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">
                            Nama Varian:
                          </label>
                          <input
                            type="text"
                            {...register(`variants.${idx}.name`)}
                            placeholder="Contoh: Jumbo / Paha Atas"
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs"
                          />
                        </div>

                        <div className="w-36 space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">
                            Selisih Harga (+/- Rp):
                          </label>
                          <input
                            type="number"
                            {...register(`variants.${idx}.price_adjustment`)}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background font-mono text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-4"
                          title="Hapus Varian"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TOPPING / ADD-ON */}
            {activeTab === "addons" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-[11px]">
                    Tambahkan ekstra lauk, topping, atau sambal (misal: Telur Ceplok, Nasi Uduk, Sambal Ekstra).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendAddon({ name: "", price: 5000 })}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Topping
                  </Button>
                </div>

                {addonFields.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-2xl text-center text-muted-foreground text-xs">
                    Belum ada topping/addon tambahan untuk hidangan ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addonFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-3 rounded-xl border bg-muted/10 flex items-center gap-2 text-xs"
                      >
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">
                            Nama Topping / Addon:
                          </label>
                          <input
                            type="text"
                            {...register(`addons.${idx}.name`)}
                            placeholder="Contoh: Telur Dadar / Ekstra Sambal"
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs"
                          />
                        </div>

                        <div className="w-36 space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">
                            Harga Tambahan (Rp):
                          </label>
                          <input
                            type="number"
                            {...register(`addons.${idx}.price`)}
                            placeholder="5000"
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background font-mono text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAddon(idx)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-4"
                          title="Hapus Topping"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t flex items-center justify-between gap-3 bg-muted/20">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>

            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 font-bold px-6 shadow-md">
              <Check className="h-4 w-4" />
              {isSubmitting ? "Menyimpan Data..." : product ? "Simpan Perubahan Menu" : "Buat Menu Baru"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
