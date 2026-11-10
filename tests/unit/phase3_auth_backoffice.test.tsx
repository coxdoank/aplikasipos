import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { HashRouter } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { AccessDeniedPage } from "@/components/shared/AccessDeniedPage";
import { supabase } from "@/lib/supabase";
import App from "@/App";

describe("PHASE 3 — Backoffice Foundation and Supabase Authentication Verification", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.stubEnv("VITE_SUPABASE_URL", "https://mock-foodpos.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "mock-foodpos-key-12345");
    useAuthStore.setState({
      user: null,
      profile: null,
      role: null,
      permissions: [],
      outlet: null,
      isAuthenticated: false,
      isLoading: false,
      errorMessage: null,
    });
    window.location.hash = "#/";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders LoginPage with standard email/password fields and WITHOUT demo login UI", () => {
    render(
      <HashRouter>
        <LoginPage />
      </HashRouter>
    );

    // 1. Verify standard login form exists
    expect(screen.getByText(/Portal Masuk Staf & Kasir/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/staf@foodpos.local/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Masuk ke Backoffice/i })).toBeInTheDocument();

    // 2. Verify demo buttons and demo helper UI are completely removed
    expect(screen.queryByText(/Akun Demo Cepat/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Simulator/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^OWNER$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^ADMIN$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^CASHIER$/i })).not.toBeInTheDocument();
  });

  it("authenticates as OWNER via Supabase Auth and grants full permissions", async () => {
    const mockUser = {
      id: "u-owner-001",
      email: "owner@foodpos.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: mockUser as never, session: {} as never },
      error: null,
    });

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "u-owner-001", full_name: "Hendra Wijaya", phone: "08123456789", avatar_url: null },
                error: null,
              }),
            }),
          }),
        } as never;
      }
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { roles: { id: "role-owner-id", name: "OWNER" } },
                error: null,
              }),
            }),
          }),
        } as never;
      }
      if (table === "role_permissions") {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                { permissions: { code: "orders.create" } },
                { permissions: { code: "settings.manage" } },
                { permissions: { code: "reports.view" } },
              ],
              error: null,
            }),
          }),
        } as never;
      }
      if (table === "user_outlets") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { outlets: { id: "out-01", code: "JKT-01", name: "Outlet Senopati" } },
                  error: null,
                }),
              }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const store = useAuthStore.getState();
    const success = await store.login("owner@foodpos.com", "SecretPass123!");

    expect(success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe("OWNER");
    expect(useAuthStore.getState().user?.email).toBe("owner@foodpos.com");

    // OWNER has full permissions
    expect(useAuthStore.getState().hasPermission("orders.create")).toBe(true);
    expect(useAuthStore.getState().hasPermission("settings.manage")).toBe(true);
    expect(useAuthStore.getState().hasPermission("reports.view")).toBe(true);
  });

  it("authenticates as CASHIER via Supabase Auth and enforces restricted permissions", async () => {
    const mockUser = {
      id: "u-cashier-001",
      email: "cashier@foodpos.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: mockUser as never, session: {} as never },
      error: null,
    });

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "u-cashier-001", full_name: "Budi Santoso", phone: "081299998888", avatar_url: null },
                error: null,
              }),
            }),
          }),
        } as never;
      }
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { roles: { id: "role-cashier-id", name: "CASHIER" } },
                error: null,
              }),
            }),
          }),
        } as never;
      }
      if (table === "role_permissions") {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                { permissions: { code: "orders.create" } },
                { permissions: { code: "payments.verify" } },
              ],
              error: null,
            }),
          }),
        } as never;
      }
      if (table === "user_outlets") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { outlets: { id: "out-01", code: "JKT-01", name: "Outlet Senopati" } },
                  error: null,
                }),
              }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const store = useAuthStore.getState();
    const success = await store.login("cashier@foodpos.com", "CashierPass123!");

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

  it("rejects invalid credentials without any demo authentication fallback", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" } as never,
    });

    const store = useAuthStore.getState();
    const success = await store.login("wrong@foodpos.com", "WrongPassword!");

    // Must strictly fail and NOT fall back to any simulated demo user
    expect(success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
    expect(useAuthStore.getState().errorMessage).toContain("Email atau kata sandi yang Anda masukkan salah");
  });

  it("submits login form via UI and triggers Supabase Auth", async () => {
    const signInSpy = vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Email atau kata sandi tidak valid." } as never,
    });

    render(
      <HashRouter>
        <LoginPage />
      </HashRouter>
    );

    const emailInput = screen.getByPlaceholderText(/staf@foodpos.local/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByRole("button", { name: /Masuk ke Backoffice/i });

    fireEvent.change(emailInput, { target: { value: "staff@resto.id" } });
    fireEvent.change(passwordInput, { target: { value: "RestoPassword2026!" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalledWith({
        email: "staff@resto.id",
        password: "RestoPassword2026!",
      });
    });

    await screen.findByText(/Email atau kata sandi yang Anda masukkan salah/i);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("differentiates network connection failure (Failed to fetch)", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    const success = await useAuthStore.getState().login("staff@resto.id", "Secret123!");

    expect(success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().errorMessage).toContain("Gagal terhubung ke server Supabase Cloud");
  });

  it("differentiates unconfigured Supabase environment", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const success = await useAuthStore.getState().login("staff@resto.id", "Secret123!");

    expect(success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().errorMessage).toContain("Konfigurasi Supabase Cloud belum tersedia");

    // Restore stubbed env
    vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-valid-anon-key");
  });

  it("differentiates unconfirmed email address", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Email not confirmed", status: 400 } as never,
    });

    const success = await useAuthStore.getState().login("staff@resto.id", "Secret123!");

    expect(success).toBe(false);
    expect(useAuthStore.getState().errorMessage).toContain("Alamat email akun ini belum dikonfirmasi");
  });

  it("differentiates deactivated / banned staff account", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User is banned", status: 403 } as never,
    });

    const success = await useAuthStore.getState().login("staff@resto.id", "Secret123!");

    expect(success).toBe(false);
    expect(useAuthStore.getState().errorMessage).toContain("Akun staf ini telah dinonaktifkan");
  });

  it("differentiates rate limit / too many requests (429)", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "over_request_rate_limit", status: 429 } as never,
    });

    const success = await useAuthStore.getState().login("staff@resto.id", "Secret123!");

    expect(success).toBe(false);
    expect(useAuthStore.getState().errorMessage).toContain("Terlalu banyak percobaan masuk");
  });

  it("differentiates Supabase server error (500)", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Internal server error", status: 500 } as never,
    });

    const success = await useAuthStore.getState().login("staff@resto.id", "Secret123!");

    expect(success).toBe(false);
    expect(useAuthStore.getState().errorMessage).toContain("Server Error 5xx");
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
    const signOutSpy = vi.spyOn(supabase.auth, "signOut").mockResolvedValueOnce({
      error: null,
    });

    useAuthStore.setState({
      user: { id: "u-owner-001", email: "owner@foodpos.com" } as never,
      profile: { id: "u-owner-001", fullName: "Owner", email: "owner@foodpos.com" },
      role: "OWNER",
      permissions: ["orders.create"],
      outlet: { id: "out-1", code: "JKT-01", name: "Senopati" },
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    expect(signOutSpy).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
    expect(useAuthStore.getState().permissions).toEqual([]);
    expect(useAuthStore.getState().outlet).toBeNull();
  });
});
