import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { HashRouter } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { AccessDeniedPage } from "@/components/shared/AccessDeniedPage";
import App from "@/App";

describe("PHASE 3 — Backoffice Foundation and Authentication Verification", () => {
  beforeEach(async () => {
    await useAuthStore.getState().logout();
    window.location.hash = "#/";
  });

  it("authenticates as OWNER using demo login and grants full permissions", async () => {
    const store = useAuthStore.getState();
    const success = await store.login("owner@foodpos.local", "DemoPassword123!");

    expect(success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe("OWNER");

    // OWNER has all permissions by default
    expect(useAuthStore.getState().hasPermission("orders.create")).toBe(true);
    expect(useAuthStore.getState().hasPermission("settings.manage")).toBe(true);
    expect(useAuthStore.getState().hasPermission("reports.view")).toBe(true);
  });

  it("authenticates as CASHIER and enforces restricted permissions", async () => {
    const store = useAuthStore.getState();
    const success = await store.login("cashier@foodpos.local", "DemoPassword123!");

    expect(success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe("CASHIER");

    // Cashier has orders.create and payments.verify
    expect(useAuthStore.getState().hasPermission("orders.create")).toBe(true);
    expect(useAuthStore.getState().hasPermission("payments.verify")).toBe(true);

    // Cashier does NOT have settings.manage or reports.view
    expect(useAuthStore.getState().hasPermission("settings.manage")).toBe(false);
    expect(useAuthStore.getState().hasPermission("reports.view")).toBe(false);
  });

  it("redirects unauthenticated users attempting to access /backoffice to /backoffice/login", async () => {
    window.location.hash = "#/backoffice";
    render(<App />);

    // Should be redirected to LoginPage
    await waitFor(() => {
      expect(screen.getByText(/Portal Masuk Staf & Kasir/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/staf@foodpos.local/i)).toBeInTheDocument();
    });
  });

  it("renders LoginPage and allows quick demo button login", async () => {
    render(
      <HashRouter>
        <LoginPage />
      </HashRouter>
    );

    expect(screen.getByText(/Portal Masuk Staf & Kasir/i)).toBeInTheDocument();

    // Click demo button for CASHIER
    const cashierDemoBtn = screen.getByText("CASHIER");
    fireEvent.click(cashierDemoBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().role).toBe("CASHIER");
    });
  });

  it("renders AccessDeniedPage when staff lacks required permission", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "CASHIER",
      profile: { id: "u-cashier", fullName: "Budi Santoso", email: "cashier@foodpos.local" },
      outlet: { id: "o-1", code: "OUT-01", name: "Outlet Pusat" },
      permissions: ["orders.create"],
    });

    render(
      <HashRouter>
        <AccessDeniedPage requiredPermission="settings.manage" />
      </HashRouter>
    );

    expect(screen.getByText(/Error 403 — Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/Akses Halaman Dibatasi/i)).toBeInTheDocument();
    expect(screen.getByText("settings.manage")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
  });

  it("logs out and clears session state completely", async () => {
    await useAuthStore.getState().login("admin@foodpos.local");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
  });
});
