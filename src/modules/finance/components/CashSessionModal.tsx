import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  paymentService,
  type CashSessionRecord,
} from "@/services/paymentService";

interface CashSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // If activeSession is provided, mode is CLOSE shift. If null, mode is OPEN shift.
  activeSession: CashSessionRecord | null;
}

export const CashSessionModal: React.FC<CashSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeSession,
}) => {
  const { user, profile, hasPermission } = useAuthStore();
  const canOpen = hasPermission("cash_sessions.open");
  const canClose = hasPermission("cash_sessions.close");

  const isCloseMode = Boolean(activeSession);

  // Form State
  const [openingCash, setOpeningCash] = useState<number | string>(200000);
  const [actualClosingCash, setActualClosingCash] = useState<number | string>("");
  const [closingNotes, setClosingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (activeSession) {
        // Default actual cash = expected closing cash
        const expected =
          activeSession.opening_cash +
          activeSession.total_cash_sales +
          activeSession.total_cash_in -
          activeSession.total_cash_out;
        setActualClosingCash(expected);
        setClosingNotes("");
      } else {
        setOpeningCash(200000);
      }
    }
  }, [isOpen, activeSession]);

  if (!isOpen) return null;

  const expectedClosingCash = activeSession
    ? activeSession.opening_cash +
      activeSession.total_cash_sales +
      activeSession.total_cash_in -
      activeSession.total_cash_out
    : 0;

  const numActualCash =
    typeof actualClosingCash === "number"
      ? actualClosingCash
      : parseInt(actualClosingCash, 10) || 0;

  const discrepancy = numActualCash - expectedClosingCash;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOpen) {
      setErrorMessage("Anda tidak memiliki izin (cash_sessions.open) untuk membuka shift kasir.");
      return;
    }

    const numOpening =
      typeof openingCash === "number" ? openingCash : parseInt(openingCash, 10) || 0;

    if (numOpening < 0) {
      setErrorMessage("Modal awal kasir tidak boleh negatif.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.openCashSession(numOpening, {
        id: user?.id || "usr-cashier-01",
        name: profile?.fullName || "Budi Santoso (Kasir)",
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal membuka sesi kasir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (!canClose) {
      setErrorMessage("Anda tidak memiliki izin (cash_sessions.close) untuk menutup shift kasir.");
      return;
    }

    if (numActualCash < 0) {
      setErrorMessage("Hitungan kas fisik aktual tidak boleh bernilai negatif.");
      return;
    }

    if (discrepancy !== 0 && !closingNotes.trim()) {
      setErrorMessage("Terdapat selisih kas fisik. Catatan penjelasan selisih wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await paymentService.closeCashSession(
        activeSession.id,
        numActualCash,
        {
          id: user?.id || "usr-cashier-01",
          name: profile?.fullName || "Budi Santoso (Kasir)",
        },
        closingNotes.trim() || undefined
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal menutup sesi kasir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                isCloseMode
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {isCloseMode ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isCloseMode ? "Tutup Shift Kasir (Closing)" : "Buka Shift Kasir Baru (Opening)"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isCloseMode
                  ? "Rekonsiliasi uang fisik di laci dengan pencatatan sistem"
                  : "Tetapkan modal kas awal untuk operasional shift kasir"}
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

          {/* MODE 1: OPEN SHIFT */}
          {!isCloseMode && (
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs space-y-1">
                <span className="text-muted-foreground block text-[11px]">Kasir Penanggung Jawab</span>
                <span className="font-bold text-foreground text-sm block">
                  {profile?.fullName || "Budi Santoso (Kasir Shift)"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Waktu Mulai: {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Modal Kas Awal di Laci (Rp) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={openingCash}
                  onChange={(e) =>
                    setOpeningCash(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full text-base font-bold bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Quick nominal buttons */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Pilihan Cepat Nominal:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[100000, 200000, 300000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpeningCash(amt)}
                      className="text-xs font-semibold p-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      {amt.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !canOpen}
                  className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Buka Shift Kasir
                </Button>
              </div>
            </form>
          )}

          {/* MODE 2: CLOSE SHIFT */}
          {isCloseMode && activeSession && (
            <form onSubmit={handleCloseShift} className="space-y-4">
              {/* Shift Financial Breakdown Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground pb-2 border-b border-border/60">
                  <span>Dibuka Oleh: <strong>{activeSession.opened_by_name}</strong></span>
                  <span>Mulai: {new Date(activeSession.opened_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Modal Kas Awal</span>
                  <span className="font-semibold text-foreground">
                    Rp {activeSession.opening_cash.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-emerald-600">
                  <span>+ Total Penjualan Tunai</span>
                  <span className="font-bold">
                    +Rp {activeSession.total_cash_sales.toLocaleString("id-ID")}
                  </span>
                </div>

                {activeSession.total_cash_in > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>+ Kas Masuk Tambahan</span>
                    <span className="font-bold">
                      +Rp {activeSession.total_cash_in.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                {activeSession.total_cash_out > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span>- Kas Keluar / Pengeluaran</span>
                    <span className="font-bold">
                      -Rp {activeSession.total_cash_out.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-extrabold text-foreground">
                  <span>Ekspektasi Kas di Laci</span>
                  <span>Rp {expectedClosingCash.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Actual Cash Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Hitungan Kas Fisik Aktual di Laci (Rp) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={actualClosingCash}
                  onChange={(e) =>
                    setActualClosingCash(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full text-base font-bold bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Discrepancy Indicator Box */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  discrepancy === 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : discrepancy > 0
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {discrepancy === 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>Status Selisih Kas:</span>
                </div>
                <span>
                  {discrepancy === 0
                    ? "Tepat / Pas (Rp 0)"
                    : discrepancy > 0
                    ? `Surplus / Lebih (+Rp ${discrepancy.toLocaleString("id-ID")})`
                    : `Defisit / Kurang (-Rp ${Math.abs(discrepancy).toLocaleString("id-ID")})`}
                </span>
              </div>

              {/* Mandatory Note if discrepancy */}
              {discrepancy !== 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-destructive">
                    Penjelasan Selisih Kas <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Contoh: Selisih Rp 2.000 karena pembulatan uang receh kembalian..."
                    className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !canClose || (discrepancy !== 0 && !closingNotes.trim())}
                  className="text-xs gap-1.5 font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Konfirmasi Tutup Shift
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
