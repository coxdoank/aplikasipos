import React from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Produk</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola pengelompokan menu restoran untuk mempermudah navigasi pelanggan dan kasir.
          </p>
        </div>

        <Button size="sm" className="gap-1.5 text-xs font-semibold">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="p-8 border rounded-xl bg-card text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Layers className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base">Modul Kategori Produk</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Daftar kategori makanan, minuman, dan camilan dengan urutan prioritas tampilan.
          </p>
        </div>
      </div>
    </div>
  );
};
