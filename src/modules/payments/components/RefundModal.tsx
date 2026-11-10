import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  paymentService,
  type PaymentRecord,
  type PaymentRefundRecord,
} from "@/services/paymentService";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // If provided, we are reviewing/approving an existing refund
  existingRefund?: PaymentRefundRecord | null;
  // If provided, we are creating a new refund for this payment
  targetPayment?: PaymentRecord | null;
  payments?: PaymentRecord[];
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingRefund,
  targetPayment,
  payments = [],
}) => {
  const { user, profile, hasPermission } = useAuthStore();
  const canRequest = hasPermission("payments.refund.request");
  const canApprove = hasPermission("payments.refund.approve");

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<number | string>("");
  const [reason, setReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReviewMode = Boolean(existingRefund);

  // Initialize modal state
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setShowRejectInput(false);
      setRejectionReason("");

      if (existingRefund) {
        setRefundAmount(existingRefund.refund_amount);
        setReason(existingRefund.reason);
      } else if (targetPayment) {
        setSelectedPaymentId(targetPayment.id);
        setRefundAmount(targetPayment.amount);
        setReason("");
      } else if (payments.length > 0) {
        const paidOnly = payments.filter((p) => p.status === "PAID");
        if (paidOnly.length > 0) {
          setSelectedPaymentId(paidOnly[0].id);
          setRefundAmount(paidOnly[0].amount);
        }
        setReason("");
      }
    }
  }, [isOpen, existingRefund, targetPayment, payments]);

  if (!isOpen) return null;

  const currentPayment =
    targetPayment ||
    payments.find((p) => p.id === selectedPaymentId) ||
    null;

  const maxAmount = existingRefund
    ? existingRefund.refund_amount
    : currentPayment?.amount || 0;

  const isSelfApproval =
    existingRefund &&
    user &&
    existingRefund.requested_by_id === user.id;

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRequest) {
      setErrorMessage("Anda tidak memiliki izin (payments.refund.request) untuk mengajukan refund.");
      return;
    }

    if (!selectedPaymentId && !targetPayment) {
      setErrorMessage("Pilih transaksi pembayaran yang akan direfund.");
      return;
    }

    const payId = targetPayment?.id || selectedPaymentId;
    const numAmount = typeof refundAmount === "number" ? refundAmount : parseInt(refundAmount, 10) || 0;

    if (numAmount <= 0 || numAmount > maxAmount) {
      setErrorMessage(`Nominal refund harus antara Rp 1 hingga Rp ${maxAmount.toLocaleString("id-ID")}.`);
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Alasan pengajuan refund wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.requestRefund(
        payId,
        numAmount,
        reason.trim(),
        {
          id: user?.id || "usr-cashier-01",
          name: profile?.fullName || "Petugas Kasir",
        }
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal mengajukan refund.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!existingRefund) return;
    if (!canApprove) {
      setErrorMessage("Hanya Owner dan Admin yang memiliki izin (payments.refund.approve) untuk menyetujui refund.");
      return;
    }

    if (isSelfApproval) {
      setErrorMessage("Aturan Dual-Custody: Anda tidak dapat menyetujui refund yang Anda ajukan sendiri.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.approveRefund(
        existingRefund.id,
        {
          id: user?.id || "usr-admin-01",
          name: profile?.fullName || "Manajer Resto",
        }
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal menyetujui refund.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingRefund) return;
    if (!canApprove) {
      setErrorMessage("Anda tidak memiliki wewenang untuk menolak pengajuan refund.");
      return;
    }

    if (!rejectionReason.trim()) {
      setErrorMessage("Alasan penolakan pengajuan refund wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.rejectRefund(
        existingRefund.id,
        {
          id: user?.id || "usr-admin-01",
          name: profile?.fullName || "Manajer Resto",
        },
        rejectionReason.trim()
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal menolak refund.");
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
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isReviewMode ? "Tinjau Pengajuan Refund" : "Ajukan Pengembalian Dana (Refund)"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isReviewMode
                  ? `Pesanan ${existingRefund?.order_number}`
                  : "Pengembalian dana transaksi kasir / online"}
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

          {/* Dual-Custody Warning Banner */}
          {isReviewMode && isSelfApproval && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <span>
                <strong>Aturan Keamanan Dual-Custody:</strong> Anda adalah staf yang mengajukan refund ini. Persetujuan harus dilakukan oleh Owner atau Admin lain untuk menjamin transparansi keuangan.
              </span>
            </div>
          )}

          {/* Mode 1: Review Existing Refund */}
          {isReviewMode && existingRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-muted/30 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">No. Pesanan</span>
                  <span className="font-bold text-foreground">{existingRefund.order_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nama Pelanggan</span>
                  <span className="font-bold text-foreground">{existingRefund.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Metode Pembayaran</span>
                  <span className="font-bold text-foreground">{existingRefund.payment_method}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nominal Refund Diajukan</span>
                  <span className="font-black text-sm text-rose-600">
                    Rp {existingRefund.refund_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Diajukan Oleh</span>
                  <span className="font-semibold text-foreground">
                    {existingRefund.requested_by_name} ({new Date(existingRefund.created_at).toLocaleString("id-ID")})
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Alasan Refund</span>
                  <p className="font-medium text-foreground italic mt-0.5 bg-background p-2 rounded-lg border border-border">
                    &ldquo;{existingRefund.reason}&rdquo;
                  </p>
                </div>
              </div>

              {/* Reject Input when activated */}
              {showRejectInput ? (
                <form onSubmit={handleReject} className="space-y-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-destructive">
                    <span>Alasan Penolakan Refund</span>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline"
                    >
                      Batal Tolak
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Tuliskan alasan penolakan refund ini..."
                    className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      disabled={isSubmitting || !rejectionReason.trim()}
                      className="text-xs"
                    >
                      Konfirmasi Tolak Refund
                    </Button>
                  </div>
                </form>
              ) : (
                /* Action Buttons for Approver */
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectInput(true)}
                    disabled={isSubmitting || !canApprove}
                    className="text-xs text-destructive hover:bg-destructive/10 gap-1.5 border-destructive/20"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Tolak Refund
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
                      onClick={handleApprove}
                      disabled={isSubmitting || !canApprove || Boolean(isSelfApproval)}
                      className="text-xs gap-1.5 font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Setujui Pengembalian Dana
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Create Refund Request */}
          {!isReviewMode && (
            <form onSubmit={handleRequestRefund} className="space-y-4">
              {/* Target Payment Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Transaksi yang Direfund</label>
                {targetPayment ? (
                  <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-foreground block">{targetPayment.order_number}</span>
                      <span className="text-muted-foreground">{targetPayment.customer_name} ({targetPayment.payment_method})</span>
                    </div>
                    <span className="font-black text-primary">
                      Rp {targetPayment.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedPaymentId}
                    onChange={(e) => {
                      setSelectedPaymentId(e.target.value);
                      const p = payments.find((pay) => pay.id === e.target.value);
                      if (p) setRefundAmount(p.amount);
                    }}
                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {payments
                      .filter((p) => p.status === "PAID")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.order_number} — {p.customer_name} (Rp {p.amount.toLocaleString("id-ID")} • {p.payment_method})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Nominal Refund (Rp)</label>
                  <span className="text-[10px] text-muted-foreground">
                    Maks: Rp {maxAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={maxAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-sm font-bold bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Reason Input with Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Alasan Pengajuan Refund <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Pelanggan membatalkan pesanan sebelum dimasak",
                    "Pesanan ganda / salah input nominal",
                    "Porsi menu habis / kualitas tidak sesuai",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="text-[11px] bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50 text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan detail pengajuan refund..."
                  className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !canRequest || !reason.trim()}
                  className="text-xs gap-1.5 font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Kirim Pengajuan Refund
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
