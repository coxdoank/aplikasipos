import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryItem } from "@/services/catalogService";

const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  slug: z.string().min(2, "Slug minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  description: z.string().max(200, "Maksimal 200 karakter").optional(),
  display_order: z.coerce.number().min(0, "Urutan minimal 0"),
  is_active: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  category: CategoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      display_order: 0,
      is_active: true,
    },
  });

  const watchName = watch("name");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        display_order: category.display_order,
        is_active: category.is_active,
      });
    } else {
      reset({
        name: "",
        slug: "",
        description: "",
        display_order: 0,
        is_active: true,
      });
    }
  }, [category, reset, isOpen]);

  // Auto-slug when creating new
  const handleNameBlur = () => {
    if (!category && watchName) {
      const generated = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generated, { shouldValidate: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              {category ? "Ubah Kategori Menu" : "Tambah Kategori Baru"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 text-xs">
          {/* Category Name */}
          <div className="space-y-1">
            <label className="font-bold text-foreground block">
              Nama Kategori <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              onBlur={handleNameBlur}
              placeholder="Contoh: Makanan Utama, Minuman Dingin"
              className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="font-bold text-foreground block">
              Slug URL / Identifier <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              {...register("slug")}
              placeholder="contoh: makanan-utama"
              className="w-full px-3 py-2 rounded-xl border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
            {errors.slug && (
              <p className="text-[11px] text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-foreground block">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={2}
              {...register("description")}
              placeholder="Jelaskan jenis hidangan dalam kategori ini..."
              className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Display Order & Active status */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="space-y-1">
              <label className="font-bold text-foreground block">
                Urutan Tampilan
              </label>
              <input
                type="number"
                {...register("display_order")}
                className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              />
              {errors.display_order && (
                <p className="text-[11px] text-destructive">{errors.display_order.message}</p>
              )}
            </div>

            <div className="space-y-1 pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("is_active")}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <span className="font-bold text-foreground">Status Aktif</span>
              </label>
              <p className="text-[10px] text-muted-foreground pl-6">
                Tampilkan di kasir dan website
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 font-bold">
              <Check className="h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : category ? "Simpan Perubahan" : "Buat Kategori"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
