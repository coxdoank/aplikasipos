import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { reportService } from "@/services/reportService";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { ReportsPage } from "@/modules/reports/pages/ReportsPage";
import { useAuthStore } from "@/stores/authStore";

// Mock Recharts ResponsiveContainer for JSDOM
vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

describe("Phase 10: Backoffice Analytics, Reports, and Business Insights", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    orderService.resetDemoOrders();
    paymentService.resetDemoPayments();

    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: "usr-admin-01", email: "admin@foodpos.local" },
      role: "ADMIN",
      permissions: ["reports.view", "orders.view"],
      profile: {
        id: "usr-admin-01",
        fullName: "Ratna Sari (Manajer Resto)",
        email: "admin@foodpos.local",
      },
    });
  });

  describe("1. Report Service Computations", () => {
    it("computes executive sales summary metrics accurately", async () => {
      const summary = await reportService.getSalesReportSummary("all");

      expect(summary.totalGrossRevenue).toBeGreaterThan(0);
      expect(summary.totalNetRevenue).toBeGreaterThan(0);
      expect(summary.totalTaxAmount).toBeGreaterThan(0);
      expect(summary.totalOrdersCount).toBeGreaterThan(0);
      expect(summary.averageOrderValue).toBeGreaterThan(0);
      expect(summary.totalNetRevenue).toBe(
        summary.totalGrossRevenue - summary.totalTaxAmount
      );
    });

    it("aggregates daily sales trends for charts", async () => {
      const dailyTrend = await reportService.getDailySalesTrend("all");

      expect(dailyTrend.length).toBeGreaterThan(0);
      expect(dailyTrend[0].date).toBeDefined();
      expect(dailyTrend[0].displayDate).toBeDefined();
      expect(typeof dailyTrend[0].revenue).toBe("number");
      expect(typeof dailyTrend[0].orders).toBe("number");
    });

    it("ranks top selling products and calculates revenue contribution", async () => {
      const topProducts = await reportService.getTopSellingProducts("all", 5);

      expect(topProducts.length).toBeGreaterThan(0);
      expect(topProducts[0].name).toBeDefined();
      expect(topProducts[0].sku).toBeDefined();
      expect(topProducts[0].quantitySold).toBeGreaterThan(0);
      expect(topProducts[0].totalRevenue).toBeGreaterThan(0);
      expect(topProducts[0].contributionPercent).toBeGreaterThanOrEqual(0);

      // Verify sorting descending by quantitySold
      for (let i = 0; i < topProducts.length - 1; i++) {
        expect(topProducts[i].quantitySold).toBeGreaterThanOrEqual(
          topProducts[i + 1].quantitySold
        );
      }
    });

    it("calculates sales channel breakdown between POS and ONLINE", async () => {
      const channels = await reportService.getChannelBreakdown("all");

      expect(channels.length).toBe(2);
      const pos = channels.find((c) => c.key === "POS");
      const online = channels.find((c) => c.key === "ONLINE");

      expect(pos).toBeDefined();
      expect(online).toBeDefined();
      expect(pos!.revenue).toBeGreaterThanOrEqual(0);
      expect(online!.revenue).toBeGreaterThanOrEqual(0);
      expect(pos!.percent + online!.percent).toBe(100);
    });

    it("calculates payment method breakdown for cash, QRIS, card, and transfer", async () => {
      const payments = await reportService.getPaymentMethodBreakdown("all");

      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0].method).toBeDefined();
      expect(payments[0].amount).toBeGreaterThan(0);
      expect(payments[0].percent).toBeGreaterThanOrEqual(0);
    });

    it("generates hourly peak sales trends across operational hours (08:00 to 21:00)", async () => {
      const hourly = await reportService.getHourlySalesTrend("all");

      expect(hourly.length).toBe(14); // 08:00 to 21:00 inclusive
      expect(hourly[0].hour).toBe("08:00");
      expect(hourly[hourly.length - 1].hour).toBe("21:00");
    });

    it("generates valid CSV export string with required headers", async () => {
      const csv = await reportService.generateCSV("all");

      expect(csv).toContain("No. Pesanan");
      expect(csv).toContain("Tanggal & Waktu");
      expect(csv).toContain("Pelanggan");
      expect(csv).toContain("Grand Total (Rp)");
      expect(csv.split("\n").length).toBeGreaterThan(1);
    });
  });

  describe("2. ReportsPage UI Component", () => {
    it("renders page title, date filter selector, and 4 KPI metric cards", async () => {
      render(
        <HashRouter>
          <ReportsPage />
        </HashRouter>
      );

      expect(
        await screen.findByText("Laporan Keuangan & Analitika Penjualan")
      ).toBeInTheDocument();
      expect(screen.getByText("Penjualan Bersih (Net)")).toBeInTheDocument();
      expect(screen.getByText("Pesanan Selesai")).toBeInTheDocument();
      expect(screen.getByText("Rata-rata Order (AOV)")).toBeInTheDocument();
      expect(screen.getByText("Pajak Restoran PB1")).toBeInTheDocument();
      expect(screen.getByText("Ekspor CSV")).toBeInTheDocument();
    });

    it("renders analytics chart headers and visual containers", async () => {
      render(
        <HashRouter>
          <ReportsPage />
        </HashRouter>
      );

      await screen.findByText("Laporan Keuangan & Analitika Penjualan");

      expect(screen.getByText("Tren Penjualan Harian")).toBeInTheDocument();
      expect(
        screen.getByText("Analisis Jam Sibuk Restoran (Peak Hours)")
      ).toBeInTheDocument();
      expect(screen.getByText("Komposisi Metode Pembayaran")).toBeInTheDocument();
      expect(
        screen.getByText("Perbandingan Saluran Penjualan")
      ).toBeInTheDocument();
    });

    it("renders Top 10 Selling Products ranking table with item data", async () => {
      render(
        <HashRouter>
          <ReportsPage />
        </HashRouter>
      );

      await screen.findByText("Laporan Keuangan & Analitika Penjualan");

      expect(
        screen.getByText("10 Menu Terlaris (Top Selling Items)")
      ).toBeInTheDocument();
      expect(screen.getByText("Rank")).toBeInTheDocument();
      expect(screen.getByText("Nama Menu Hidangan")).toBeInTheDocument();
      expect(screen.getByText("Porsi Terjual")).toBeInTheDocument();
      expect(screen.getByText("Kontribusi Omset")).toBeInTheDocument();
    });

    it("changes date range filter and triggers data reload", async () => {
      render(
        <HashRouter>
          <ReportsPage />
        </HashRouter>
      );

      await screen.findByText("Laporan Keuangan & Analitika Penjualan");

      const select = screen.getByDisplayValue("30 Hari Terakhir");
      fireEvent.change(select, { target: { value: "today" } });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Hari Ini")).toBeInTheDocument();
      });
    });

    it("triggers CSV download on button click", async () => {
      render(
        <HashRouter>
          <ReportsPage />
        </HashRouter>
      );

      await screen.findByText("Laporan Keuangan & Analitika Penjualan");

      const exportBtn = screen.getByText("Ekspor CSV");
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);
    });
  });
});
