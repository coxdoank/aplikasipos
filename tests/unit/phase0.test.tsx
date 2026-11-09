import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "@/App";
import { useAuthStore } from "@/stores/authStore";

describe("PHASE 0 — Project Foundation and Routing Verification", () => {
  it("renders Public Layout with brand header and navigation", () => {
    window.location.hash = "#/";
    render(<App />);

    // Check brand header elements exist
    const brandElements = screen.getAllByText(/FOOD/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // Check public navigation links (found in header and footer)
    expect(screen.getAllByText("Beranda").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Katalog Menu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lacak Pesanan").length).toBeGreaterThan(0);
  });

  it("renders Backoffice Layout when authenticated and navigating to hash #/backoffice", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "OWNER",
      profile: { id: "u-1", fullName: "Owner Resto", email: "owner@foodpos.local" },
      outlet: { id: "o-1", code: "OUT-01", name: "Outlet Pusat" },
      permissions: ["orders.view", "orders.create"],
    });

    window.location.hash = "#/backoffice";
    render(<App />);

    // Check backoffice dashboard title or welcome banner
    expect(screen.getByText(/Selamat Datang, Owner Resto/i)).toBeInTheDocument();
  });

  it("renders 404 page when navigating to an unknown route", () => {
    window.location.hash = "#/unknown-route-xyz";
    render(<App />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Halaman Tidak Ditemukan")).toBeInTheDocument();
  });
});
