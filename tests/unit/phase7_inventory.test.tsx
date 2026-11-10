import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import { catalogService } from "@/services/catalogService";
import { InventoryPage } from "@/modules/inventory/pages/InventoryPage";
import { StockAdjustmentModal } from "@/modules/inventory/components/StockAdjustmentModal";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 7: Finished Goods Inventory & Stock Movements", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    catalogService.resetDemoCatalog();
    inventoryService.resetDemoInventory();

    useAuthStore.setState({
      isAuthenticated: true,
      role: "ADMIN",
      permissions: ["products.view", "products.manage", "inventory.adjust"],
      profile: {
        id: "usr-admin-01",
        fullName: "Ratna Sari (Manajer Resto)",
        email: "admin@foodpos.local",
      },
    });
  });

  describe("1. Inventory Service - Ledger & Calculation Operations", () => {
    it("retrieves stock movements ledger with valid entries", async () => {
      const movements = await inventoryService.getStockMovements();
      expect(movements.length).toBeGreaterThan(0);
      expect(movements[0].movement_type).toBeDefined();
      expect(movements[0].product_name).toBeDefined();
      expect(movements[0].sku).toBeDefined();
      expect(typeof movements[0].previous_stock).toBe("number");
      expect(typeof movements[0].new_stock).toBe("number");
    });

    it("performs stock IN adjustment and increases physical stock", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];
      const initialStock = target.current_stock;

      const res = await inventoryService.adjustStock({
        productId: target.id,
        type: "IN",
        quantity: 25,
        reason: "Restok batch dapur siang",
        referenceId: "PO-B2-001",
        actorName: "Ratna Sari",
      });

      expect(res.success).toBe(true);
      expect(res.product?.current_stock).toBe(initialStock + 25);
      expect(res.movement?.movement_type).toBe("IN");
      expect(res.movement?.quantity_change).toBe(25);
      expect(res.movement?.previous_stock).toBe(initialStock);
      expect(res.movement?.new_stock).toBe(initialStock + 25);

      // Verify ledger update
      const movements = await inventoryService.getStockMovements();
      expect(movements[0].reason).toBe("Restok batch dapur siang");
    });

    it("performs stock OUT adjustment and decreases physical stock", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];
      const initialStock = target.current_stock;

      const res = await inventoryService.adjustStock({
        productId: target.id,
        type: "OUT",
        quantity: 5,
        reason: "5 porsi tumpah saat penyiapan",
        actorName: "Ratna Sari",
      });

      expect(res.success).toBe(true);
      expect(res.product?.current_stock).toBe(initialStock - 5);
      expect(res.movement?.movement_type).toBe("OUT");
      expect(res.movement?.quantity_change).toBe(-5);
      expect(res.movement?.new_stock).toBe(initialStock - 5);
    });

    it("rejects OUT adjustment if quantity exceeds current stock (prevent negative stock)", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];
      const initialStock = target.current_stock;

      const res = await inventoryService.adjustStock({
        productId: target.id,
        type: "OUT",
        quantity: initialStock + 100,
        reason: "Pengurangan melebihi stok",
        actorName: "Ratna Sari",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Stok tidak mencukupi");

      // Verify product stock remains unchanged
      const current = await catalogService.getProductById(target.id);
      expect(current?.current_stock).toBe(initialStock);
    });

    it("performs physical stock opname (ADJUSTMENT) and updates availability", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];

      // Opname to 0
      const resZero = await inventoryService.adjustStock({
        productId: target.id,
        type: "ADJUSTMENT",
        quantity: 0,
        reason: "Stok habis total hasil opname malam",
        actorName: "Ratna Sari",
      });

      expect(resZero.success).toBe(true);
      expect(resZero.product?.current_stock).toBe(0);
      expect(resZero.product?.is_available).toBe(false); // Automatically disabled

      // Opname back to 15
      const resRecover = await inventoryService.adjustStock({
        productId: target.id,
        type: "ADJUSTMENT",
        quantity: 15,
        reason: "Dapur selesai masak porsi baru",
        actorName: "Ratna Sari",
      });

      expect(resRecover.success).toBe(true);
      expect(resRecover.product?.current_stock).toBe(15);
      expect(resRecover.product?.is_available).toBe(true); // Automatically restored
    });

    it("rejects adjustment without mandatory reason", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];

      const res = await inventoryService.adjustStock({
        productId: target.id,
        type: "IN",
        quantity: 10,
        reason: "   ",
        actorName: "Ratna Sari",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Alasan penyesuaian stok wajib diisi");
    });

    it("records sale deduction from order checkout", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];
      const initialStock = target.current_stock;

      await inventoryService.recordSaleDeduction(target.id, 2, "ORD-TEST-001", "Kasir Shift 1");

      const updated = await catalogService.getProductById(target.id);
      expect(updated?.current_stock).toBe(initialStock - 2);

      const movements = await inventoryService.getStockMovements();
      const saleMov = movements.find((m) => m.reference_id === "ORD-TEST-001");
      expect(saleMov).toBeDefined();
      expect(saleMov?.movement_type).toBe("SALE");
      expect(saleMov?.quantity_change).toBe(-2);
    });

    it("calculates inventory statistics accurately", async () => {
      const stats = await inventoryService.getInventoryStats();
      expect(stats.totalProducts).toBeGreaterThan(0);
      expect(stats.totalPhysicalStock).toBeGreaterThan(0);
      expect(typeof stats.lowStockCount).toBe("number");
      expect(typeof stats.outOfStockCount).toBe("number");
    });
  });

  describe("2. Inventory UI Page Component", () => {
    it("renders inventory dashboard headers, KPI cards, and tab buttons", async () => {
      render(
        <HashRouter>
          <InventoryPage />
        </HashRouter>
      );

      expect(await screen.findByText("Stok & Inventori Produk Jadi")).toBeInTheDocument();
      expect(screen.getByText("Menu Dimonitor")).toBeInTheDocument();
      expect(screen.getByText("Total Stok Fisik")).toBeInTheDocument();
      expect(screen.getByText("Stok Menipis (≤10)")).toBeInTheDocument();
      expect(screen.getAllByText("Stok Habis (0)").length).toBeGreaterThan(0);
      expect(screen.getByText(/Daftar Stok Produk Jadi/)).toBeInTheDocument();
      expect(screen.getByText(/Riwayat Mutasi Stok/)).toBeInTheDocument();
    });

    it("switches to Riwayat Mutasi Stok ledger tab and displays movement records", async () => {
      render(
        <HashRouter>
          <InventoryPage />
        </HashRouter>
      );

      // Wait for data load
      await screen.findByText("Stok & Inventori Produk Jadi");

      // Click Ledger Tab
      const ledgerTab = screen.getByText(/Riwayat Mutasi Stok/);
      fireEvent.click(ledgerTab);

      // Should display ledger headers
      await waitFor(() => {
        expect(screen.getByText("Tipe Mutasi")).toBeInTheDocument();
        expect(screen.getByText("Awal → Akhir")).toBeInTheDocument();
        expect(screen.getByText("Alasan & Referensi")).toBeInTheDocument();
      });
    });

    it("filters products by search input in catalog tab", async () => {
      render(
        <HashRouter>
          <InventoryPage />
        </HashRouter>
      );

      await screen.findByText("Stok & Inventori Produk Jadi");
      await screen.findByText("Nasi Goreng Spesial Resto");

      const searchInput = screen.getByPlaceholderText("Cari nama menu atau SKU...");
      fireEvent.change(searchInput, { target: { value: "Ayam Bakar" } });

      await waitFor(() => {
        expect(screen.getByText("Ayam Bakar Madu Gurih")).toBeInTheDocument();
        expect(screen.queryByText("Nasi Goreng Spesial Resto")).not.toBeInTheDocument();
      });
    });
  });

  describe("3. Stock Adjustment Modal Component", () => {
    it("renders modal with product info, adjustment options, and live preview", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];

      render(
        <StockAdjustmentModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
          initialProduct={target}
          products={products}
        />
      );

      expect(screen.getByText("Penyesuaian Stok Produk Jadi")).toBeInTheDocument();
      expect(screen.getByText(target.name)).toBeInTheDocument();
      expect(screen.getByText("Opname Fisik")).toBeInTheDocument();
      expect(screen.getByText("Barang Masuk")).toBeInTheDocument();
      expect(screen.getByText("Barang Keluar")).toBeInTheDocument();
      expect(screen.getByText("Simpan Penyesuaian Stok")).toBeInTheDocument();
    });

    it("enforces permission guard when user lacks inventory.adjust", async () => {
      // Simulate Cashier lacking inventory.adjust
      useAuthStore.setState({
        isAuthenticated: true,
        role: "CASHIER",
        permissions: ["orders.view", "orders.create", "products.view"],
        profile: {
          id: "usr-cashier-01",
          fullName: "Budi Santoso",
          email: "cashier@foodpos.local",
        },
      });

      const products = await catalogService.getProducts();
      const target = products[0];

      render(
        <StockAdjustmentModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
          initialProduct={target}
          products={products}
        />
      );

      // Warning alert should be visible
      expect(screen.getByText(/Akses Terbatas:/)).toBeInTheDocument();
      expect(screen.getByText("inventory.adjust")).toBeInTheDocument();

      // Submit button should be disabled
      const submitBtn = screen.getByText("Simpan Penyesuaian Stok").closest("button");
      expect(submitBtn).toBeDisabled();
    });

    it("selects preset reason tag on click", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];

      render(
        <StockAdjustmentModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
          initialProduct={target}
          products={products}
        />
      );

      const presetChip = screen.getByText("Hasil stock opname fisik berkala");
      fireEvent.click(presetChip);

      const textarea = screen.getByPlaceholderText("Tuliskan keterangan detail alasan penyesuaian stok ini...") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Hasil stock opname fisik berkala");
    });
  });
});
