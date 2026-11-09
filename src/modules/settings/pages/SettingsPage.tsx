import React from "react";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Toko & Pajak</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola identitas outlet, konfigurasi QRIS, nomor rekening, tarif pajak, dan service charge.
          </p>
        </div>

        <Button size="sm" className="gap-1.5 text-xs font-semibold">
          <Save className="h-4 w-4" /> Simpan Pengaturan
        </Button>
      </div>

      <div className="p-8 border rounded-xl bg-card text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Settings className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base">Modul Pengaturan Restoran</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Seluruh parameter bisnis tersimpan secara aman di backend Supabase dan tercatat pada audit log.
          </p>
        </div>
      </div>
    </div>
  );
};
