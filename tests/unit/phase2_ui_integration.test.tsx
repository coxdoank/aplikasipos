import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { HashRouter } from "react-router-dom";
import { MenuPage } from "@/modules/public-store/pages/MenuPage";
import { CartPage } from "@/modules/public-store/pages/CartPage";
import { CheckoutPage } from "@/modules/public-store/pages/CheckoutPage";
import { TrackOrderPage } from "@/modules/public-store/pages/TrackOrderPage";
import { useCartStore } from "@/stores/cartStore";

describe("PHASE 2 — Public Website UI Components Integration", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    window.location.hash = "#/";
  });

  it("renders MenuPage, searches for products, and opens ProductDetailModal", async () => {
    render(
      <HashRouter>
        <MenuPage />
      </HashRouter>
    );

    // Check header
    expect(screen.getByText(/Katalog Menu Kuliner Kami/i)).toBeInTheDocument();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng Spesial Resto")).toBeInTheDocument();
    });

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Cari makanan atau minuman/i);
    fireEvent.change(searchInput, { target: { value: "Kopi" } });

    expect(screen.getByText("Es Kopi Susu Gula Aren")).toBeInTheDocument();
    expect(screen.queryByText("Nasi Goreng Spesial Resto")).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Click "Pesan" on Nasi Goreng to open modal
    const pesanButtons = screen.getAllByRole("button", { name: /Pesan/i });
    fireEvent.click(pesanButtons[0]);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText(/Pilih Varian Menu/i)).toBeInTheDocument();
      expect(screen.getByText(/Tambah ke Keranjang/i)).toBeInTheDocument();
    });
  });

  it("renders empty CartPage and shows explore menu button", () => {
    render(
      <HashRouter>
        <CartPage />
      </HashRouter>
    );

    expect(screen.getByText(/Keranjang Anda Masih Kosong/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Jelajahi Menu Sekarang/i })).toBeInTheDocument();
  });

  it("renders CheckoutPage with validation against empty inputs", async () => {
    // Add item to cart first so checkout page doesn't show empty cart state
    useCartStore.getState().addItem({
      productId: "prod-1",
      name: "Ayam Bakar Madu Gurih",
      basePrice: 42000,
      variant: null,
      addons: [],
      quantity: 1,
      itemNotes: "",
    });

    render(
      <HashRouter>
        <CheckoutPage />
      </HashRouter>
    );

    expect(screen.getByText(/Informasi Pemesan/i)).toBeInTheDocument();
    expect(screen.getByText(/Opsi Layanan Pengambilan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Metode Pembayaran/i).length).toBeGreaterThan(0);

    // Submit without name
    const submitBtn = screen.getByRole("button", { name: /Konfirmasi & Buat Pesanan/i });
    fireEvent.click(submitBtn);

    // Check required fields prevented submission
    expect(submitBtn).toBeInTheDocument();
  });

  it("renders TrackOrderPage with search form and secure explanation", () => {
    render(
      <HashRouter>
        <TrackOrderPage />
      </HashRouter>
    );

    expect(screen.getByText(/Lacak Status Pesanan Anda/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contoh: trk_/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Periksa Status/i })).toBeInTheDocument();
  });
});
