import React from "react";
import { FileBarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan & Penjualan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Laporan omset harian, rekapitulasi shift kasir, metode pembayaran, dan rincian transaksi.
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Ekspor Laporan
        </Button>
      </div>

      <div className="p-8 border rounded-xl bg-card text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FileBarChart className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base">Modul Laporan & Analitika</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Laporan menyajikan data akurat pendapatan, pemisahan uang fisik vs non-tunai, dan rekapitulasi refund.
          </p>
        </div>
      </div>
    </div>
  );
};
