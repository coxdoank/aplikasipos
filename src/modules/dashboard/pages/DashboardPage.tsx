import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle,
  Shield,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { formatRupiah } from "@/lib/utils";

export const DashboardPage: React.FC = () => {
  const { profile, role, outlet, hasPermission } = useAuthStore();
  const [shiftActive, setShiftActive] = useState(true);
  const openingCash = 500000;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/15 via-amber-500/10 to-transparent border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground uppercase">
              {role || "STAF"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" /> {outlet?.name || "Outlet Pusat"}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Selamat Datang, {profile?.fullName || "Staf Operasional"}!
          </h1>
          <p className="text-xs text-muted-foreground">
            Sistem Point of Sale & Restaurant Management FOODPOS siap melayani transaksi operasional hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission("orders.create") && (
            <Link to="/backoffice/pos">
              <Button size="sm" className="gap-1.5 font-bold shadow-md">
                <ShoppingBag className="h-4 w-4" /> Buka Layar Kasir POS
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendapatan Hari Ini</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">{formatRupiah(2450000)}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> +14.2% dari kemarin
          </div>
        </div>

        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pesanan</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">38 Transaksi</div>
          <div className="text-xs text-muted-foreground">
            32 Selesai, 6 Sedang Diproses
          </div>
        </div>

        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Waktu Masak Dapur</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">14 Menit</div>
          <div className="text-xs text-muted-foreground">Target standar: &lt; 15 menit</div>
        </div>

        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Peringatan Stok Rendah</span>
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">2 Menu</div>
          <div className="text-xs text-rose-500 font-medium">Perlu penyesuaian inventori</div>
        </div>
      </div>

      {/* Main Grid: Orders & Shift Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 border rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-base">Antrian Pesanan Terkini</h3>
              <p className="text-xs text-muted-foreground">Pesanan aktif di kasir dan dapur</p>
            </div>
            {hasPermission("orders.view") && (
              <Link to="/backoffice/orders" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Lihat Semua Pesanan <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {[
              { id: "ORD-20261109-001", customer: "Budi Santoso", type: "Dine-in", total: 115000, status: "PROCESSING", items: "3 item" },
              { id: "ORD-20261109-002", customer: "Siti Rahma", type: "Takeaway", total: 42000, status: "READY", items: "1 item" },
              { id: "ORD-20261109-003", customer: "Ahmad Fauzi", type: "Delivery", total: 85000, status: "NEW", items: "2 item" },
            ].map((ord) => (
              <div key={ord.id} className="p-3.5 border rounded-xl flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors">
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
                  <span className="font-black text-sm block">
                    {formatRupiah(ord.total)}
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

        {/* Quick Shift Status & Management Card */}
        <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">Status Shift Kasir</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shiftActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {shiftActive ? "Aktif" : "Tertutup"}
              </span>
            </div>

            {shiftActive ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1.5 text-emerald-950 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> Sesi Kasir Sedang Dibuka
                </div>
                <p>Operator: <span className="font-semibold">{profile?.fullName}</span></p>
                <p>Modal Kas Laci Awal: <span className="font-semibold">{formatRupiah(openingCash)}</span></p>
              </div>
            ) : (
              <div className="p-3.5 bg-muted/40 border rounded-xl text-xs space-y-1 text-muted-foreground">
                <p className="font-semibold text-foreground">Shift Kasir Belum Dibuka</p>
                <p>Silakan buka sesi shift baru sebelum memproses transaksi tunai.</p>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Total Penjualan Tunai:</span>
                <span className="font-semibold">{formatRupiah(1250000)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Total Non-Tunai (QRIS/EDC):</span>
                <span className="font-semibold">{formatRupiah(1200000)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-muted">
                <span className="text-muted-foreground font-bold">Ekspektasi Uang Fisik di Laci:</span>
                <span className="font-black text-primary text-sm">{formatRupiah(openingCash + 1250000)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {hasPermission("orders.create") && (
              <Link to="/backoffice/pos" className="w-full block">
                <Button className="w-full text-xs font-bold gap-1.5">
                  <ShoppingBag className="h-4 w-4" /> Transaksi Kasir POS
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShiftActive(!shiftActive)}
              className="w-full text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {shiftActive ? "Tutup Shift Kasir" : "Buka Shift Kasir Baru"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
