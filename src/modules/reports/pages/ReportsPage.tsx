import React, { useState, useEffect, useCallback } from "react";
import {
  FileBarChart,
  Download,
  Printer,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Receipt,
  Calendar,
  Layers,
  CreditCard,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  reportService,
  type ReportDateRange,
  type SalesReportSummary,
  type DailySalesPoint,
  type TopSellingProduct,
  type ChannelBreakdownPoint,
  type PaymentMethodPoint,
  type HourlySalesPoint,
} from "@/services/reportService";

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<ReportDateRange>("30days");
  const [summary, setSummary] = useState<SalesReportSummary>({
    totalGrossRevenue: 0,
    totalNetRevenue: 0,
    totalTaxAmount: 0,
    totalDiscountAmount: 0,
    totalDeliveryFee: 0,
    totalOrdersCount: 0,
    completedOrdersCount: 0,
    cancelledOrdersCount: 0,
    averageOrderValue: 0,
  });
  const [dailyTrend, setDailyTrend] = useState<DailySalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [channels, setChannels] = useState<ChannelBreakdownPoint[]>([]);
  const [payments, setPayments] = useState<PaymentMethodPoint[]>([]);
  const [hourlyTrend, setHourlyTrend] = useState<HourlySalesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, trend, top, chan, pay, hour] = await Promise.all([
        reportService.getSalesReportSummary(dateRange),
        reportService.getDailySalesTrend(dateRange),
        reportService.getTopSellingProducts(dateRange, 10),
        reportService.getChannelBreakdown(dateRange),
        reportService.getPaymentMethodBreakdown(dateRange),
        reportService.getHourlySalesTrend(dateRange),
      ]);

      setSummary(sum);
      setDailyTrend(trend);
      setTopProducts(top);
      setChannels(chan);
      setPayments(pay);
      setHourlyTrend(hour);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await reportService.generateCSV(dateRange);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      if (typeof window !== "undefined" && window.URL && typeof window.URL.createObjectURL === "function") {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `laporan-penjualan-foodpos-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            Laporan Keuangan & Analitika Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Rekap omset operasional, menu terlaris, metode pembayaran, dan grafik jam sibuk restoran.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as ReportDateRange)}
              className="text-xs bg-transparent text-foreground focus:outline-none font-semibold cursor-pointer"
            >
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="thisMonth">Bulan Ini</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadReportData}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <h2 className="text-2xl font-black text-black">FOODPOS RESTAURANT — LAPORAN PENJUALAN</h2>
        <p className="text-xs text-gray-600">
          Periode: {dateRange} • Dicetak pada: {new Date().toLocaleString("id-ID")}
        </p>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Net Revenue */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Penjualan Bersih (Net)</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(summary.totalNetRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Kotor: {formatCurrency(summary.totalGrossRevenue)}
          </p>
        </div>

        {/* Completed Orders Count */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pesanan Selesai</span>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {summary.completedOrdersCount}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {summary.totalOrdersCount} pesanan
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Dibatalkan: {summary.cancelledOrdersCount} pesanan
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rata-rata Order (AOV)</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(summary.averageOrderValue)}
          </div>
          <p className="text-[11px] text-muted-foreground">Nilai belanja rata-rata per transaksi</p>
        </div>

        {/* Tax Collected */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pajak Restoran PB1</span>
            <Receipt className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            {formatCurrency(summary.totalTaxAmount)}
          </div>
          <p className="text-[11px] text-muted-foreground">Setoran pajak daerah 10%</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Daily Revenue Trend */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tren Penjualan Harian
              </h3>
              <p className="text-xs text-muted-foreground">Perkembangan omset harian restoran</p>
            </div>
            <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              IDR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="displayDate" fontSize={11} tickLine={false} />
                <YAxis
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatCurrency(typeof val === "number" ? val : Number(val) || 0),
                    "Pendapatan",
                  ]}
                  labelFormatter={(lbl) => `Tanggal: ${lbl}`}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Peak Dining Hours Analysis */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Analisis Jam Sibuk Restoran (Peak Hours)
              </h3>
              <p className="text-xs text-muted-foreground">Frekuensi transaksi pesanan per jam operasional</p>
            </div>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              08:00 - 21:00
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="displayHour" fontSize={11} tickLine={false} />
                <YAxis fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [
                    `${val || 0} pesanan`,
                    "Volume Transaksi",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="ordersCount"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Payment Methods Breakdown (Donut/Pie) */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Komposisi Metode Pembayaran
            </h3>
            <p className="text-xs text-muted-foreground">Persentase pembayaran tunai, QRIS, transfer, dan kartu</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada transaksi pembayaran</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payments}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {payments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val) || 0)} />
                  <Legend fontSize={11} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: Channel Composition (POS vs Online) */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Perbandingan Saluran Penjualan
            </h3>
            <p className="text-xs text-muted-foreground">
              Proporsi omset kasir di tempat (Dine-in / Takeaway) vs website online (Delivery / Pickup)
            </p>
          </div>

          <div className="space-y-5 my-auto">
            {channels.map((chan) => (
              <div key={chan.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{chan.name}</span>
                  <div className="text-right">
                    <span className="font-extrabold text-foreground">{formatCurrency(chan.revenue)}</span>
                    <span className="text-muted-foreground text-[11px] ml-2">
                      ({chan.ordersCount} pesanan • {chan.percent}%)
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${chan.percent}%`, backgroundColor: chan.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Strategi: Tingkatkan promosi menu delivery online untuk mendongkrak omset di luar jam makan siang.
            </span>
          </div>
        </div>
      </div>

      {/* TABLE 1: Top 10 Selling Products */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              10 Menu Terlaris (Top Selling Items)
            </h3>
            <p className="text-xs text-muted-foreground">
              Peringkat menu dengan volume penjualan tertinggi dan kontribusi omset terbesar
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3">Nama Menu Hidangan</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-center">Porsi Terjual</th>
                <th className="py-2.5 px-3 text-right">Total Pendapatan</th>
                <th className="py-2.5 px-3 text-right">Kontribusi Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada data penjualan pada periode ini.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={p.sku} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                          idx === 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : idx === 1
                            ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            : idx === 2
                            ? "bg-amber-700/20 text-amber-900 dark:text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.sku}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-foreground">
                      {p.quantitySold}{" "}
                      <span className="font-normal text-[10px] text-muted-foreground">porsi</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      {formatCurrency(p.totalRevenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${p.contributionPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold w-8 text-right">
                          {p.contributionPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
