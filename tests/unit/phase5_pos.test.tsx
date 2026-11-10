import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { usePosStore, calculatePosUnitPrice, generatePosItemId } from "@/stores/posStore";
import { PosPage } from "@/modules/pos/pages/PosPage";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 5: Point of Sale (POS) Cashier Interface", () => {
  beforeEach(() => {
    usePosStore.getState().clearCart();
    usePosStore.setState({ parkedCarts: [] });
    orderService.resetDemoOrders();

    useAuthStore.setState({
      role: "CASHIER",
      permissions: ["orders.view", "orders.create", "orders.update_status"],
      profile: {
        id: "usr-cashier-01",
        fullName: "Budi Santoso (Kasir Shift 1)",
        email: "cashier@foodpos.local",
      },
    });
  });

  describe("1. POS Store & Calculation Logic", () => {
    it("calculates unit price accurately with variant adjustments and add-ons", () => {
      const basePrice = 30000;
      const variant = { id: "v1", name: "Jumbo", priceAdjustment: 5000 };
      const addons = [
        { id: "a1", name: "Telur Mata Sapi", price: 5000 },
        { id: "a2", name: "Ekstra Sambal", price: 3000 },
      ];

      const unitPrice = calculatePosUnitPrice(basePrice, variant, addons);
      expect(unitPrice).toBe(43000); // 30000 + 5000 + 5000 + 3000
    });

    it("generates deterministic composite IDs for line items", () => {
      const id1 = generatePosItemId("prod-1", "var-1", [{ id: "a2", name: "Addon 2", price: 2000 }, { id: "a1", name: "Addon 1", price: 1000 }]);
      const id2 = generatePosItemId("prod-1", "var-1", [{ id: "a1", name: "Addon 1", price: 1000 }, { id: "a2", name: "Addon 2", price: 2000 }]);
      expect(id1).toBe(id2);
    });

    it("adds items to cart and computes subtotal correctly", () => {
      const { addItem, getSubtotal, getTotalItemsCount } = usePosStore.getState();

      addItem({
        productId: "prod-ayam",
        sku: "AYM-01",
        name: "Ayam Goreng Lengkuas",
        basePrice: 35000,
        variant: null,
        addons: [],
        quantity: 2,
        itemNotes: "",
      });

      expect(getSubtotal()).toBe(70000);
      expect(getTotalItemsCount()).toBe(2);
    });

    it("increments quantity for existing identical items", () => {
      const { addItem } = usePosStore.getState();

      addItem({
        productId: "prod-es-teh",
        sku: "MNM-01",
        name: "Es Teh Manis",
        basePrice: 6000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "Sedikit gula",
      });

      addItem({
        productId: "prod-es-teh",
        sku: "MNM-01",
        name: "Es Teh Manis",
        basePrice: 6000,
        variant: null,
        addons: [],
        quantity: 2,
        itemNotes: "Sedikit gula",
      });

      const currentItems = usePosStore.getState().items;
      expect(currentItems.length).toBe(1);
      expect(currentItems[0].quantity).toBe(3);
    });

    it("calculates percentage discount, PB1 tax (10%), and grand total", () => {
      const { addItem, setDiscount, getSubtotal, getDiscountAmount, getTaxAmount, getGrandTotal } = usePosStore.getState();

      addItem({
        productId: "p1",
        sku: "SKU-1",
        name: "Paket Nasi Timbel",
        basePrice: 100000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
      });

      expect(getSubtotal()).toBe(100000);

      // Apply 10% discount
      setDiscount("PERCENTAGE", 10);
      expect(getDiscountAmount()).toBe(10000); // 10% of 100.000

      // Taxable subtotal is 90.000. PB1 10% is 9.000
      expect(getTaxAmount()).toBe(9000);

      // Grand total = 90.000 + 9.000 = 99.000
      expect(getGrandTotal()).toBe(99000);
    });

    it("calculates fixed nominal discount (Rp)", () => {
      const { addItem, setDiscount, getDiscountAmount, getTaxAmount, getGrandTotal } = usePosStore.getState();

      addItem({
        productId: "p1",
        sku: "SKU-1",
        name: "Steak Sapi",
        basePrice: 80000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
      });

      setDiscount("FIXED", 20000);
      expect(getDiscountAmount()).toBe(20000);

      // Taxable = 60.000, PB1 = 6.000, Grand Total = 66.000
      expect(getTaxAmount()).toBe(6000);
      expect(getGrandTotal()).toBe(66000);
    });
  });

  describe("2. Hold & Resume (Parked Bills) Workflow", () => {
    it("holds current cart and resets active cashier workspace", () => {
      const { addItem, holdCurrentCart } = usePosStore.getState();

      addItem({
        productId: "p-hold",
        sku: "HLD-01",
        name: "Iga Bakar",
        basePrice: 65000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
      });

      const held = holdCurrentCart();
      expect(held).toBe(true);

      const state = usePosStore.getState();
      expect(state.items.length).toBe(0);
      expect(state.parkedCarts.length).toBe(1);
      expect(state.parkedCarts[0].items[0].name).toBe("Iga Bakar");
    });

    it("resumes parked cart into active cashier workspace", () => {
      const { addItem, holdCurrentCart, resumeParkedCart } = usePosStore.getState();

      addItem({
        productId: "p-hold",
        sku: "HLD-01",
        name: "Iga Bakar",
        basePrice: 65000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
      });

      holdCurrentCart();
      const parkedId = usePosStore.getState().parkedCarts[0].id;

      resumeParkedCart(parkedId);
      const state = usePosStore.getState();
      expect(state.items.length).toBe(1);
      expect(state.items[0].name).toBe("Iga Bakar");
      expect(state.parkedCarts.length).toBe(0);
    });

    it("deletes a parked cart", () => {
      const { addItem, holdCurrentCart, deleteParkedCart } = usePosStore.getState();

      addItem({
        productId: "p-temp",
        sku: "TMP-01",
        name: "Kopi Hitam",
        basePrice: 15000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
      });

      holdCurrentCart();
      const parkedId = usePosStore.getState().parkedCarts[0].id;

      deleteParkedCart(parkedId);
      expect(usePosStore.getState().parkedCarts.length).toBe(0);
    });
  });

  describe("3. POS Cashier UI & Checkout Modal", () => {
    it("renders POS interface with operator bar, category tabs, and search", async () => {
      render(
        <HashRouter>
          <PosPage />
        </HashRouter>
      );

      expect(screen.getByText(/Sesi Kasir Aktif:/i)).toBeDefined();
      expect(screen.getByText("Semua Menu")).toBeDefined();
      expect(screen.getByPlaceholderText(/Cari menu atau SKU.../i)).toBeDefined();
      expect(screen.getByText(/Keranjang Kasir Kosong/i)).toBeDefined();
    });

    it("adds item to POS cart and updates bottom totals", async () => {
      // Add item to store before render
      usePosStore.getState().addItem({
        productId: "test-nasi",
        sku: "NAS-01",
        name: "Nasi Liwet Solo",
        basePrice: 25000,
        variant: null,
        addons: [],
        quantity: 2,
        itemNotes: "",
      });

      render(
        <HashRouter>
          <PosPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Nasi Liwet Solo")).toBeDefined();
        expect(screen.getByText(/Bayar \(/i)).toBeDefined();
      });
    });

    it("opens Customer Modal and allows changing table / customer name", async () => {
      render(
        <HashRouter>
          <PosPage />
        </HashRouter>
      );

      const customerBtn = screen.getByTitle(/Ubah info pelanggan dan meja/i);
      fireEvent.click(customerBtn);

      await waitFor(() => {
        expect(screen.getByText("Informasi Pelanggan & Meja")).toBeDefined();
        expect(screen.getByText(/Tipe Layanan Kasir:/i)).toBeDefined();
      });
    });

    it("opens Payment Modal upon clicking Bayar Sekarang", async () => {
      // Pre-populate item in store before render
      usePosStore.getState().addItem({
        productId: "test-sate",
        sku: "SAT-01",
        name: "Sate Ayam Madura",
        basePrice: 40000,
        variant: null,
        addons: [],
        quantity: 1,
        itemNotes: "",
      });

      render(
        <HashRouter>
          <PosPage />
        </HashRouter>
      );

      await waitFor(() => {
        const payBtn = screen.getByText(/Bayar \(/i);
        expect(payBtn).toBeDefined();
        fireEvent.click(payBtn);
      });

      await waitFor(() => {
        expect(screen.getByText("Pembayaran Kasir POS")).toBeDefined();
        expect(screen.getByText("Uang Tunai Diterima (Rp):")).toBeDefined();
        expect(screen.getByText(/Pecahan Cepat Uang Kertas:/i)).toBeDefined();
      });
    });
  });
});
