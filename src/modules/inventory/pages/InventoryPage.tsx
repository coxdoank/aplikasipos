import React from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InventoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stok & Inventori Produk Jadi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pantau stok produk siap jual, riwayat pergerakan stok, dan penyesuaian opname.
          </p>
        </div>

        <Button variant="outline" size="sm" className="text-xs">
          Penyesuaian Stok
        </Button>
      </div>

      <div className="p-8 border rounded-xl bg-card text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Package className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base">Inventori Produk Jadi (Finished Goods)</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Sistem mencatat mutasi stok produk jadi secara konsisten untuk mencegah stok negatif.
          </p>
        </div>
      </div>
    </div>
  );
};
