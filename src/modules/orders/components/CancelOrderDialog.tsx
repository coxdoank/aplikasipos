import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderDetail } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

interface CancelOrderDialogProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  "Bahan baku makanan habis di dapur",
  "Pelanggan meminta pembatalan pesanan",
  "Waktu tunggu melebihi batas toleransi",
  "Kendala teknis alat memasak / operasional",
  "Lainnya (Tulis alasan spesifik)",
];

export const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const { hasPermission } = useAuthStore();
  const canCancel = hasPermission("orders.cancel");

  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalReason = selectedReason === "Lainnya (Tulis alasan spesifik)"
      ? customReason.trim()
      : selectedReason;

    if (!finalReason) {
      setErrorMessage("Silakan isi alasan pembatalan dengan jelas.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmCancel(order.id, finalReason);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan pesanan.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold text-base sm:text-lg">Batalkan Pesanan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nomor Pesanan:</p>
            <p className="font-mono font-bold text-sm text-foreground">
              {order.order_number} ({order.customer_name_snapshot})
            </p>
          </div>

          {!canCancel ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
              <strong>Akses Dibatasi:</strong> Akun Anda saat ini tidak memiliki izin{" "}
              <code className="font-mono text-[11px] font-bold">orders.cancel</code>. Hanya peran Manajer (ADMIN) atau Pemilik (OWNER) yang dapat menyetujui pembatalan pesanan.
            </div>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Riwayat pembatalan beserta alasan akan tercatat dalam audit sistem.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Pilih Alasan Pembatalan:
                </label>
                <div className="space-y-2">
                  {PRESET_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="h-3.5 w-3.5 text-primary"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason === "Lainnya (Tulis alasan spesifik)" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Alasan Spesifik <span className="text-destructive">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Jelaskan alasan pembatalan secara detail..."
                    className="w-full text-xs p-2.5 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              )}

              {errorMessage && (
                <p className="text-xs text-destructive font-medium">{errorMessage}</p>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Kembali
            </Button>
            {canCancel && (
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Konfirmasi Batalkan"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
