import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "@/App";

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

  it("renders Backoffice Layout when navigating to hash #/backoffice", () => {
    window.location.hash = "#/backoffice";
    render(<App />);

    // Check backoffice dashboard title
    expect(screen.getByText(/Ringkasan Operasional Restoran/i)).toBeInTheDocument();
    expect(screen.getByText(/Buka Layar Kasir/i)).toBeInTheDocument();
  });

  it("renders 404 page when navigating to an unknown route", () => {
    window.location.hash = "#/unknown-route-xyz";
    render(<App />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Halaman Tidak Ditemukan")).toBeInTheDocument();
  });
});
