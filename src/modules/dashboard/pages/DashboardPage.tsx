import React from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan Operasional Restoran</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pantau penjualan hari ini, antrian pesanan, dan status stok produk selesai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/backoffice/pos">
            <Button size="sm" className="font-semibold shadow-sm">
              Buka Layar Kasir
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendapatan Hari Ini</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">Rp 2.450.000</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> +14.2% dari kemarin
          </div>
        </div>

        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pesanan</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">38 Transaksi</div>
          <div className="text-xs text-muted-foreground">
            32 Selesai, 6 Sedang Diproses
          </div>
        </div>

        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Rata-rata Waktu Masak</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">14 Menit</div>
          <div className="text-xs text-muted-foreground">Target standar: &lt; 15 menit</div>
        </div>

        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Peringatan Stok Rendah</span>
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">2 Menu</div>
          <div className="text-xs text-rose-500 font-medium">Perlu perhatian inventori</div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-base">Antrian Pesanan Berjalan</h3>
              <p className="text-xs text-muted-foreground">Daftar transaksi aktif di dapur dan kasir</p>
            </div>
            <Link to="/backoffice/orders" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { id: "ORD-20261109-001", customer: "Budi Santoso", type: "Dine-in", total: 115000, status: "PROCESSING", items: "3 item" },
              { id: "ORD-20261109-002", customer: "Siti Rahma", type: "Takeaway", total: 42000, status: "READY", items: "1 item" },
              { id: "ORD-20261109-003", customer: "Ahmad Fauzi", type: "Delivery", total: 85000, status: "NEW", items: "2 item" },
            ].map((ord) => (
              <div key={ord.id} className="p-3.5 border rounded-lg flex items-center justify-between bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{ord.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-primary/10 text-primary">
                      {ord.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ord.customer} • {ord.items}</p>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-bold text-sm block">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(ord.total)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ord.status === "READY"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : ord.status === "PROCESSING"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Shift Status */}
        <div className="border rounded-xl bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-base">Status Shift Kasir</h3>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1 text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle className="h-4 w-4" /> Shift Sedang Aktif
              </div>
              <p>Kasir: Administrator</p>
              <p>Mulai: 10:00 WIB (Modal Kas: Rp 500.000)</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total Penjualan Tunai:</span>
                <span className="font-semibold">Rp 1.250.000</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total Non-Tunai (QRIS/EDC):</span>
                <span className="font-semibold">Rp 1.200.000</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-bold">Ekspektasi Uang Fisik di Laci:</span>
                <span className="font-bold text-primary">Rp 1.750.000</span>
              </div>
            </div>
          </div>

          <Link to="/backoffice/pos" className="w-full">
            <Button variant="outline" className="w-full text-xs">
              Kelola Kasir & Shift
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
