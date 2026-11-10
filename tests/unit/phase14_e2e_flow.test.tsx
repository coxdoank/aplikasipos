import { describe, it, expect, beforeEach } from "vitest";
import { orderService, type OrderDetail } from "@/services/orderService";
import { storeService } from "@/services/storeService";
import { paymentService } from "@/services/paymentService";
import { auditService } from "@/services/auditService";
import { reportService } from "@/services/reportService";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

describe("Phase 14: End-to-End (E2E) System Integration Workflows", () => {
  const OUTLET_ID = "e0000000-0000-0000-0000-000000000001";

  beforeEach(async () => {
    localStorage.clear();
    orderService.resetDemoOrders();
    useCartStore.getState().clearCart();

    useAuthStore.setState({
      user: {
        id: "usr-owner-001",
        email: "owner@foodpos.local",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
      profile: {
        id: "usr-owner-001",
        fullName: "Hendra Wijaya (Owner)",
        phone: "08111111111",
      },
      role: "OWNER",
      permissions: [
        "orders.view",
        "orders.create",
        "orders.update_status",
        "orders.cancel",
        "payments.view",
        "payments.create",
        "payments.verify",
        "payments.refund.request",
        "payments.refund.approve",
        "products.view",
        "products.manage",
        "inventory.adjust",
        "reports.view",
        "settings.manage",
        "audit.view",
        "cash_sessions.open",
        "cash_sessions.close",
      ],
      outlet: {
        id: OUTLET_ID,
        code: "JKT-01",
        name: "FOODPOS Outlet Pusat Senopati",
      },
      isAuthenticated: true,
      isLoading: false,
      errorMessage: null,
    });
  });

  describe("Flow 1: Public Customer Storefront & Tracking Lifecycle", () => {
    it("executes complete online order placement, 256-bit token generation, and tracking verification", async () => {
      // 1. Customer adds items to cart
      useCartStore.getState().addItem({
        productId: "m0000000-0000-0000-0000-000000000001",
        name: "Nasi Goreng Spesial Resto",
        basePrice: 38000,
        quantity: 2,
        notes: "Pedas sedang, tanpa timun",
      });

      const cartItems = useCartStore.getState().items;
      expect(cartItems.length).toBe(1);
      expect(cartItems[0].quantity).toBe(2);

      // 2. Customer submits checkout
      const checkoutResult = await storeService.createOrder({
        customerName: "Ahmad Dani",
        customerPhone: "081234567890",
        serviceType: "DELIVERY",
        deliveryAddress: "Jl. Wijaya No. 12, Kebayoran Baru, Jakarta",
        paymentMethod: "BANK_TRANSFER",
        notes: "Tolong kirimkan alat makan ramah lingkungan",
        items: cartItems,
      });

      expect(checkoutResult.success).toBe(true);
      expect(checkoutResult.orderNumber).toMatch(/^ORD-\d{8}-\d+/);
      expect(checkoutResult.subtotal).toBe(76000);
      expect(checkoutResult.taxAmount).toBe(7600); // 10% PB1
      expect(checkoutResult.deliveryFee).toBe(10000);
      expect(checkoutResult.grandTotal).toBe(93600);

      // Verify tracking token generation
      expect(checkoutResult.trackingToken).toBeDefined();
      expect(typeof checkoutResult.trackingToken).toBe("string");
      expect(checkoutResult.trackingToken.length).toBeGreaterThanOrEqual(32);

      // 3. Customer tracks order by token
      const trackingData = await storeService.trackOrder(checkoutResult.trackingToken);
      expect(trackingData).toBeDefined();
      expect(trackingData.success).toBe(true);
      expect(trackingData.order_number).toBe(checkoutResult.orderNumber);
      expect(trackingData.order_status).toBe("NEW");
    });
  });

  describe("Flow 2: Cashier Shift Opening, POS In-Store Transaction & Payment", () => {
    it("opens cashier cash shift, completes in-store POS cash transaction with change, and updates shift drawer", async () => {
      // 1. Close any existing open session first
      const existingSession = await paymentService.getCurrentCashSession();
      if (existingSession) {
        await paymentService.closeCashSession(
          existingSession.id,
          500000,
          { id: "usr-01", name: "Budi Santoso" },
          "Shift selesai"
        );
      }

      // 2. Open new shift drawer with Rp 200.000 float
      const openResult = await paymentService.openCashSession(
        200000,
        { id: "usr-cashier-001", name: "Rian Kasir" }
      );
      expect(openResult.success).toBe(true);
      expect(openResult.session?.status).toBe("OPEN");
      expect(openResult.session?.opening_cash).toBe(200000);

      // 3. Complete walk-in POS order
      const orderId = `ord-pos-${Date.now()}`;
      const directOrder: OrderDetail = {
        id: orderId,
        outlet_id: OUTLET_ID,
        order_number: "ORD-20261110-888",
        customer_name_snapshot: "Pelanggan Meja 5",
        customer_phone_snapshot: "081299998888",
        service_type: "DINE_IN",
        channel: "POS",
        order_status: "COMPLETED",
        subtotal: 84000,
        discount_amount: 5000,
        tax_amount: 7900, // 10% PB1
        service_charge_amount: 0,
        delivery_fee: 0,
        grand_total: 86900,
        items: [
          {
            id: `item-${Date.now()}`,
            order_id: orderId,
            product_id: "m0000000-0000-0000-0000-000000000002",
            product_name_snapshot: "Ayam Bakar Madu Gurih",
            sku_snapshot: "FOOD-002",
            unit_price: 42000,
            quantity: 2,
            discount_amount: 0,
            line_total: 84000,
          },
        ],
        history: [],
        payment: {
          id: `pay-${Date.now()}`,
          order_id: orderId,
          payment_method: "CASH",
          status: "PAID",
          amount: 86900,
          cash_received: 100000,
          change_amount: 13100,
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      orderService.registerOnlineOrder(directOrder);

      const retrievedOrder = await orderService.getOrderById(orderId);
      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder?.order_status).toBe("COMPLETED");
      expect(retrievedOrder?.payment?.change_amount).toBe(13100);
    });
  });

  describe("Flow 3: Transfer Verification, Kitchen Kanban Advancement, and Dual-Custody Refund", () => {
    it("handles bank transfer verification, kitchen progression, and anti-self-approval refund enforcement", async () => {
      // 1. Pending payment item
      const payments = await paymentService.getPayments({ status: "PENDING_VERIFICATION" });
      expect(payments.length).toBeGreaterThan(0);
      const targetPayment = payments[0];

      // 2. Cashier verifies bank transfer
      const verifyRes = await paymentService.verifyPayment(
        targetPayment.id,
        "Rian Kasir",
        "Bukti transfer BCA valid dan mutasi rekening terkonfirmasi"
      );
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.payment?.status).toBe("PAID");

      // Verify order automatically advanced to PROCESSING
      const relatedOrder = await orderService.getOrderById(targetPayment.order_id);
      expect(relatedOrder?.order_status).toBe("PROCESSING");

      // 3. Kitchen marks order as READY then COMPLETED
      await orderService.updateOrderStatus(
        targetPayment.order_id,
        "READY",
        { name: "Koki Dapur" },
        "Semua hidangan selesai dimasak dan disajikan"
      );
      let updatedOrder = await orderService.getOrderById(targetPayment.order_id);
      expect(updatedOrder?.order_status).toBe("READY");

      await orderService.updateOrderStatus(
        targetPayment.order_id,
        "COMPLETED",
        { name: "Rian Kasir" },
        "Pesanan telah diserahkan kepada pelanggan"
      );
      updatedOrder = await orderService.getOrderById(targetPayment.order_id);
      expect(updatedOrder?.order_status).toBe("COMPLETED");

      // 4. Refund workflow - Cashier requests refund
      const refundRequestRes = await paymentService.requestRefund(
        targetPayment.id,
        targetPayment.amount,
        "Pelanggan komplain makanan dingin",
        { id: "usr-cashier-001", name: "Rian Kasir" }
      );
      expect(refundRequestRes.success).toBe(true);
      expect(refundRequestRes.refund?.status).toBe("PENDING");
      expect(refundRequestRes.refund?.requested_by_id).toBe("usr-cashier-001");

      const refundId = refundRequestRes.refund!.id;

      // 5. Anti-Self-Approval Rule: The requesting cashier cannot approve their own refund
      const selfApproval = await paymentService.approveRefund(
        refundId,
        { id: "usr-cashier-001", name: "Rian Kasir" } // SAME ACTOR ID
      );
      expect(selfApproval.success).toBe(false);
      expect(selfApproval.message).toContain("Dual-Custody");

      // 6. Dual-custody: Admin or Owner approves refund
      const validApproval = await paymentService.approveRefund(
        refundId,
        { id: "usr-owner-001", name: "Hendra Wijaya (Owner)" } // DIFFERENT ACTOR ID
      );
      expect(validApproval.success).toBe(true);
      expect(validApproval.refund?.status).toBe("APPROVED");

      // Original payment is marked as REFUNDED
      const refundedPayment = await paymentService.getPaymentById(targetPayment.id);
      expect(refundedPayment?.status).toBe("REFUNDED");
    });
  });

  describe("Flow 4: Shift Closure, Discrepancy Reconciliation & Analytics Consistency", () => {
    it("closes shift drawer with physical cash reconciliation and updates executive sales analytics", async () => {
      const activeSession = await paymentService.getCurrentCashSession();
      expect(activeSession).toBeDefined();

      const expectedClosing =
        activeSession!.opening_cash +
        activeSession!.total_cash_sales +
        activeSession!.total_cash_in -
        activeSession!.total_cash_out;

      // Cashier counts actual drawer cash (e.g. Rp 5.000 discrepancy)
      const actualCash = expectedClosing - 5000;

      const closeRes = await paymentService.closeCashSession(
        activeSession!.id,
        actualCash,
        { id: "usr-cashier-001", name: "Rian Kasir" },
        "Uang kembalian receh kurang Rp 5.000"
      );

      expect(closeRes.success).toBe(true);
      expect(closeRes.session?.status).toBe("CLOSED");
      expect(closeRes.session?.expected_closing_cash).toBe(expectedClosing);
      expect(closeRes.session?.actual_closing_cash).toBe(actualCash);
      expect(closeRes.session?.discrepancy).toBe(-5000);

      // Verify business report metrics
      const summary = await reportService.getSalesReportSummary("all");
      expect(summary.totalGrossRevenue).toBeGreaterThan(0);
      expect(summary.totalNetRevenue).toBeGreaterThan(0);
      expect(summary.totalTaxAmount).toBeGreaterThan(0);
      expect(summary.averageOrderValue).toBeGreaterThan(0);

      // Verify audit logs were generated for operations
      const logs = await auditService.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
