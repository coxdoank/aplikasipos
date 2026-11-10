import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { auditService } from "@/services/auditService";
import { notificationService } from "@/services/notificationService";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { AuditLogsPage } from "@/modules/audit/pages/AuditLogsPage";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 12: Audit Logs, Security & Notifications", () => {
  beforeEach(async () => {
    localStorage.clear();
    await auditService.clearAuditLogs();
    await notificationService.clearNotifications();

    useAuthStore.setState({
      user: {
        id: "owner-001",
        email: "owner@foodpos.local",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
      profile: {
        id: "owner-001",
        fullName: "Owner Utama",
        phone: "08111111111",
      },
      role: "OWNER",
      permissions: ["audit.view", "settings.manage", "reports.view", "orders.view"],
      outlet: {
        id: "e0000000-0000-0000-0000-000000000001",
        code: "JKT-01",
        name: "FOODPOS Outlet Pusat Senopati",
      },
      isAuthenticated: true,
      isLoading: false,
      errorMessage: null,
    });
  });

  describe("1. auditService Security & Compliance Logic", () => {
    it("logs audit entry and automatically sanitizes sensitive fields", async () => {
      const logged = await auditService.logAudit({
        actor_email: "admin@foodpos.local",
        actor_name: "Siti Admin",
        action: "AUTH_LOGIN",
        entity_type: "auth",
        details: {
          username: "siti_admin",
          password: "mySecretPassword123!",
          user_token: "jwt-token-999-secret",
          nested: {
            apiKey: "super-secret-key",
            outlet_name: "Senopati",
          },
        },
      });

      expect(logged.action).toBe("AUTH_LOGIN");
      expect(logged.actor_email).toBe("admin@foodpos.local");
      // Verify sensitive information is masked
      expect(logged.details.password).toContain("TERLINDUNGI");
      expect(logged.details.user_token).toContain("TERLINDUNGI");
      expect((logged.details.nested as Record<string, unknown>).apiKey).toContain("TERLINDUNGI");
      expect((logged.details.nested as Record<string, unknown>).outlet_name).toBe("Senopati");
    });

    it("fetches audit logs and calculates correct audit statistics", async () => {
      await auditService.logAudit({
        action: "ORDER_CREATE",
        entity_type: "orders",
        details: { order_number: "ORD-001" },
      });
      await auditService.logAudit({
        action: "STOCK_ADJUSTMENT",
        entity_type: "stock_movements",
        details: { sku: "FOOD-001" },
      });
      await auditService.logAudit({
        action: "AUTH_LOGIN",
        entity_type: "auth",
        details: { user: "owner" },
      });

      const logs = await auditService.getAuditLogs();
      expect(logs.length).toBe(3);

      const stats = await auditService.getAuditStats();
      expect(stats.totalLogs).toBe(3);
      expect(stats.financialActionsCount).toBe(1);
      expect(stats.catalogStockActionsCount).toBe(1);
      expect(stats.authSecurityActionsCount).toBe(1);
    });

    it("filters audit logs by action, entity_type, and search keyword", async () => {
      await auditService.logAudit({
        actor_email: "cashier@foodpos.local",
        action: "CASH_SESSION_OPEN",
        entity_type: "cash_sessions",
        details: { shift: "Pagi" },
      });
      await auditService.logAudit({
        actor_email: "admin@foodpos.local",
        action: "STOCK_ADJUSTMENT",
        entity_type: "stock_movements",
        details: { reason: "Barang rusak" },
      });

      const filterByAction = await auditService.getAuditLogs({ action: "CASH_SESSION_OPEN" });
      expect(filterByAction.length).toBe(1);
      expect(filterByAction[0].action).toBe("CASH_SESSION_OPEN");

      const filterBySearch = await auditService.getAuditLogs({ search: "admin@foodpos" });
      expect(filterBySearch.length).toBe(1);
      expect(filterBySearch[0].actor_email).toBe("admin@foodpos.local");
    });

    it("generates CSV export compliant format from audit trail", async () => {
      await auditService.logAudit({
        actor_email: "owner@foodpos.local",
        actor_name: "Owner Utama",
        action: "SETTINGS_UPDATE",
        entity_type: "store_settings",
        details: { field: "tax_rate" },
      });

      const logs = await auditService.getAuditLogs();
      const csv = auditService.generateAuditCSV(logs);

      expect(csv).toContain("Waktu (ISO),Aksi,Aktor,Email Aktor,Entitas,Entity ID,Alamat IP,Rincian Metadata");
      expect(csv).toContain("SETTINGS_UPDATE");
      expect(csv).toContain("Owner Utama");
      expect(csv).toContain("store_settings");
    });
  });

  describe("2. notificationService Business Logic", () => {
    it("adds notification, counts unread items, and marks items as read", async () => {
      await notificationService.addNotification({
        title: "Pesanan Baru",
        message: "Pesanan #ORD-001 telah diterima",
        type: "ORDER_NEW",
      });
      await notificationService.addNotification({
        title: "Stok Menipis",
        message: "Stok tinggal 3 porsi",
        type: "STOCK_LOW",
      });

      let unread = await notificationService.getUnreadCount();
      expect(unread).toBe(2);

      const items = await notificationService.getNotifications();
      expect(items.length).toBe(2);

      const marked = await notificationService.markAsRead(items[0].id);
      expect(marked).toBe(true);

      unread = await notificationService.getUnreadCount();
      expect(unread).toBe(1);

      await notificationService.markAllAsRead();
      unread = await notificationService.getUnreadCount();
      expect(unread).toBe(0);
    });
  });

  describe("3. NotificationBell UI Component", () => {
    it("renders bell icon, opens dropdown with notifications, and marks all as read", async () => {
      await notificationService.addNotification({
        title: "Pesanan Online Masuk",
        message: "Pesanan #ORD-099 butuh konfirmasi",
        type: "ORDER_NEW",
      });

      render(
        <HashRouter>
          <NotificationBell />
        </HashRouter>
      );

      // Wait for notifications to load asynchronously
      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });

      const bellBtn = screen.getByRole("button", { name: /Notifikasi/i });
      expect(bellBtn).toBeInTheDocument();

      // Open popover
      fireEvent.click(bellBtn);

      expect(screen.getByText("Pusat Notifikasi")).toBeInTheDocument();
      expect(screen.getByText("Pesanan Online Masuk")).toBeInTheDocument();
      expect(screen.getByText("Pesanan #ORD-099 butuh konfirmasi")).toBeInTheDocument();

      // Click 'Tandai Semua'
      const markAllBtn = screen.getByRole("button", { name: /Tandai Semua/i });
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(screen.queryByText("1")).not.toBeInTheDocument();
      });
    });
  });

  describe("4. AuditLogsPage UI Component", () => {
    it("renders page header, 4 stats cards, and table of audit logs", async () => {
      await auditService.logAudit({
        actor_name: "Budi Kasir",
        actor_email: "budi@foodpos.local",
        action: "PAYMENT_VERIFIED",
        entity_type: "order_payments",
        entity_id: "pay-123",
        details: { amount: 50000, method: "QRIS" },
      });

      render(
        <HashRouter>
          <AuditLogsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Log Audit & Keamanan Sistem")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getAllByText("PAYMENT_VERIFIED").length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Total Aktivitas")).toBeInTheDocument();
      expect(screen.getByText("Aksi Finansial & Kasir")).toBeInTheDocument();
      expect(screen.getByText("Budi Kasir")).toBeInTheDocument();
      expect(screen.getAllByText("order_payments").length).toBeGreaterThan(0);
    });

    it("opens JSON inspection modal on clicking Inspeksi and closes it", async () => {
      await auditService.logAudit({
        actor_name: "Siti Admin",
        actor_email: "siti@foodpos.local",
        action: "STOCK_ADJUSTMENT",
        entity_type: "stock_movements",
        details: { sku: "FOOD-002", previous_stock: 40, new_stock: 45 },
      });

      render(
        <HashRouter>
          <AuditLogsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("STOCK_ADJUSTMENT")).toBeInTheDocument();
      });

      const inspectBtn = screen.getByRole("button", { name: /Inspeksi/i });
      fireEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByText(/Inspeksi Log Audit: STOCK_ADJUSTMENT/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Keamanan Privasi:/i)).toBeInTheDocument();
      expect(screen.getByText(/Salin JSON/i)).toBeInTheDocument();

      // Close modal using specific exact name
      const closeBtn = screen.getByRole("button", { name: /^Tutup$/i });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Inspeksi Log Audit: STOCK_ADJUSTMENT/i)).not.toBeInTheDocument();
      });
    });
  });
});
