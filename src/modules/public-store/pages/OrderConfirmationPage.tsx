import React, { useState } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  Building,
  QrCode,
  Banknote,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import type { OrderConfirmationResult } from "@/services/storeService";

export const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const orderData = location.state?.orderData as OrderConfirmationResult | undefined;

  const [copied, setCopied] = useState(false);

  if (!orderData) {
    return <Navigate to="/track" replace />;
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(orderData.trackingToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-2xl space-y-8 animate-in fade-in duration-300">
      {/* Top Success Badge */}
      <div className="text-center space-y-3">
        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Pesanan Berhasil Dibuat!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Terima kasih telah memesan di FOODPOS. Dapur kami telah menerima pesanan Anda dan segera menyiapkan hidangan.
        </p>
      </div>

      {/* Order Info Card */}
      <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Nomor Pesanan
            </span>
            <span className="font-mono font-black text-lg text-primary">
              {orderData.orderNumber}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Status Pesanan
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">
              NEW (Baru)
            </span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-medium text-foreground">{formatRupiah(orderData.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Pajak Restoran (10%):</span>
            <span className="font-medium text-foreground">{formatRupiah(orderData.taxAmount)}</span>
          </div>
          {orderData.deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Pengantaran Delivery:</span>
              <span className="font-medium text-foreground">{formatRupiah(orderData.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Metode Layanan:</span>
            <span className="font-semibold text-foreground">{orderData.serviceType}</span>
          </div>
          <div className="border-t pt-2 flex justify-between items-baseline font-black text-sm">
            <span>Total Tagihan:</span>
            <span className="text-primary text-xl">{formatRupiah(orderData.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment Instruction Section */}
      <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {orderData.paymentMethod === "QRIS" && <QrCode className="h-4 w-4 text-primary" />}
          {orderData.paymentMethod === "BANK_TRANSFER" && <Building className="h-4 w-4 text-primary" />}
          {orderData.paymentMethod === "CASH" && <Banknote className="h-4 w-4 text-primary" />}
          Petunjuk Pembayaran ({orderData.paymentMethod})
        </h2>

        {orderData.paymentMethod === "QRIS" && (
          <div className="p-4 rounded-xl bg-muted/30 border space-y-3 text-center">
            <div className="p-3 bg-white rounded-lg inline-block shadow-sm">
              {/* Static QR placeholder simulation */}
              <div className="w-44 h-44 bg-neutral-900 flex flex-col items-center justify-center text-white p-2 text-center rounded">
                <QrCode className="w-20 h-20 text-white mb-1" />
                <span className="text-[10px] font-bold">QRIS STATIS FOODPOS</span>
                <span className="text-[8px] opacity-75">NMID: ID102009281928</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan kode QR di atas menggunakan aplikasi mobile banking atau e-wallet (BCA, GoPay, OVO, Dana).
            </p>
            <p className="text-xs font-bold text-foreground">
              Nominal yang harus dibayar: <span className="text-primary">{formatRupiah(orderData.grandTotal)}</span>
            </p>
          </div>
        )}

        {orderData.paymentMethod === "BANK_TRANSFER" && (
          <div className="p-4 rounded-xl bg-muted/30 border space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Bank Tujuan:</span>
              <span className="font-bold text-foreground">Bank Central Asia (BCA)</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Nomor Rekening:</span>
              <span className="font-mono font-bold text-foreground text-sm">8820192831</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Atas Nama:</span>
              <span className="font-bold text-foreground">PT KULINER MAKMUR POS</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground font-bold">Jumlah Transfer:</span>
              <span className="font-bold text-primary text-sm">{formatRupiah(orderData.grandTotal)}</span>
            </div>
          </div>
        )}

        {orderData.paymentMethod === "CASH" && (
          <div className="p-4 rounded-xl bg-muted/30 border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Pembayaran Tunai:</p>
            <p>Silakan siapkan uang pas sebesar {formatRupiah(orderData.grandTotal)} untuk diserahkan ke kasir saat mengambil pesanan atau kepada kurir saat pengantaran.</p>
          </div>
        )}
      </div>

      {/* Secure Tracking Token Box */}
      <div className="border-2 border-primary/40 rounded-2xl p-6 bg-primary/5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
              Token Akses Pelacakan Rahasia
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Simpan token ini untuk memantau proses memasak di dapur dan pengantaran pesanan. Token hanya dapat dilihat pada layar ini dan dilindungi enkripsi hash 256-bit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border">
          <code className="text-xs font-mono font-bold text-foreground flex-1 truncate select-all">
            {orderData.trackingToken}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyToken}
            className="text-xs gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Salin Token
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to={`/track?token=${encodeURIComponent(orderData.trackingToken)}`}
            className="flex-1"
          >
            <Button size="lg" className="w-full gap-2 font-bold shadow-md">
              <Search className="h-4 w-4" /> Lacak Status Pesanan Ini Sekarang
            </Button>
          </Link>
          <Link to="/menu">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Kembali ke Menu <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
