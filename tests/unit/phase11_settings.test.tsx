import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { settingService, DEFAULT_OUTLET_ID } from "@/services/settingService";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 11: Settings & System Configuration", () => {
  beforeEach(async () => {
    localStorage.clear();
    await settingService.resetToDefaults();

    // Default mock auth state to OWNER (has settings.manage permission)
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
        fullName: "Owner Foodpos",
        phone: "08111111111",
      },
      role: "OWNER",
      permissions: ["settings.manage", "reports.view", "orders.view"],
      outlet: {
        id: DEFAULT_OUTLET_ID,
        code: "JKT-01",
        name: "FOODPOS Outlet Pusat Senopati",
      },
      isAuthenticated: true,
      isLoading: false,
      errorMessage: null,
    });
  });

  describe("1. settingService Business Logic", () => {
    it("returns complete settings configuration containing all 6 modules", async () => {
      const all = await settingService.getAllSettings();
      expect(all.outlet).toBeDefined();
      expect(all.store).toBeDefined();
      expect(all.payment).toBeDefined();
      expect(all.tax).toBeDefined();
      expect(all.serviceCharge).toBeDefined();
      expect(all.receipt).toBeDefined();

      expect(all.outlet.code).toBe("JKT-01");
      expect(all.store.business_name).toContain("FOODPOS");
      expect(all.tax.tax_rate_percent).toBe(10);
      expect(all.payment.is_cash_enabled).toBe(true);
      expect(all.receipt.paper_width).toBe("58mm");
    });

    it("updates store and operational settings successfully", async () => {
      const updated = await settingService.updateStoreSettings(DEFAULT_OUTLET_ID, {
        business_name: "FOODPOS Premium Bistro",
        estimated_prep_time_minutes: 25,
      });

      expect(updated.business_name).toBe("FOODPOS Premium Bistro");
      expect(updated.estimated_prep_time_minutes).toBe(25);

      const fetched = await settingService.getStoreSettings();
      expect(fetched.business_name).toBe("FOODPOS Premium Bistro");
      expect(fetched.estimated_prep_time_minutes).toBe(25);
    });

    it("updates PB1 tax settings and rate", async () => {
      const updated = await settingService.updateTaxSettings(DEFAULT_OUTLET_ID, {
        tax_rate_percent: 11,
        tax_name: "PPN & PB1 Restoran",
        is_enabled: true,
      });

      expect(updated.tax_rate_percent).toBe(11);
      expect(updated.tax_name).toBe("PPN & PB1 Restoran");

      const fetched = await settingService.getTaxSettings();
      expect(fetched.tax_rate_percent).toBe(11);
    });

    it("updates service charge settings and status", async () => {
      const updated = await settingService.updateServiceChargeSettings(DEFAULT_OUTLET_ID, {
        is_enabled: true,
        service_rate_percent: 5,
      });

      expect(updated.is_enabled).toBe(true);
      expect(updated.service_rate_percent).toBe(5);

      const fetched = await settingService.getServiceChargeSettings();
      expect(fetched.is_enabled).toBe(true);
      expect(fetched.service_rate_percent).toBe(5);
    });

    it("updates payment methods, QRIS, and bank account settings", async () => {
      const updated = await settingService.updatePaymentSettings(DEFAULT_OUTLET_ID, {
        is_card_enabled: false,
        bank_name: "Bank Mandiri",
        bank_account_number: "123000998877",
        bank_account_holder: "PT RESTO MAKMUR",
      });

      expect(updated.is_card_enabled).toBe(false);
      expect(updated.bank_name).toBe("Bank Mandiri");
      expect(updated.bank_account_number).toBe("123000998877");

      const fetched = await settingService.getPaymentSettings();
      expect(fetched.bank_name).toBe("Bank Mandiri");
      expect(fetched.is_card_enabled).toBe(false);
    });

    it("updates receipt thermal template settings", async () => {
      const updated = await settingService.updateReceiptSettings(DEFAULT_OUTLET_ID, {
        header_title: "CAFE MAJU JAYA",
        paper_width: "80mm",
        wifi_ssid: "CAFE_MAJU_WIFI",
      });

      expect(updated.header_title).toBe("CAFE MAJU JAYA");
      expect(updated.paper_width).toBe("80mm");
      expect(updated.wifi_ssid).toBe("CAFE_MAJU_WIFI");

      const fetched = await settingService.getReceiptSettings();
      expect(fetched.header_title).toBe("CAFE MAJU JAYA");
      expect(fetched.paper_width).toBe("80mm");
    });

    it("resets all settings back to default factory values", async () => {
      await settingService.updateStoreSettings(DEFAULT_OUTLET_ID, {
        business_name: "Custom Name",
      });
      await settingService.updateTaxSettings(DEFAULT_OUTLET_ID, {
        tax_rate_percent: 15,
      });

      const reset = await settingService.resetToDefaults(DEFAULT_OUTLET_ID);
      expect(reset.store.business_name).toBe("FOODPOS Nusantara & Coffee");
      expect(reset.tax.tax_rate_percent).toBe(10);
    });
  });

  describe("2. SettingsPage UI Component", () => {
    it("renders page header, save button, and 4 navigation tabs", async () => {
      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Pengaturan Toko & Sistem")).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /Simpan Pengaturan/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset Bawaan/i })).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /Profil Outlet & Restoran/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Pajak PB1 & Service Charge/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Metode Pembayaran/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Struk & Printer POS/i })).toBeInTheDocument();
    });

    it("displays Profil Outlet inputs and allows editing business name", async () => {
      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("FOODPOS Nusantara & Coffee")).toBeInTheDocument();
      });

      const input = screen.getByDisplayValue("FOODPOS Nusantara & Coffee");
      fireEvent.change(input, { target: { value: "FOODPOS Flagship Store" } });
      expect(screen.getByDisplayValue("FOODPOS Flagship Store")).toBeInTheDocument();
    });

    it("navigates to Pajak PB1 tab and displays simulation calculations", async () => {
      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Pajak PB1 & Service Charge/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Pajak PB1 & Service Charge/i }));

      expect(screen.getByText(/Pajak Restoran \(PB1 \/ Pajak Daerah\)/i)).toBeInTheDocument();
      expect(screen.getByText("Simulasi Kalkulasi Transaksi")).toBeInTheDocument();
      expect(screen.getAllByText("Rp 100.000").length).toBeGreaterThan(0);
      expect(screen.getByText("+ Rp 10.000")).toBeInTheDocument();
      expect(screen.getByText("Rp 110.000")).toBeInTheDocument();
    });

    it("navigates to Metode Pembayaran tab and renders payment options", async () => {
      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Metode Pembayaran/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Metode Pembayaran/i }));

      expect(screen.getByText(/Tunai \/ Uang Pas \(Cash\)/i)).toBeInTheDocument();
      expect(screen.getByText(/QRIS Dinamis \/ Statis/i)).toBeInTheDocument();
      expect(screen.getByText(/Transfer Bank Manual/i)).toBeInTheDocument();
      expect(screen.getByText(/Kartu Debit & Kredit \(EDC\)/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("PT KULINER MAKMUR POS")).toBeInTheDocument();
    });

    it("navigates to Struk & Printer POS tab and shows live thermal receipt preview", async () => {
      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Struk & Printer POS/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Struk & Printer POS/i }));

      expect(screen.getByText("Live Thermal Receipt Preview")).toBeInTheDocument();
      expect(screen.getByText("FOODPOS RESTO & CAFE")).toBeInTheDocument();
      expect(screen.getByText(/FOODPOS_GUEST_5G/)).toBeInTheDocument();
      expect(screen.getAllByText(/Terima kasih atas kunjungan Anda!/).length).toBeGreaterThan(0);
    });

    it("saves settings on clicking Simpan Pengaturan and displays success alert", async () => {
      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Simpan Pengaturan/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Simpan Pengaturan/i }));

      await waitFor(() => {
        expect(screen.getByText(/Konfigurasi toko dan operasional berhasil disimpan ke sistem!/i)).toBeInTheDocument();
      });
    });

    it("shows read-only alert and disables inputs when cashier lacks settings.manage permission", async () => {
      // Mock cashier without settings.manage permission
      useAuthStore.setState({
        role: "CASHIER",
        permissions: ["orders.view", "orders.create", "payments.create"],
      });

      render(
        <HashRouter>
          <SettingsPage />
        </HashRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Mode Hanya Baca:/i)).toBeInTheDocument();
      });

      const saveBtn = screen.getByRole("button", { name: /Simpan Pengaturan/i });
      expect(saveBtn).toBeDisabled();

      const input = screen.getByDisplayValue("FOODPOS Nusantara & Coffee");
      expect(input).toBeDisabled();
    });
  });
});
