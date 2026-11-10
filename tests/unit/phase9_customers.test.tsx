import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { customerService } from "@/services/customerService";
import { orderService } from "@/services/orderService";
import { CustomersPage } from "@/modules/customers/pages/CustomersPage";
import { CustomerModal } from "@/modules/customers/components/CustomerModal";
import { CustomerDetailModal } from "@/modules/customers/components/CustomerDetailModal";
import { useAuthStore } from "@/stores/authStore";

describe("Phase 9: Customer Management & History", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    customerService.resetDemoCustomers();
    orderService.resetDemoOrders();

    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: "usr-admin-01", email: "admin@foodpos.local" },
      role: "ADMIN",
      permissions: [
        "orders.view",
        "orders.create",
        "users.manage",
      ],
      profile: {
        id: "usr-admin-01",
        fullName: "Ratna Sari (Manajer Resto)",
        email: "admin@foodpos.local",
      },
    });
  });

  describe("1. Customer Service Operations", () => {
    it("retrieves customers list with valid fields and metrics", async () => {
      const customers = await customerService.getCustomers();
      expect(customers.length).toBeGreaterThan(0);
      expect(customers[0].name).toBeDefined();
      expect(customers[0].phone).toBeDefined();
      expect(typeof customers[0].total_orders).toBe("number");
      expect(typeof customers[0].total_spent).toBe("number");
    });

    it("finds customer by ID and phone number", async () => {
      const foundById = await customerService.getCustomerById("cust-001");
      expect(foundById).not.toBeNull();
      expect(foundById?.name).toBe("Budi Santoso");

      const foundByPhone = await customerService.getCustomerByPhone("081234567890");
      expect(foundByPhone).not.toBeNull();
      expect(foundByPhone?.id).toBe("cust-001");
    });

    it("creates a new customer and rejects duplicate phone numbers", async () => {
      const res = await customerService.createCustomer({
        name: "Jessica Iskandar",
        phone: "085511223344",
        email: "jessica@gmail.com",
        address: "Jl. Senayan No. 10",
        notes: "Alergi kacang tanah",
      });

      expect(res.success).toBe(true);
      expect(res.customer?.name).toBe("Jessica Iskandar");
      expect(res.customer?.phone).toBe("085511223344");

      // Attempt duplicate phone
      const resDuplicate = await customerService.createCustomer({
        name: "Jessica Copy",
        phone: "085511223344",
      });

      expect(resDuplicate.success).toBe(false);
      expect(resDuplicate.message).toContain("sudah terdaftar");
    });

    it("updates existing customer profile and validates phone uniqueness", async () => {
      const res = await customerService.updateCustomer("cust-001", {
        address: "Jl. Sudirman No. 99, Baru",
        notes: "Minta sendok garpu kayu",
      });

      expect(res.success).toBe(true);
      expect(res.customer?.address).toBe("Jl. Sudirman No. 99, Baru");
      expect(res.customer?.notes).toBe("Minta sendok garpu kayu");

      // Attempt changing phone to an already existing phone
      const resPhoneConflict = await customerService.updateCustomer("cust-001", {
        phone: "081345678901", // owned by cust-002
      });

      expect(resPhoneConflict.success).toBe(false);
      expect(resPhoneConflict.message).toContain("sudah digunakan");
    });

    it("protects customer with order history from deletion", async () => {
      // cust-001 has total_orders: 5
      const res = await customerService.deleteCustomer("cust-001");
      expect(res.success).toBe(false);
      expect(res.message).toContain("tidak dapat dihapus demi menjaga integritas");

      // Verify customer still exists
      const cust = await customerService.getCustomerById("cust-001");
      expect(cust).not.toBeNull();
    });

    it("deletes customer without order history successfully", async () => {
      // Create new customer with 0 orders
      const created = await customerService.createCustomer({
        name: "Pelanggan Baru Bersih",
        phone: "089900001111",
      });

      expect(created.success).toBe(true);
      const delRes = await customerService.deleteCustomer(created.customer!.id);
      expect(delRes.success).toBe(true);

      const check = await customerService.getCustomerById(created.customer!.id);
      expect(check).toBeNull();
    });

    it("retrieves order history associated with customer", async () => {
      const orders = await customerService.getCustomerOrderHistory(
        "cust-001",
        "081234567890"
      );
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0].customer_name_snapshot).toBeDefined();
    });

    it("calculates customer directory statistics correctly", async () => {
      const stats = await customerService.getCustomerStats();
      expect(stats.totalCustomers).toBeGreaterThan(0);
      expect(stats.activeCustomers).toBeGreaterThan(0);
      expect(stats.totalRevenueFromCustomers).toBeGreaterThan(0);
      expect(stats.averageOrderValue).toBeGreaterThan(0);
    });
  });

  describe("2. CustomersPage UI Component", () => {
    it("renders page header, KPI cards, and customer table", async () => {
      render(
        <HashRouter>
          <CustomersPage />
        </HashRouter>
      );

      expect(await screen.findByText("Manajemen & Direktori Pelanggan")).toBeInTheDocument();
      expect(screen.getByText("Total Pelanggan Terdaftar")).toBeInTheDocument();
      expect(screen.getByText("Total Omset dari Pelanggan")).toBeInTheDocument();
      expect(screen.getByText("Rata-rata Order (AOV)")).toBeInTheDocument();
      expect(screen.getByText("Pelanggan Baru Bulan Ini")).toBeInTheDocument();
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
      expect(screen.getByText("081234567890")).toBeInTheDocument();
    });

    it("filters customer directory by search query", async () => {
      render(
        <HashRouter>
          <CustomersPage />
        </HashRouter>
      );

      await screen.findByText("Manajemen & Direktori Pelanggan");
      await screen.findByText("Budi Santoso");

      const searchInput = screen.getByPlaceholderText(/Cari nama, no\. telepon/);
      fireEvent.change(searchInput, { target: { value: "Siti Rahma" } });

      await waitFor(() => {
        expect(screen.getByText("Siti Rahma")).toBeInTheDocument();
        expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();
      });
    });

    it("opens Add Customer modal on button click", async () => {
      render(
        <HashRouter>
          <CustomersPage />
        </HashRouter>
      );

      await screen.findByText("Manajemen & Direktori Pelanggan");

      const addBtn = screen.getByText("Tambah Pelanggan Baru");
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByText("Daftarkan Pelanggan")).toBeInTheDocument();
      });
    });
  });

  describe("3. Customer Modals Component Integration", () => {
    it("renders CustomerModal and validates mandatory fields", async () => {
      render(
        <CustomerModal
          customer={null}
          isOpen={true}
          onClose={() => {}}
          onSubmit={async () => {}}
        />
      );

      expect(screen.getByText("Tambah Pelanggan Baru")).toBeInTheDocument();

      const submitBtn = screen.getByText("Daftarkan Pelanggan");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Nama pelanggan minimal 2 karakter/)).toBeInTheDocument();
        expect(screen.getByText(/Nomor telepon minimal 8 digit/)).toBeInTheDocument();
      });
    });

    it("renders CustomerDetailModal with profile metrics and order history", async () => {
      const customer = await customerService.getCustomerById("cust-001");
      expect(customer).not.toBeNull();

      render(
        <CustomerDetailModal
          customer={customer}
          isOpen={true}
          onClose={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
      expect(screen.getByText("081234567890")).toBeInTheDocument();
      expect(screen.getByText("Total Transaksi")).toBeInTheDocument();
      expect(screen.getByText("Total Belanja (LTV)")).toBeInTheDocument();
      expect(screen.getByText("Rata-rata Order (AOV)")).toBeInTheDocument();
      expect(screen.getByText(/Riwayat Pesanan Pelanggan/)).toBeInTheDocument();
    });
  });
});
