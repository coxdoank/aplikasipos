import { orderService, type OrderDetail } from "./orderService";
import { paymentService, type PaymentRecord } from "./paymentService";

export type ReportDateRange = "today" | "7days" | "30days" | "thisMonth" | "all";

export interface SalesReportSummary {
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalTaxAmount: number;
  totalDiscountAmount: number;
  totalDeliveryFee: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  averageOrderValue: number;
}

export interface DailySalesPoint {
  date: string;
  displayDate: string;
  revenue: number;
  orders: number;
  tax: number;
}

export interface TopSellingProduct {
  sku: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
  contributionPercent: number;
}

export interface ChannelBreakdownPoint {
  key: string;
  name: string;
  revenue: number;
  ordersCount: number;
  percent: number;
  color: string;
}

export interface PaymentMethodPoint {
  method: string;
  name: string;
  amount: number;
  transactionCount: number;
  percent: number;
  color: string;
}

export interface HourlySalesPoint {
  hour: string;
  displayHour: string;
  ordersCount: number;
  revenue: number;
}

const filterOrdersByRange = (orders: OrderDetail[], range: ReportDateRange): OrderDetail[] => {
  if (range === "all") return orders;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let minTime = 0;
  if (range === "today") {
    minTime = startOfDay;
  } else if (range === "7days") {
    minTime = startOfDay - 6 * 24 * 60 * 60 * 1000;
  } else if (range === "30days") {
    minTime = startOfDay - 29 * 24 * 60 * 60 * 1000;
  } else if (range === "thisMonth") {
    minTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  return orders.filter((o) => new Date(o.created_at).getTime() >= minTime);
};

const filterPaymentsByRange = (payments: PaymentRecord[], range: ReportDateRange): PaymentRecord[] => {
  if (range === "all") return payments;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let minTime = 0;
  if (range === "today") {
    minTime = startOfDay;
  } else if (range === "7days") {
    minTime = startOfDay - 6 * 24 * 60 * 60 * 1000;
  } else if (range === "30days") {
    minTime = startOfDay - 29 * 24 * 60 * 60 * 1000;
  } else if (range === "thisMonth") {
    minTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  return payments.filter((p) => new Date(p.created_at).getTime() >= minTime);
};

export const reportService = {
  // 1. Executive Summary KPIs
  async getSalesReportSummary(range: ReportDateRange = "30days"): Promise<SalesReportSummary> {
    const allOrders = await orderService.getOrders();
    const orders = filterOrdersByRange(allOrders, range);

    let totalGrossRevenue = 0;
    let totalDiscountAmount = 0;
    let totalTaxAmount = 0;
    let totalDeliveryFee = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    for (const o of orders) {
      if (o.order_status === "CANCELLED") {
        cancelledOrdersCount++;
        continue;
      }

      totalGrossRevenue += o.grand_total;
      totalDiscountAmount += o.discount_amount || 0;
      totalTaxAmount += o.tax_amount || 0;
      totalDeliveryFee += o.delivery_fee || 0;

      if (o.order_status === "COMPLETED") {
        completedOrdersCount++;
      }
    }

    const validOrdersCount = orders.length - cancelledOrdersCount;
    const averageOrderValue =
      validOrdersCount > 0 ? Math.round(totalGrossRevenue / validOrdersCount) : 0;
    const totalNetRevenue = totalGrossRevenue - totalTaxAmount;

    return {
      totalGrossRevenue,
      totalNetRevenue,
      totalTaxAmount,
      totalDiscountAmount,
      totalDeliveryFee,
      totalOrdersCount: orders.length,
      completedOrdersCount,
      cancelledOrdersCount,
      averageOrderValue,
    };
  },

  // 2. Daily Sales Trend (for LineChart / BarChart)
  async getDailySalesTrend(range: ReportDateRange = "7days"): Promise<DailySalesPoint[]> {
    const allOrders = await orderService.getOrders();
    const orders = filterOrdersByRange(allOrders, range);

    // Group by YYYY-MM-DD
    const map = new Map<string, { revenue: number; orders: number; tax: number }>();

    for (const o of orders) {
      if (o.order_status === "CANCELLED") continue;

      const dateStr = o.created_at.slice(0, 10);
      const existing = map.get(dateStr) || { revenue: 0, orders: 0, tax: 0 };
      existing.revenue += o.grand_total;
      existing.orders += 1;
      existing.tax += o.tax_amount || 0;
      map.set(dateStr, existing);
    }

    // Sort by date ascending
    const sortedDates = Array.from(map.keys()).sort();

    // If empty or small, generate points for recent days
    if (sortedDates.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      return [
        {
          date: today,
          displayDate: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
            new Date(today)
          ),
          revenue: 0,
          orders: 0,
          tax: 0,
        },
      ];
    }

    return sortedDates.map((dateStr) => {
      const d = new Date(dateStr);
      const displayDate = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(d);
      const item = map.get(dateStr)!;

      return {
        date: dateStr,
        displayDate,
        revenue: item.revenue,
        orders: item.orders,
        tax: item.tax,
      };
    });
  },

  // 3. Top Selling Products
  async getTopSellingProducts(
    range: ReportDateRange = "30days",
    limit = 10
  ): Promise<TopSellingProduct[]> {
    const allOrders = await orderService.getOrders();
    const orders = filterOrdersByRange(allOrders, range);

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    let grandTotalItemsRevenue = 0;

    for (const o of orders) {
      if (o.order_status === "CANCELLED") continue;

      for (const item of o.items) {
        const sku = item.sku_snapshot || "SKU-GEN";
        const existing = productMap.get(sku) || {
          name: item.product_name_snapshot,
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += item.quantity;
        existing.revenue += item.line_total;
        grandTotalItemsRevenue += item.line_total;
        productMap.set(sku, existing);
      }
    }

    const items: TopSellingProduct[] = [];
    for (const [sku, data] of productMap.entries()) {
      const contributionPercent =
        grandTotalItemsRevenue > 0
          ? Math.round((data.revenue / grandTotalItemsRevenue) * 100)
          : 0;

      items.push({
        sku,
        name: data.name,
        quantitySold: data.quantity,
        totalRevenue: data.revenue,
        contributionPercent,
      });
    }

    items.sort((a, b) => b.quantitySold - a.quantitySold);
    return items.slice(0, limit);
  },

  // 4. Sales Channel Breakdown (POS vs Online)
  async getChannelBreakdown(range: ReportDateRange = "30days"): Promise<ChannelBreakdownPoint[]> {
    const allOrders = await orderService.getOrders();
    const orders = filterOrdersByRange(allOrders, range);

    let posRevenue = 0;
    let posCount = 0;
    let onlineRevenue = 0;
    let onlineCount = 0;
    let totalRevenue = 0;

    for (const o of orders) {
      if (o.order_status === "CANCELLED") continue;

      totalRevenue += o.grand_total;
      if (o.channel === "POS") {
        posRevenue += o.grand_total;
        posCount++;
      } else {
        onlineRevenue += o.grand_total;
        onlineCount++;
      }
    }

    const posPercent = totalRevenue > 0 ? Math.round((posRevenue / totalRevenue) * 100) : 50;
    const onlinePercent = totalRevenue > 0 ? 100 - posPercent : 50;

    return [
      {
        key: "POS",
        name: "Kasir POS Ditempat",
        revenue: posRevenue,
        ordersCount: posCount,
        percent: posPercent,
        color: "#10b981", // emerald
      },
      {
        key: "ONLINE",
        name: "Pemesanan Web Online",
        revenue: onlineRevenue,
        ordersCount: onlineCount,
        percent: onlinePercent,
        color: "#3b82f6", // blue
      },
    ];
  },

  // 5. Payment Method Breakdown (for PieChart)
  async getPaymentMethodBreakdown(
    range: ReportDateRange = "30days"
  ): Promise<PaymentMethodPoint[]> {
    const allPayments = await paymentService.getPayments();
    const payments = filterPaymentsByRange(allPayments, range);

    const methods: Record<string, { name: string; amount: number; count: number; color: string }> = {
      CASH: { name: "Tunai (Cash)", amount: 0, count: 0, color: "#10b981" },
      QRIS: { name: "QRIS", amount: 0, count: 0, color: "#3b82f6" },
      BANK_TRANSFER: { name: "Transfer Bank", amount: 0, count: 0, color: "#6366f1" },
      DEBIT_CARD: { name: "Kartu Debit / EDC", amount: 0, count: 0, color: "#8b5cf6" },
      CREDIT_CARD: { name: "Kartu Kredit", amount: 0, count: 0, color: "#ec4899" },
    };

    let totalAmount = 0;

    for (const p of payments) {
      if (p.status !== "PAID") continue;

      const m = methods[p.payment_method] || methods.CASH;
      m.amount += p.amount;
      m.count += 1;
      totalAmount += p.amount;
    }

    const result: PaymentMethodPoint[] = [];
    for (const [key, data] of Object.entries(methods)) {
      if (data.count > 0 || data.amount > 0) {
        const percent = totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0;
        result.push({
          method: key,
          name: data.name,
          amount: data.amount,
          transactionCount: data.count,
          percent,
          color: data.color,
        });
      }
    }

    return result.sort((a, b) => b.amount - a.amount);
  },

  // 6. Hourly Peak Sales Trends (08:00 to 22:00)
  async getHourlySalesTrend(range: ReportDateRange = "30days"): Promise<HourlySalesPoint[]> {
    const allOrders = await orderService.getOrders();
    const orders = filterOrdersByRange(allOrders, range);

    // Initialize hours from 08:00 to 21:00
    const hourMap = new Map<number, { orders: number; revenue: number }>();
    for (let h = 8; h <= 21; h++) {
      hourMap.set(h, { orders: 0, revenue: 0 });
    }

    for (const o of orders) {
      if (o.order_status === "CANCELLED") continue;

      const hour = new Date(o.created_at).getHours();
      const existing = hourMap.get(hour);
      if (existing) {
        existing.orders += 1;
        existing.revenue += o.grand_total;
      }
    }

    const points: HourlySalesPoint[] = [];
    for (let h = 8; h <= 21; h++) {
      const data = hourMap.get(h) || { orders: 0, revenue: 0 };
      const displayHour = `${h.toString().padStart(2, "0")}:00`;
      points.push({
        hour: displayHour,
        displayHour,
        ordersCount: data.orders,
        revenue: data.revenue,
      });
    }

    return points;
  },

  // 7. Generate CSV Data Export
  async generateCSV(range: ReportDateRange = "30days"): Promise<string> {
    const allOrders = await orderService.getOrders();
    const orders = filterOrdersByRange(allOrders, range);

    const headers = [
      "No. Pesanan",
      "Tanggal & Waktu",
      "Pelanggan",
      "Saluran",
      "Layanan",
      "Status",
      "Metode Pembayaran",
      "Subtotal (Rp)",
      "Pajak PB1 (Rp)",
      "Diskon (Rp)",
      "Biaya Antar (Rp)",
      "Grand Total (Rp)",
    ];

    const rows = orders.map((o) => [
      `"${o.order_number}"`,
      `"${new Date(o.created_at).toLocaleString("id-ID")}"`,
      `"${o.customer_name_snapshot}"`,
      `"${o.channel}"`,
      `"${o.service_type}"`,
      `"${o.order_status}"`,
      `"${o.payment?.payment_method || "-"}"`,
      o.subtotal,
      o.tax_amount,
      o.discount_amount,
      o.delivery_fee,
      o.grand_total,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  },
};
