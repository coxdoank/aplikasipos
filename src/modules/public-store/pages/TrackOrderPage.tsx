import React, { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TrackOrderPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-12 max-w-xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Lacak Status Pesanan</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan token akses pelacakan aman (Secure Tracking Token) yang Anda dapatkan saat checkout.
        </p>
      </div>

      <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Token Akses Pelacakan
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: ord_trk_8f9e2b..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Pelacakan dilindungi hash token 256-bit untuk privasi status pesanan Anda.
            </p>
          </div>

          <Button type="submit" className="w-full gap-2">
            <Search className="h-4 w-4" /> Cari Status Pesanan
          </Button>
        </form>
      </div>
    </div>
  );
};
