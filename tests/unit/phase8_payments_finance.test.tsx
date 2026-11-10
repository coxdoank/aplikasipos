import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { paymentService } from "@/services/paymentService";
import { orderService } from "@/services/orderService";
import { PaymentsPage } from "@/modules/payments/pages/PaymentsPage";
import { PaymentVerifyModal } from "@/modules/payments/components/PaymentVerifyModal";
import { RefundModal } from "@/modules/payments/components/RefundModal";
import { FinancePage } from "@/modules/finance/pages/FinancePage";
import { CashSessionModal } from "@/modules/finance/components/CashSessionModal";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 8: Payments, Verification, Refunds, and Financial Cash Drawer", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    paymentService.resetDemoPayments();
    orderService.resetDemoOrders();

    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: "usr-admin-01", email: "admin@foodpos.local" },
      role: "ADMIN",
      permissions: [
        "payments.view",
        "payments.create",
        "payments.verify",
        "payments.refund.request",
        "payments.refund.approve",
        "cash_sessions.open",
        "cash_sessions.close",
        "orders.view",
        "orders.cancel",
      ],
      profile: {
        id: "usr-admin-01",
        fullName: "Ratna Sari (Manajer Resto)",
        email: "admin@foodpos.local",
      },
    });
  });

  describe("1. Payment Service Operations", () => {
    it("retrieves payments list with correct structure and amounts", async () => {
      const payments = await paymentService.getPayments();
      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0].order_number).toBeDefined();
      expect(payments[0].payment_method).toBeDefined();
      expect(payments[0].amount).toBeGreaterThan(0);
    });

    it("verifies manual transfer payment and advances linked order to PROCESSING", async () => {
      // Find pay-init-004 which is PENDING_VERIFICATION
      const pendingPayment = await paymentService.getPaymentById("pay-init-004");
      expect(pendingPayment).not.toBeNull();
      expect(pendingPayment?.status).toBe("PENDING_VERIFICATION");

      const res = await paymentService.verifyPayment(
        "pay-init-004",
        "Ratna Sari (Manajer Resto)"
      );

      expect(res.success).toBe(true);
      expect(res.payment?.status).toBe("PAID");
      expect(res.payment?.verified_by).toBe("Ratna Sari (Manajer Resto)");
      expect(res.payment?.verified_at).toBeDefined();

      // Check linked order advanced to PROCESSING
      const order = await orderService.getOrderById(pendingPayment!.order_id);
      expect(order?.order_status).toBe("PROCESSING");
    });

    it("rejects payment and cancels the associated order", async () => {
      const res = await paymentService.rejectPayment(
        "pay-init-004",
        "Ratna Sari (Manajer Resto)",
        "Bukti transfer tidak valid/palsu"
      );

      expect(res.success).toBe(true);
      expect(res.payment?.status).toBe("FAILED");
      expect(res.payment?.rejection_reason).toBe("Bukti transfer tidak valid/palsu");

      // Check linked order is cancelled
      const order = await orderService.getOrderById(res.payment!.order_id);
      expect(order?.order_status).toBe("CANCELLED");
    });

    it("rejects payment verification without reason", async () => {
      const res = await paymentService.rejectPayment(
        "pay-init-004",
        "Ratna Sari",
        "   "
      );
      expect(res.success).toBe(false);
      expect(res.message).toContain("Alasan penolakan bukti pembayaran wajib diisi");
    });

    it("creates a refund request with status PENDING and updates payment status", async () => {
      const res = await paymentService.requestRefund(
        "pay-init-001",
        126500,
        "Pelanggan membatalkan pesanan karena menunggu terlalu lama",
        { id: "usr-cashier-01", name: "Budi Santoso" }
      );

      expect(res.success).toBe(true);
      expect(res.refund?.status).toBe("PENDING");
      expect(res.refund?.refund_amount).toBe(126500);
      expect(res.refund?.requested_by_id).toBe("usr-cashier-01");

      const payment = await paymentService.getPaymentById("pay-init-001");
      expect(payment?.status).toBe("REFUND_PENDING");
    });

    it("enforces dual-custody: rejects refund approval if approver is the requester", async () => {
      // ref-init-001 was requested by 'usr-cashier-01'
      const res = await paymentService.approveRefund("ref-init-001", {
        id: "usr-cashier-01", // SAME PERSON!
        name: "Budi Santoso (Kasir)",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Keamanan Dual-Custody");
    });

    it("approves refund when approver is different from requester and updates payment to REFUNDED", async () => {
      // ref-init-001 requested by 'usr-cashier-01', approved by 'usr-admin-01'
      const res = await paymentService.approveRefund("ref-init-001", {
        id: "usr-admin-01", // DIFFERENT PERSON!
        name: "Ratna Sari (Manajer Resto)",
      });

      expect(res.success).toBe(true);
      expect(res.refund?.status).toBe("APPROVED");
      expect(res.refund?.approved_by_id).toBe("usr-admin-01");
      expect(res.refund?.refund_reference).toBeDefined();

      const payment = await paymentService.getPaymentById("pay-init-005");
      expect(payment?.status).toBe("REFUNDED");
    });

    it("rejects refund request and reverts payment status back to PAID", async () => {
      const res = await paymentService.rejectRefund(
        "ref-init-001",
        { id: "usr-admin-01", name: "Ratna Sari" },
        "Pesanan sudah terlanjur disajikan dan dinikmati tamu"
      );

      expect(res.success).toBe(true);
      expect(res.refund?.status).toBe("REJECTED");
      expect(res.refund?.rejected_reason).toContain("sudah terlanjur disajikan");

      const payment = await paymentService.getPaymentById("pay-init-005");
      expect(payment?.status).toBe("PAID");
    });
  });

  describe("2. Cash Drawer & Shift Sessions", () => {
    it("retrieves current active cash session", async () => {
      const active = await paymentService.getCurrentCashSession();
      expect(active).not.toBeNull();
      expect(active?.status).toBe("OPEN");
      expect(active?.opening_cash).toBe(200000);
    });

    it("prevents opening a new session when one is already active", async () => {
      const res = await paymentService.openCashSession(250000, {
        id: "usr-admin-01",
        name: "Ratna Sari",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("masih terbuka");
    });

    it("closes cash session and calculates discrepancies accurately", async () => {
      const active = await paymentService.getCurrentCashSession();
      expect(active).not.toBeNull();

      // Expected = 200.000 (modal) + 126.500 (sales) = 326.500
      // Actual counted = 328.500 (+2.000 surplus)
      const res = await paymentService.closeCashSession(
        active!.id,
        328500,
        { id: "usr-cashier-01", name: "Budi Santoso" },
        "Kelebihan Rp 2.000 pembulatan uang kembalian"
      );

      expect(res.success).toBe(true);
      expect(res.session?.status).toBe("CLOSED");
      expect(res.session?.expected_closing_cash).toBe(326500);
      expect(res.session?.actual_closing_cash).toBe(328500);
      expect(res.session?.discrepancy).toBe(2000);

      // Now no active session
      const current = await paymentService.getCurrentCashSession();
      expect(current).toBeNull();
    });

    it("records cash in and cash out transactions in active session", async () => {
      const active = await paymentService.getCurrentCashSession();
      expect(active).not.toBeNull();

      const txOut = await paymentService.addCashTransaction(
        active!.id,
        "CASH_OUT",
        20000,
        "Beli Es Batu Kristal 2 Pack",
        "Budi Santoso"
      );

      expect(txOut.success).toBe(true);
      expect(txOut.transaction?.transaction_type).toBe("CASH_OUT");
      expect(txOut.transaction?.amount).toBe(20000);

      const txs = await paymentService.getCashTransactions(active!.id);
      expect(txs.some((t) => t.reason === "Beli Es Batu Kristal 2 Pack")).toBe(true);
    });

    it("computes payment summary statistics correctly", async () => {
      const stats = await paymentService.getPaymentStats();
      expect(stats.totalPaymentsCount).toBeGreaterThan(0);
      expect(stats.totalPaidRevenue).toBeGreaterThan(0);
      expect(stats.pendingVerificationCount).toBeGreaterThanOrEqual(0);
      expect(stats.cashSalesAmount).toBeGreaterThan(0);
      expect(stats.nonCashSalesAmount).toBeGreaterThan(0);
    });
  });

  describe("3. PaymentsPage UI Component", () => {
    it("renders page title, summary cards, and tabs", async () => {
      render(
        <HashRouter>
          <PaymentsPage />
        </HashRouter>
      );

      expect(await screen.findByText("Manajemen Pembayaran & Transaksi")).toBeInTheDocument();
      expect(screen.getByText("Total Pendapatan Lunas")).toBeInTheDocument();
      expect(screen.getByText("Menunggu Verifikasi")).toBeInTheDocument();
      expect(screen.getByText("Pengajuan Refund Tertunda")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Semua Transaksi Pembayaran/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Verifikasi Transfer Bank/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Pengajuan Refund \(/ })).toBeInTheDocument();
    });

    it("switches to Verifikasi Transfer Bank tab and shows pending orders", async () => {
      render(
        <HashRouter>
          <PaymentsPage />
        </HashRouter>
      );

      await screen.findByText("Manajemen Pembayaran & Transaksi");

      const verifyTab = screen.getByText(/Verifikasi Transfer Bank/);
      fireEvent.click(verifyTab);

      await waitFor(() => {
        expect(screen.getByText(/Antrean Verifikasi Pembayaran/)).toBeInTheDocument();
        expect(screen.getByText("ORD-20261109-003")).toBeInTheDocument();
      });
    });

    it("filters transactions by search input", async () => {
      render(
        <HashRouter>
          <PaymentsPage />
        </HashRouter>
      );

      await screen.findByText("Manajemen Pembayaran & Transaksi");
      await screen.findByText("ORD-20261109-001");

      const searchInput = screen.getByPlaceholderText(/Cari no\. pesanan/);
      fireEvent.change(searchInput, { target: { value: "ORD-20261109-002" } });

      await waitFor(() => {
        expect(screen.getByText("ORD-20261109-002")).toBeInTheDocument();
        expect(screen.queryByText("ORD-20261109-001")).not.toBeInTheDocument();
      });
    });
  });

  describe("4. Payment Verification & Refund Modals", () => {
    it("renders PaymentVerifyModal with order info and handles verification", async () => {
      const payment = await paymentService.getPaymentById("pay-init-004");
      expect(payment).not.toBeNull();

      render(
        <PaymentVerifyModal
          payment={payment}
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      expect(screen.getByText("Verifikasi Bukti Pembayaran")).toBeInTheDocument();
      expect(screen.getByText(payment.order_number)).toBeInTheDocument();
      expect(screen.getByText(payment.customer_name)).toBeInTheDocument();
      expect(screen.getByText("Verifikasi & Terima Pembayaran")).toBeInTheDocument();
      expect(screen.getByText("Tolak Bukti")).toBeInTheDocument();
    });

    it("displays dual-custody warning and disables approval when reviewer is requester", async () => {
      // Simulate user as 'usr-cashier-01' who created ref-init-001
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: "usr-cashier-01", email: "cashier@foodpos.local" },
        role: "ADMIN", // even if role has permission
        permissions: ["payments.refund.approve"],
        profile: {
          id: "usr-cashier-01",
          fullName: "Budi Santoso",
          email: "cashier@foodpos.local",
        },
      });

      const refunds = await paymentService.getRefunds();
      const targetRefund = refunds[0]; // requested by usr-cashier-01

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
          existingRefund={targetRefund}
        />
      );

      // Dual-custody warning should be displayed
      expect(screen.getByText(/Aturan Keamanan Dual-Custody:/)).toBeInTheDocument();

      // Approve button must be disabled
      const approveBtn = screen.getByText("Setujui Pengembalian Dana").closest("button");
      expect(approveBtn).toBeDisabled();
    });
  });

  describe("5. FinancePage & CashSessionModal UI", () => {
    it("renders active shift banner, drawer KPI metrics, and shift table", async () => {
      render(
        <HashRouter>
          <FinancePage />
        </HashRouter>
      );

      expect(await screen.findByText(/Sesi Kasir & Manajemen Keuangan/)).toBeInTheDocument();
      expect(screen.getByText(/Shift Aktif/i)).toBeInTheDocument();
      expect(screen.getByText("Modal Kas Awal Shift")).toBeInTheDocument();
      expect(screen.getByText("Penjualan Kasir Tunai")).toBeInTheDocument();
      expect(screen.getByText("Estimasi Kas di Laci")).toBeInTheDocument();
      expect(screen.getByText(/Riwayat Shift Kasir/)).toBeInTheDocument();
    });

    it("renders CashSessionModal in closing mode with live discrepancy feedback", async () => {
      const activeSession = await paymentService.getCurrentCashSession();
      expect(activeSession).not.toBeNull();

      render(
        <CashSessionModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
          activeSession={activeSession}
        />
      );

      expect(screen.getByText("Tutup Shift Kasir (Closing)")).toBeInTheDocument();
      expect(screen.getByText("Ekspektasi Kas di Laci")).toBeInTheDocument();
      expect(screen.getByText(/Status Selisih Kas:/)).toBeInTheDocument();
    });
  });
});
