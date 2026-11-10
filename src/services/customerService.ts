import { supabase } from "@/lib/supabase";
import { orderService, type OrderDetail } from "./orderService";

export interface CustomerItem {
  id: string;
  outlet_id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderSummary {
  id: string;
  order_number: string;
  channel: "ONLINE" | "POS";
  service_type: string;
  order_status: string;
  grand_total: number;
  items_count: number;
  created_at: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenueFromCustomers: number;
  averageOrderValue: number;
  newCustomersThisMonth: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

const CUSTOMERS_KEY = "foodpos_customers_v1";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

const getInitialCustomers = (): CustomerItem[] => [
  {
    id: "cust-001",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    name: "Budi Santoso",
    phone: "081234567890",
    email: "budi.santoso@gmail.com",
    address: "Jl. Sudirman No. 45, RT 02/03, Jakarta Pusat",
    notes: "Pelanggan loyal makan siang kantor, suka sambal ekstra pedas",
    total_orders: 5,
    total_spent: 425000,
    last_order_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cust-002",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    name: "Siti Rahma",
    phone: "081345678901",
    email: "siti.rahma@gmail.com",
    address: "Jl. Gatot Subroto Kav. 51, Jakarta Selatan",
    notes: "Suka pesan paket hemat online untuk makan siang tim",
    total_orders: 3,
    total_spent: 247500,
    last_order_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cust-003",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    name: "Ahmad Fauzi",
    phone: "087798765432",
    email: "ahmad.fauzi@yahoo.com",
    address: "Jl. Melati Indah No. 12B, RT 03/05, Kebayoran Baru",
    notes: "Pelanggan delivery web, selalu pesan ayam bakar madu",
    total_orders: 2,
    total_spent: 170000,
    last_order_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "cust-004",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    name: "Dewi Lestari",
    phone: "081923456789",
    email: "dewi.lestari@outlook.com",
    address: "Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan",
    notes: "Langganan makan malam keluarga akhir pekan",
    total_orders: 4,
    total_spent: 310000,
    last_order_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: "cust-005",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    name: "Rian Pratama",
    phone: "081399887766",
    email: "rian.pratama@gmail.com",
    address: "Jl. Kemang Raya No. 10, Bangka, Mampang Prapatan",
    notes: "Pesanan takeaway lewat QRIS",
    total_orders: 1,
    total_spent: 45000,
    last_order_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

const loadCustomersFromStorage = (): CustomerItem[] => {
  if (typeof window === "undefined") return getInitialCustomers();
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      const initial = getInitialCustomers();
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialCustomers();
  } catch {
    return getInitialCustomers();
  }
};

const saveCustomersToStorage = (customers: CustomerItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch {
    // ignore
  }
};

export const customerService = {
  // 1. Get Customers with Filtering & Sorting
  async getCustomers(filters?: {
    search?: string;
    status?: "ALL" | "ACTIVE" | "INACTIVE";
    sortBy?: "name" | "total_spent" | "orders_count" | "recent";
  }): Promise<CustomerItem[]> {
    if (isConfiguredSupabase()) {
      try {
        let query = supabase.from("customers").select("*").order("name", { ascending: true });

        if (filters?.search && filters.search.trim()) {
          const q = filters.search.trim();
          query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          interface SupabaseCustomerRow {
            id: string;
            outlet_id: string;
            name: string;
            phone: string;
            email: string | null;
            address: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
          }

          return (data as unknown as SupabaseCustomerRow[]).map((row) => ({
            id: row.id,
            outlet_id: row.outlet_id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            notes: row.notes,
            total_orders: 0,
            total_spent: 0,
            is_active: true,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
        }
      } catch {
        // Fall back to local
      }
    }

    let customers = loadCustomersFromStorage();

    if (filters?.status && filters.status !== "ALL") {
      const isActiveTarget = filters.status === "ACTIVE";
      customers = customers.filter((c) => c.is_active === isActiveTarget);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sortBy = filters?.sortBy || "recent";
    customers.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "total_spent") {
        return b.total_spent - a.total_spent;
      }
      if (sortBy === "orders_count") {
        return b.total_orders - a.total_orders;
      }
      // recent order or created
      const timeA = new Date(a.last_order_at || a.created_at).getTime();
      const timeB = new Date(b.last_order_at || b.created_at).getTime();
      return timeB - timeA;
    });

    return customers;
  },

  // 2. Get Single Customer
  async getCustomerById(id: string): Promise<CustomerItem | null> {
    const customers = loadCustomersFromStorage();
    return customers.find((c) => c.id === id) || null;
  },

  // 3. Get Customer by Phone
  async getCustomerByPhone(phone: string): Promise<CustomerItem | null> {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const customers = loadCustomersFromStorage();
    return (
      customers.find((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone) || null
    );
  },

  // 4. Create New Customer
  async createCustomer(
    input: CustomerInput
  ): Promise<{ success: boolean; message: string; customer?: CustomerItem }> {
    const cleanPhone = input.phone.trim();
    if (!cleanPhone) {
      return { success: false, message: "Nomor telepon pelanggan wajib diisi." };
    }
    if (!input.name || !input.name.trim()) {
      return { success: false, message: "Nama pelanggan wajib diisi." };
    }

    const customers = loadCustomersFromStorage();
    const phoneExists = customers.some(
      (c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone.replace(/[^0-9]/g, "")
    );

    if (phoneExists) {
      return {
        success: false,
        message: `Nomor telepon ${cleanPhone} sudah terdaftar atas pelanggan lain.`,
      };
    }

    const now = new Date().toISOString();
    const newCustomer: CustomerItem = {
      id: `cust-${Date.now()}`,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      name: input.name.trim(),
      phone: cleanPhone,
      email: input.email ? input.email.trim() : null,
      address: input.address ? input.address.trim() : null,
      notes: input.notes ? input.notes.trim() : null,
      total_orders: 0,
      total_spent: 0,
      last_order_at: null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      created_at: now,
      updated_at: now,
    };

    customers.unshift(newCustomer);
    saveCustomersToStorage(customers);

    return {
      success: true,
      message: `Data pelanggan "${newCustomer.name}" berhasil didaftarkan.`,
      customer: newCustomer,
    };
  },

  // 5. Update Customer
  async updateCustomer(
    id: string,
    input: Partial<CustomerInput>
  ): Promise<{ success: boolean; message: string; customer?: CustomerItem }> {
    const customers = loadCustomersFromStorage();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, message: "Pelanggan tidak ditemukan." };
    }

    const current = customers[index];

    // If updating phone, check uniqueness
    if (input.phone) {
      const cleanPhone = input.phone.trim();
      const phoneExists = customers.some(
        (c) =>
          c.id !== id &&
          c.phone.replace(/[^0-9]/g, "") === cleanPhone.replace(/[^0-9]/g, "")
      );
      if (phoneExists) {
        return {
          success: false,
          message: `Nomor telepon ${cleanPhone} sudah digunakan oleh pelanggan lain.`,
        };
      }
    }

    const updatedCustomer: CustomerItem = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      phone: input.phone !== undefined ? input.phone.trim() : current.phone,
      email: input.email !== undefined ? (input.email ? input.email.trim() : null) : current.email,
      address:
        input.address !== undefined ? (input.address ? input.address.trim() : null) : current.address,
      notes: input.notes !== undefined ? (input.notes ? input.notes.trim() : null) : current.notes,
      is_active: input.is_active !== undefined ? input.is_active : current.is_active,
      updated_at: new Date().toISOString(),
    };

    customers[index] = updatedCustomer;
    saveCustomersToStorage(customers);

    return {
      success: true,
      message: `Profil pelanggan "${updatedCustomer.name}" berhasil diperbarui.`,
      customer: updatedCustomer,
    };
  },

  // 6. Delete Customer (with protection if order history exists)
  async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    const customers = loadCustomersFromStorage();
    const customer = customers.find((c) => c.id === id);
    if (!customer) {
      return { success: false, message: "Pelanggan tidak ditemukan." };
    }

    // Protection rule: Check order history
    if (customer.total_orders > 0) {
      return {
        success: false,
        message: `Pelanggan "${customer.name}" memiliki riwayat ${customer.total_orders} transaksi bernilai Rp ${customer.total_spent.toLocaleString(
          "id-ID"
        )}. Data pelanggan tidak dapat dihapus demi menjaga integritas pembukuan restoran. Gunakan opsi Nonaktifkan Pelanggan jika ingin menonaktifkannya.`,
      };
    }

    const filtered = customers.filter((c) => c.id !== id);
    saveCustomersToStorage(filtered);

    return {
      success: true,
      message: `Pelanggan "${customer.name}" berhasil dihapus.`,
    };
  },

  // 7. Get Customer Order History
  async getCustomerOrderHistory(
    customerId: string,
    customerPhone?: string
  ): Promise<OrderDetail[]> {
    const orders = await orderService.getOrders();
    const cleanPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, "") : "";

    return orders.filter(
      (o) =>
        o.customer_id === customerId ||
        (cleanPhone && o.customer_phone_snapshot.replace(/[^0-9]/g, "") === cleanPhone)
    );
  },

  // 8. Aggregated Statistics
  async getCustomerStats(): Promise<CustomerStats> {
    const customers = loadCustomersFromStorage();
    let totalRevenue = 0;
    let totalOrders = 0;
    let activeCustomers = 0;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let newCustomersThisMonth = 0;

    for (const c of customers) {
      if (c.is_active) activeCustomers++;
      totalRevenue += c.total_spent;
      totalOrders += c.total_orders;
      if (new Date(c.created_at).getTime() >= thisMonthStart) {
        newCustomersThisMonth++;
      }
    }

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalCustomers: customers.length,
      activeCustomers,
      totalRevenueFromCustomers: totalRevenue,
      averageOrderValue,
      newCustomersThisMonth,
    };
  },

  resetDemoCustomers(): void {
    saveCustomersToStorage(getInitialCustomers());
  },
};
