import React, { useState } from "react";
import {
  X,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { paymentService } from "@/services/paymentService";

interface CashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
}

export const CashTransactionModal: React.FC<CashTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sessionId,
}) => {
  const { profile } = useAuthStore();
  const [type, setType] = useState<"CASH_IN" | "CASH_OUT">("CASH_OUT");
  const [amount, setAmount] = useState<number | string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === "number" ? amount : parseInt(amount, 10) || 0;

    if (numAmount <= 0) {
      setErrorMessage("Nominal arus kas harus lebih dari Rp 0.");
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Keterangan keperluan kas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.addCashTransaction(
        sessionId,
        type,
        numAmount,
        reason.trim(),
        profile?.fullName || "Petugas Kasir"
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal mencatat transaksi kas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Catat Arus Kas di Laci</h2>
              <p className="text-xs text-muted-foreground">Kas Masuk Tambahan / Pengeluaran Kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("CASH_OUT")}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === "CASH_OUT"
                  ? "border-rose-500 bg-rose-500/10 text-rose-600"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <MinusCircle className="h-4 w-4" />
              Kas Keluar (Pengeluaran)
            </button>

            <button
              type="button"
              onClick={() => setType("CASH_IN")}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === "CASH_IN"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              Kas Masuk (Tambah Modal)
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nominal (Rp) <span className="text-destructive">*</span></label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Contoh: 25000"
              className="w-full text-base font-bold bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Keterangan / Keperluan <span className="text-destructive">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Beli Es Batu Kristal",
                "Beli Air Galon Dapur",
                "Uang Parkir Staf Delivery",
                "Bumbu Dapur Darurat",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="text-[11px] bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-lg border border-border/50 text-left"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan keterangan detail pengeluaran/penerimaan kas..."
              className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !amount || !reason.trim()}
              className="text-xs gap-1.5 font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Simpan Transaksi Kas
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
