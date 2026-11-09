import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { orderService } from "@/services/orderService";
import { OrdersPage } from "@/modules/orders/pages/OrdersPage";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 4: Order Management & Kanban Logic", () => {
  beforeEach(() => {
    orderService.resetDemoOrders();
    // Default logged in as Owner with all permissions
    useAuthStore.setState({
      role: "OWNER",
      permissions: [
        "orders.view",
        "orders.create",
        "orders.update_status",
        "orders.cancel",
      ],
      profile: {
        id: "usr-owner-001",
        fullName: "Hendra Wijaya (Pemilik)",
        email: "owner@foodpos.local",
      },
    });
  });

  describe("1. Order State Machine & Validation", () => {
    it("validates standard forward transitions: NEW -> PROCESSING -> READY -> COMPLETED", () => {
      expect(orderService.isValidTransition("NEW", "PROCESSING")).toBe(true);
      expect(orderService.isValidTransition("PROCESSING", "READY")).toBe(true);
      expect(orderService.isValidTransition("READY", "COMPLETED")).toBe(true);
    });

    it("rejects illegal skips in forward workflow", () => {
      expect(orderService.isValidTransition("NEW", "READY")).toBe(false);
      expect(orderService.isValidTransition("NEW", "COMPLETED")).toBe(false);
      expect(orderService.isValidTransition("PROCESSING", "COMPLETED")).toBe(false);
    });

    it("permits cancellation from any non-terminal state", () => {
      expect(orderService.isValidTransition("NEW", "CANCELLED")).toBe(true);
      expect(orderService.isValidTransition("PROCESSING", "CANCELLED")).toBe(true);
      expect(orderService.isValidTransition("READY", "CANCELLED")).toBe(true);
      expect(orderService.canCancelOrder("NEW")).toBe(true);
      expect(orderService.canCancelOrder("PROCESSING")).toBe(true);
      expect(orderService.canCancelOrder("READY")).toBe(true);
    });

    it("strictly prevents transitions from terminal states (COMPLETED / CANCELLED)", () => {
      expect(orderService.isValidTransition("COMPLETED", "PROCESSING")).toBe(false);
      expect(orderService.isValidTransition("COMPLETED", "CANCELLED")).toBe(false);
      expect(orderService.canCancelOrder("COMPLETED")).toBe(false);

      expect(orderService.isValidTransition("CANCELLED", "NEW")).toBe(false);
      expect(orderService.isValidTransition("CANCELLED", "PROCESSING")).toBe(false);
      expect(orderService.canCancelOrder("CANCELLED")).toBe(false);
    });
  });

  describe("2. Order Service Operations", () => {
    it("fetches orders and filters by status correctly", async () => {
      const allOrders = await orderService.getOrders();
      expect(allOrders.length).toBeGreaterThan(0);

      const processingOrders = await orderService.getOrders({ status: "PROCESSING" });
      expect(processingOrders.every((o) => o.order_status === "PROCESSING")).toBe(true);
    });

    it("filters orders by channel and service type", async () => {
      const onlineOrders = await orderService.getOrders({ channel: "ONLINE" });
      expect(onlineOrders.every((o) => o.channel === "ONLINE")).toBe(true);

      const deliveryOrders = await orderService.getOrders({ serviceType: "DELIVERY" });
      expect(deliveryOrders.every((o) => o.service_type === "DELIVERY")).toBe(true);
    });

    it("searches orders by customer name or order number", async () => {
      const searchByName = await orderService.getOrders({ search: "Budi Santoso" });
      expect(searchByName.length).toBeGreaterThan(0);
      expect(searchByName[0].customer_name_snapshot).toContain("Budi");

      const searchByNumber = await orderService.getOrders({ search: "ORD-20261109-001" });
      expect(searchByNumber.length).toBe(1);
      expect(searchByNumber[0].order_number).toBe("ORD-20261109-001");
    });

    it("advances order status and records status history entry", async () => {
      // ORD-20261109-003 is NEW
      const res = await orderService.updateOrderStatus(
        "ORD-20261109-003",
        "PROCESSING",
        { id: "usr-01", name: "Chef Juna" }
      );

      expect(res.success).toBe(true);
      expect(res.order?.order_status).toBe("PROCESSING");

      const updated = await orderService.getOrderById("ORD-20261109-003");
      expect(updated?.order_status).toBe("PROCESSING");
      const latestHistory = updated?.history[updated.history.length - 1];
      expect(latestHistory?.new_status).toBe("PROCESSING");
      expect(latestHistory?.actor_name).toBe("Chef Juna");
    });

    it("cancels order with mandatory reason and logs history", async () => {
      // ORD-20261109-006 is NEW
      const res = await orderService.cancelOrder(
        "ORD-20261109-006",
        "Pelanggan membatalkan pesanan lewat telepon",
        { id: "usr-01", name: "Admin Resto" }
      );

      expect(res.success).toBe(true);
      expect(res.order?.order_status).toBe("CANCELLED");

      const updated = await orderService.getOrderById("ORD-20261109-006");
      expect(updated?.order_status).toBe("CANCELLED");
      const latestHistory = updated?.history[updated.history.length - 1];
      expect(latestHistory?.new_status).toBe("CANCELLED");
      expect(latestHistory?.reason).toBe("Pelanggan membatalkan pesanan lewat telepon");
    });

    it("rejects cancellation without reason", async () => {
      const res = await orderService.cancelOrder("ORD-20261109-001", "   ", {
        name: "Admin",
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain("wajib diisi");
    });

    it("calculates summary statistics accurately", async () => {
      const summary = await orderService.getOrdersSummary();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.total).toBe(
        summary.newCount +
        summary.processingCount +
        summary.readyCount +
        summary.completedCount +
        summary.cancelledCount
      );
      expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe("3. OrdersPage UI & Component Integration", () => {
    it("renders page header and metric summary cards", async () => {
      render(
        <HashRouter>
          <OrdersPage />
        </HashRouter>
      );

      expect(screen.getByText("Manajemen Pesanan")).toBeDefined();
      expect(screen.getByText("Semua Pesanan")).toBeDefined();
      expect(screen.getAllByText("Sedang Dimasak").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Siap Saji / Kirim").length).toBeGreaterThan(0);
    });

    it("switches between Kanban View and Table View", async () => {
      render(
        <HashRouter>
          <OrdersPage />
        </HashRouter>
      );

      // Default is Kanban view
      await waitFor(() => {
        expect(screen.getAllByText("Pesanan Baru").length).toBeGreaterThan(0);
      });

      // Switch to Table view
      const tableButton = screen.getByRole("button", { name: /Tabel/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        expect(screen.getByText("Saluran & Layanan")).toBeDefined();
        expect(screen.getByText("Total Tagihan")).toBeDefined();
      });
    });

    it("opens Order Detail Modal upon clicking Detail", async () => {
      render(
        <HashRouter>
          <OrdersPage />
        </HashRouter>
      );

      // Wait for orders to load in Kanban
      await waitFor(() => {
        expect(screen.getAllByText(/Detail/i).length).toBeGreaterThan(0);
      });

      const detailButtons = screen.getAllByText(/Detail/i);
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Informasi Pelanggan/i)).toBeDefined();
        expect(screen.getByText(/Daftar Menu Pesanan/i)).toBeDefined();
        expect(screen.getByText(/Riwayat Perjalanan Pesanan/i)).toBeDefined();
      });
    });

    it("disables cancellation when user lacks orders.cancel permission", async () => {
      // Set role to Cashier who lacks orders.cancel
      useAuthStore.setState({
        role: "CASHIER",
        permissions: ["orders.view", "orders.create", "orders.update_status"],
        profile: {
          id: "usr-cashier",
          fullName: "Budi Kasir",
          email: "cashier@foodpos.local",
        },
      });

      render(
        <HashRouter>
          <OrdersPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Detail/i).length).toBeGreaterThan(0);
      });

      const detailButtons = screen.getAllByText(/Detail/i);
      fireEvent.click(detailButtons[0]);

      // Open cancel dialog from detail modal if available
      await waitFor(() => {
        const cancelBtn = screen.queryByText(/Batalkan Pesanan/i);
        if (cancelBtn) {
          fireEvent.click(cancelBtn);
          expect(screen.getByText(/Akses Dibatasi/i)).toBeDefined();
        }
      });
    });
  });
});
