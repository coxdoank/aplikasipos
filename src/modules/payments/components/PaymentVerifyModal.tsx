import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  CreditCard,
  Building,
  Calendar,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { paymentService, type PaymentRecord } from "@/services/paymentService";

interface PaymentVerifyModalProps {
  payment: PaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentVerifyModal: React.FC<PaymentVerifyModalProps> = ({
  payment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile, hasPermission } = useAuthStore();
  const canVerify = hasPermission("payments.verify");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const handleVerify = async () => {
    if (!canVerify) {
      setErrorMessage("Anda tidak memiliki izin (payments.verify) untuk menyetujui verifikasi pembayaran.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.verifyPayment(
        payment.id,
        profile?.fullName || "Petugas Kasir"
      );
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan verifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canVerify) {
      setErrorMessage("Anda tidak memiliki izin untuk menolak pembayaran.");
      return;
    }

    if (!rejectReason.trim()) {
      setErrorMessage("Alasan penolakan bukti pembayaran wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.rejectPayment(
        payment.id,
        profile?.fullName || "Petugas Kasir",
        rejectReason
      );
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan penolakan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Verifikasi Bukti Pembayaran
              </h2>
              <p className="text-xs text-muted-foreground">
                Pesanan {payment.order_number} ({payment.payment_method})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Details Card */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-muted/30 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">No. Pesanan</span>
              <span className="font-bold text-foreground">{payment.order_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Nama Pelanggan</span>
              <span className="font-bold text-foreground">{payment.customer_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Metode Pembayaran</span>
              <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                {payment.payment_method === "BANK_TRANSFER" && <Building className="h-3.5 w-3.5 text-primary" />}
                {payment.payment_method === "QRIS" && <CreditCard className="h-3.5 w-3.5 text-primary" />}
                {payment.payment_method}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Tagihan</span>
              <span className="font-black text-sm text-primary">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            {payment.reference_number && (
              <div>
                <span className="text-muted-foreground block text-[11px]">Nomor Referensi</span>
                <span className="font-mono text-xs text-foreground bg-background px-2 py-0.5 rounded border inline-block mt-0.5">
                  {payment.reference_number}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block text-[11px]">Waktu Transaksi</span>
              <span className="text-xs text-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {formatDate(payment.created_at)}
              </span>
            </div>
          </div>

          {/* Proof Image / Document Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                Bukti Transfer Pelanggan
              </span>
              {payment.proof_url && (
                <a
                  href={payment.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Buka Gambar Penuh <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden flex flex-col items-center justify-center p-3 text-center min-h-[160px]">
              {payment.proof_url ? (
                <div className="space-y-2">
                  <img
                    src={payment.proof_url}
                    alt="Bukti Transfer"
                    className="max-h-60 rounded-lg object-contain shadow-sm border border-border"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Pastikan nama rekening pengirim, tanggal, dan nominal Rp{" "}
                    {payment.amount.toLocaleString("id-ID")} sesuai.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 py-6">
                  <Receipt className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    Bukti gambar tidak diunggah oleh pelanggan. Verifikasi dapat dilakukan berdasarkan mutasi bank rekening Anda.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reject Reason Form when activated */}
          {rejectMode ? (
            <form onSubmit={handleReject} className="space-y-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-destructive">
                <span>Alasan Penolakan Pembayaran</span>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  Batal Tolak
                </button>
              </div>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan (misal: Bukti transfer palsu, dana belum masuk ke mutasi)..."
                className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="text-xs gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Konfirmasi Tolak Pembayaran
                </Button>
              </div>
            </form>
          ) : (
            /* Action Buttons */
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectMode(true)}
                disabled={isSubmitting || !canVerify}
                className="text-xs text-destructive hover:bg-destructive/10 gap-1.5 border-destructive/20"
              >
                <XCircle className="h-3.5 w-3.5" />
                Tolak Bukti
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Tutup
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleVerify}
                  disabled={isSubmitting || !canVerify}
                  className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verifikasi & Terima Pembayaran
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
