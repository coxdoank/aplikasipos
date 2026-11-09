import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  Clock,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { storeService, type OrderTrackResult } from "@/services/storeService";

const statusSteps = [
  { key: "NEW", label: "Pesanan Diterima", desc: "Menunggu konfirmasi dapur", icon: Clock },
  { key: "PROCESSING", label: "Sedang Dimasak", desc: "Dapur menyiapkan pesanan", icon: ChefHat },
  { key: "READY", label: "Siap Disajikan", desc: "Pesanan siap di meja / siap antar", icon: PackageCheck },
  { key: "COMPLETED", label: "Selesai", desc: "Pesanan telah diserahkan", icon: CheckCircle2 },
];

export const TrackOrderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderTrackResult | null>(null);
  const [errorText, setErrorText] = useState("");

  const handleTrack = useCallback(async (tokenToTrack: string) => {
    if (!tokenToTrack.trim()) {
      setErrorText("Silakan masukkan token pelacakan.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setOrderResult(null);

    try {
      const res = await storeService.trackOrder(tokenToTrack.trim());
      if (res.success) {
        setOrderResult(res);
      } else {
        setErrorText(res.message || "Pesanan tidak ditemukan.");
      }
    } catch {
      setErrorText("Terjadi gangguan jaringan saat memverifikasi status pesanan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialToken) {
      handleTrack(initialToken);
    }
  }, [initialToken, handleTrack]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setSearchParams({ token: tokenInput.trim() });
      handleTrack(tokenInput.trim());
    }
  };

  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.key === orderResult?.order_status
  );

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-2xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5" /> Pelacakan Aman Realtime
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Lacak Status Pesanan Anda
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Masukkan token akses pelacakan rahasia yang Anda dapatkan saat pesanan berhasil dibuat.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-4">
        <form onSubmit={onSearchSubmit} className="space-y-3">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Token Akses Pelacakan (256-bit Token)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Contoh: trk_8f9e2b1c4d..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" disabled={loading} className="gap-2 font-bold text-xs sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mencari...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Periksa Status
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            Privasi terlindungi: Sistem mencocokkan SHA-256 hash tanpa mengekspos nomor rekening atau data tamu lain.
          </p>
        </form>
      </div>

      {/* Error Feedback */}
      {errorText && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Tracking Result View */}
      {orderResult && orderResult.success && (
        <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Nomor Pesanan
              </span>
              <span className="font-mono font-black text-xl text-primary">
                {orderResult.order_number}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Total Tagihan
              </span>
              <span className="font-extrabold text-base text-foreground">
                {formatRupiah(orderResult.grand_total || 0)}
              </span>
            </div>
          </div>

          {/* Stepper Status Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Progres Pesanan di Restoran
            </h3>

            {orderResult.order_status === "CANCELLED" ? (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Pesanan Telah Dibatalkan
                </span>
                <p>Pesanan ini telah dibatalkan oleh pihak restoran atau kasir.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStatusIndex >= idx;
                  const isCurrent = currentStatusIndex === idx;

                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/10 shadow-sm"
                          : isDone
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                          : "border-border bg-background opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`h-4 w-4 ${isDone ? "text-primary font-bold" : "text-muted-foreground"}`} />
                        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{step.label}</span>
                        <span className="text-[10px] text-muted-foreground block">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items List Snapshot */}
          {orderResult.items && orderResult.items.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rincian Menu yang Dipesan
              </h3>
              <div className="space-y-2">
                {orderResult.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs p-2.5 rounded-lg bg-muted/20 border">
                    <div>
                      <span className="font-bold block text-foreground">{it.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        Jumlah: {it.quantity} porsi {it.variant && `• Varian: ${it.variant}`}
                      </span>
                      {it.addons && it.addons.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Topping: {it.addons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-extrabold text-foreground">{formatRupiah(it.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline History */}
          {orderResult.timeline && orderResult.timeline.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Riwayat Pembaruan
              </h3>
              <div className="space-y-1.5 text-xs">
                {orderResult.timeline.map((tl, i) => (
                  <div key={i} className="flex items-center justify-between text-muted-foreground py-1 border-b border-muted">
                    <span className="font-semibold text-foreground">Status: {tl.status}</span>
                    <span className="text-[11px] font-mono">
                      {new Date(tl.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Store */}
          <div className="p-4 rounded-xl bg-muted/30 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-foreground">Ada pertanyaan terkait pesanan Anda?</p>
              <p className="text-muted-foreground">Hubungi kasir restoran kami via WhatsApp.</p>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                Hubungi Kami via WA
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
