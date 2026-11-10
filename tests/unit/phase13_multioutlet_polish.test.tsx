import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { outletService } from "@/services/outletService";
import { OutletSwitcher } from "@/components/shared/OutletSwitcher";
import { NetworkStatusIndicator } from "@/components/shared/NetworkStatusIndicator";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAuthStore } from "@/stores/authStore";

// Mock child component that throws an intentional render error
const BuggyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Render error disengaja untuk pengujian ErrorBoundary.");
  }
  return <div>Komponen Berjalan Normal</div>;
};

describe("Phase 13: Multi-Outlet Readiness & Final Polishing", () => {
  beforeEach(async () => {
    localStorage.clear();
    await outletService.resetOutlets();

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
        fullName: "Hendra Wijaya",
        phone: "08111111111",
      },
      role: "OWNER",
      permissions: ["settings.manage", "reports.view"],
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

  describe("1. outletService Multi-Outlet Logic", () => {
    it("returns list of 3 pre-configured branches", async () => {
      const outlets = await outletService.getOutlets();
      expect(outlets.length).toBe(3);
      expect(outlets[0].code).toBe("JKT-01");
      expect(outlets[1].code).toBe("JKT-02");
      expect(outlets[2].code).toBe("BDG-01");
    });

    it("switches active working outlet successfully", async () => {
      const target = await outletService.switchOutlet("e0000000-0000-0000-0000-000000000002");
      expect(target.code).toBe("JKT-02");
      expect(target.name).toContain("Kemang");
      expect(outletService.getActiveOutletId()).toBe("e0000000-0000-0000-0000-000000000002");
    });

    it("creates a new outlet branch with unique code validation", async () => {
      const newBranch = await outletService.createOutlet({
        code: "SBY-01",
        name: "FOODPOS Cabang Surabaya Tunjungan",
        address: "Jl. Tunjungan No. 88, Surabaya",
        phone: "0819-2233-4455",
      });

      expect(newBranch.code).toBe("SBY-01");
      expect(newBranch.name).toContain("Surabaya");

      const all = await outletService.getOutlets();
      expect(all.length).toBe(4);

      // Duplicate code rejection
      await expect(
        outletService.createOutlet({
          code: "sby-01",
          name: "Duplicate Surabaya",
        })
      ).rejects.toThrow(/sudah digunakan/);
    });

    it("updates outlet details", async () => {
      const updated = await outletService.updateOutlet("e0000000-0000-0000-0000-000000000001", {
        name: "FOODPOS Flagship Senopati Prime",
        phone: "0812-9999-0000",
      });

      expect(updated.name).toBe("FOODPOS Flagship Senopati Prime");
      expect(updated.phone).toBe("0812-9999-0000");
    });
  });

  describe("2. OutletSwitcher UI Component", () => {
    it("renders interactive switcher for OWNER and switches active outlet on click", async () => {
      render(<OutletSwitcher />);

      await waitFor(() => {
        expect(screen.getByText("FOODPOS Outlet Pusat Senopati")).toBeInTheDocument();
      });

      // Open popover
      const button = screen.getByRole("button", { name: /Pilih Outlet Aktif/i });
      fireEvent.click(button);

      expect(screen.getByText("Pilih Cabang Outlet Aktif")).toBeInTheDocument();
      expect(screen.getByText("FOODPOS Cabang Kemang Urban")).toBeInTheDocument();
      expect(screen.getByText("FOODPOS Cabang Dago Heritage")).toBeInTheDocument();

      // Click Kemang
      fireEvent.click(screen.getByText("FOODPOS Cabang Kemang Urban"));

      await waitFor(() => {
        expect(useAuthStore.getState().outlet?.code).toBe("JKT-02");
      });
    });

    it("renders static locked badge without switcher for CASHIER role", async () => {
      useAuthStore.setState({
        role: "CASHIER",
        outlet: {
          id: "e0000000-0000-0000-0000-000000000001",
          code: "JKT-01",
          name: "Outlet Kasir Senopati",
        },
      });

      render(<OutletSwitcher />);

      expect(screen.queryByRole("button", { name: /Pilih Outlet Aktif/i })).not.toBeInTheDocument();
      expect(screen.getByText("Outlet Kasir Senopati")).toBeInTheDocument();
      expect(screen.getByText("JKT-01")).toBeInTheDocument();
    });
  });

  describe("3. NetworkStatusIndicator UI Component", () => {
    it("renders nothing when online and renders offline banner when connection drops", async () => {
      render(<NetworkStatusIndicator />);

      // Initially online - nothing rendered
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      // Trigger offline event
      fireEvent(window, new Event("offline"));

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
      expect(screen.getByText(/Mode Offline: Koneksi terputus/i)).toBeInTheDocument();

      // Trigger online restoration
      fireEvent(window, new Event("online"));

      await waitFor(() => {
        expect(screen.getByText(/Koneksi Pulih:/i)).toBeInTheDocument();
      });
    });
  });

  describe("4. ErrorBoundary UI Component", () => {
    it("renders normal children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <BuggyComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Komponen Berjalan Normal")).toBeInTheDocument();
    });

    it("catches render crash and displays user-friendly recovery UI", () => {
      // Suppress console.error in JSDOM during expected intentional throw
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Terjadi Kendala Teknis pada Tampilan")).toBeInTheDocument();
      expect(screen.getByText(/Render error disengaja untuk pengujian ErrorBoundary/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Muat Ulang Halaman/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Halaman Utama/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
