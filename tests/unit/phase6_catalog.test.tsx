import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { catalogService } from "@/services/catalogService";
import { CategoriesPage } from "@/modules/categories/pages/CategoriesPage";
import { ProductsPage } from "@/modules/products/pages/ProductsPage";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 6: Product, Category, and Catalog Management", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    catalogService.resetDemoCatalog();

    useAuthStore.setState({
      isAuthenticated: true,
      role: "ADMIN",
      permissions: ["products.view", "products.manage"],
      profile: {
        id: "usr-admin-01",
        fullName: "Ratna Sari (Manajer Resto)",
        email: "admin@foodpos.local",
      },
    });
  });

  describe("1. Categories Service Operations", () => {
    it("fetches categories list with product counts", async () => {
      const categories = await catalogService.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0].name).toBeDefined();
      expect(categories[0].slug).toBeDefined();
      expect(categories[0].products_count).toBeGreaterThanOrEqual(0);
    });

    it("creates a new category and generates slug automatically", async () => {
      const newCat = await catalogService.createCategory({
        name: "Dessert & Es Krim",
        description: "Aneka hidangan penutup manis",
        display_order: 5,
      });

      expect(newCat.id).toBeDefined();
      expect(newCat.name).toBe("Dessert & Es Krim");
      expect(newCat.slug).toBe("dessert-es-krim");

      const all = await catalogService.getCategories();
      expect(all.some((c) => c.slug === "dessert-es-krim")).toBe(true);
    });

    it("updates category details", async () => {
      const categories = await catalogService.getCategories();
      const target = categories[0];

      const updated = await catalogService.updateCategory(target.id, {
        name: "Makanan Utama Nusantara",
        display_order: 10,
      });

      expect(updated.name).toBe("Makanan Utama Nusantara");
      expect(updated.display_order).toBe(10);
    });

    it("prevents deletion of category that still has linked products", async () => {
      const categories = await catalogService.getCategories();
      // Category with products
      const categoryWithProducts = categories.find((c) => (c.products_count || 0) > 0);
      expect(categoryWithProducts).toBeDefined();

      if (categoryWithProducts) {
        const res = await catalogService.deleteCategory(categoryWithProducts.id);
        expect(res.success).toBe(false);
        expect(res.message).toContain("masih memiliki produk");
      }
    });

    it("successfully deletes category when empty", async () => {
      const emptyCat = await catalogService.createCategory({
        name: "Kategori Kosong Sementara",
        display_order: 99,
      });

      const res = await catalogService.deleteCategory(emptyCat.id);
      expect(res.success).toBe(true);

      const all = await catalogService.getCategories();
      expect(all.some((c) => c.id === emptyCat.id)).toBe(false);
    });
  });

  describe("2. Products Service Operations", () => {
    it("fetches products with category names, variants, and addons", async () => {
      const products = await catalogService.getProducts();
      expect(products.length).toBeGreaterThan(0);

      const first = products[0];
      expect(first.sku).toBeDefined();
      expect(first.base_price).toBeGreaterThan(0);
      expect(first.variants).toBeDefined();
      expect(first.addons).toBeDefined();
    });

    it("filters products by category and search keyword", async () => {
      const categories = await catalogService.getCategories();
      const firstCatId = categories[0].id;

      const filtered = await catalogService.getProducts({ category_id: firstCatId });
      expect(filtered.every((p) => p.category_id === firstCatId)).toBe(true);

      const searched = await catalogService.getProducts({ search: "Goreng" });
      expect(searched.length).toBeGreaterThan(0);
      expect(searched.every((p) => p.name.includes("Goreng") || p.sku.includes("Goreng"))).toBe(true);
    });

    it("creates a new product with custom variants and addons", async () => {
      const categories = await catalogService.getCategories();

      const newProduct = await catalogService.createProduct({
        category_id: categories[0].id,
        sku: "TEST-SOP-01",
        name: "Sop Buntut Sapi Istimewa",
        description: "Sop buntut kuah rempah bening kaya rasa",
        base_price: 65000,
        current_stock: 30,
        variants: [
          { name: "Porsi Regular", price_adjustment: 0 },
          { name: "Porsi Spesial (+Daging)", price_adjustment: 15000 },
        ],
        addons: [
          { name: "Emping Melinjo", price: 4000 },
          { name: "Nasi Putih", price: 6000 },
        ],
      });

      expect(newProduct.id).toBeDefined();
      expect(newProduct.sku).toBe("TEST-SOP-01");
      expect(newProduct.variants.length).toBe(2);
      expect(newProduct.addons.length).toBe(2);

      const fetched = await catalogService.getProductById(newProduct.id);
      expect(fetched?.name).toBe("Sop Buntut Sapi Istimewa");
    });

    it("strictly rejects duplicate SKU", async () => {
      const products = await catalogService.getProducts();
      const existingSku = products[0].sku;

      await expect(
        catalogService.createProduct({
          category_id: products[0].category_id,
          sku: existingSku,
          name: "Produk Duplikat",
          base_price: 20000,
        })
      ).rejects.toThrow("sudah digunakan");
    });

    it("toggles product availability (Tersedia <-> Habis)", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];
      const initialStatus = target.is_available;

      const toggled = await catalogService.toggleProductAvailability(target.id, !initialStatus);
      expect(toggled.is_available).toBe(!initialStatus);

      const restored = await catalogService.toggleProductAvailability(target.id, initialStatus);
      expect(restored.is_available).toBe(initialStatus);
    });

    it("toggles product active visibility (Aktif <-> Nonaktif)", async () => {
      const products = await catalogService.getProducts();
      const target = products[0];

      const toggled = await catalogService.toggleProductActive(target.id, false);
      expect(toggled.is_active).toBe(false);
    });

    it("deletes a product from the catalog", async () => {
      const products = await catalogService.getProducts();
      const target = products[products.length - 1];

      const res = await catalogService.deleteProduct(target.id);
      expect(res.success).toBe(true);

      const current = await catalogService.getProducts();
      expect(current.some((p) => p.id === target.id)).toBe(false);
    });
  });

  describe("3. UI Integration Tests", () => {
    it("renders CategoriesPage with table, slugs, and count badges", async () => {
      render(
        <HashRouter>
          <CategoriesPage />
        </HashRouter>
      );

      expect(screen.getByText("Kategori Menu Restoran")).toBeDefined();
      await waitFor(() => {
        expect(screen.getByText("Makanan Utama")).toBeDefined();
        expect(screen.getByText("makanan-utama")).toBeDefined();
      });
    });

    it("opens CategoryModal on clicking Tambah Kategori", async () => {
      render(
        <HashRouter>
          <CategoriesPage />
        </HashRouter>
      );

      // Wait for initial category to load
      await waitFor(() => {
        expect(screen.getByText("Makanan Utama")).toBeDefined();
      });

      const addBtn = screen.getByText("Tambah Kategori");
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByText("Tambah Kategori Baru")).toBeDefined();
        expect(screen.getByPlaceholderText(/Contoh: Makanan Utama/i)).toBeDefined();
      });
    });

    it("renders ProductsPage with KPI statistics and product table", async () => {
      render(
        <HashRouter>
          <ProductsPage />
        </HashRouter>
      );

      expect(screen.getByText("Katalog Produk & Menu")).toBeDefined();
      expect(screen.getByText("Total Menu")).toBeDefined();
      expect(screen.getByText("Tersedia di Dapur")).toBeDefined();

      await waitFor(() => {
        expect(screen.getByText("Nasi Goreng Spesial Resto")).toBeDefined();
        expect(screen.getByText("FOOD-001")).toBeDefined();
      });
    });

    it("opens ProductModal on clicking Tambah Menu Baru", async () => {
      const { findByText, getByRole } = render(
        <HashRouter>
          <ProductsPage />
        </HashRouter>
      );

      // Wait for product list to load in table
      await findByText("Nasi Goreng Spesial Resto");

      const addBtn = getByRole("button", { name: /Tambah Menu Baru/i });
      fireEvent.click(addBtn);

      await findByText("Tambah Menu Hidangan Baru");
      await findByText("Informasi & Stok");
      expect(screen.getByRole("button", { name: /Varian Porsi/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Topping/i })).toBeDefined();
    });

    it("hides management action buttons for read-only staff without products.manage", async () => {
      // Set to staff with view-only permission
      useAuthStore.setState({
        isAuthenticated: true,
        role: "CASHIER",
        permissions: ["products.view"],
        profile: {
          id: "usr-cashier-02",
          fullName: "Kasir View Only",
          email: "cashier@foodpos.local",
        },
      });

      render(
        <HashRouter>
          <ProductsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Nasi Goreng Spesial Resto")).toBeDefined();
      });

      // "Tambah Menu Baru" should not exist
      expect(screen.queryByText("Tambah Menu Baru")).toBeNull();
    });
  });
});
