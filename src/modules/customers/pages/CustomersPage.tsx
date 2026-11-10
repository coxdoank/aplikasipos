import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  TrendingUp,
  ShoppingBag,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  customerService,
  type CustomerItem,
  type CustomerStats,
  type CustomerInput,
} from "@/services/customerService";
import { CustomerModal } from "../components/CustomerModal";
import { CustomerDetailModal } from "../components/CustomerDetailModal";

export const CustomersPage: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission("orders.create") || hasPermission("users.manage");

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenueFromCustomers: 0,
    averageOrderValue: 0,
    newCustomersThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "total_spent" | "orders_count" | "recent">("recent");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<CustomerItem | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [custList, statData] = await Promise.all([
        customerService.getCustomers({
          search: searchQuery,
          status: statusFilter,
          sortBy,
        }),
        customerService.getCustomerStats(),
      ]);
      setCustomers(custList);
      setStats(statData);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CustomerItem) => {
    setEditingCustomer(c);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: CustomerInput) => {
    setNotificationMessage(null);
    if (editingCustomer) {
      const res = await customerService.updateCustomer(editingCustomer.id, data);
      if (res.success) {
        setNotificationMessage({ type: "success", text: res.message });
        setIsModalOpen(false);
        loadData();
      } else {
        setNotificationMessage({ type: "error", text: res.message });
      }
    } else {
      const res = await customerService.createCustomer(data);
      if (res.success) {
        setNotificationMessage({ type: "success", text: res.message });
        setIsModalOpen(false);
        loadData();
      } else {
        setNotificationMessage({ type: "error", text: res.message });
      }
    }
  };

  const handleDelete = async (customer: CustomerItem) => {
    if (window.confirm(`Hapus data pelanggan "${customer.name}"?`)) {
      setNotificationMessage(null);
      const res = await customerService.deleteCustomer(customer.id);
      if (res.success) {
        setNotificationMessage({ type: "success", text: res.message });
        loadData();
      } else {
        setNotificationMessage({ type: "error", text: res.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen & Direktori Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola database kontak pelanggan, riwayat belanja akumulasi (LTV), dan preferensi layanan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="text-xs gap-1.5 font-semibold"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tambah Pelanggan Baru
            </Button>
          )}
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notificationMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            notificationMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <span>{notificationMessage.text}</span>
          <button
            onClick={() => setNotificationMessage(null)}
            className="text-[11px] underline ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Pelanggan Terdaftar</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{stats.totalCustomers}</div>
          <p className="text-[11px] text-muted-foreground">
            {stats.activeCustomers} aktif berbelanja
          </p>
        </div>

        {/* Total Revenue From Customers */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Omset dari Pelanggan</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(stats.totalRevenueFromCustomers)}
          </div>
          <p className="text-[11px] text-muted-foreground">Akumulasi seluruh transaksi profil</p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rata-rata Order (AOV)</span>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(stats.averageOrderValue)}
          </div>
          <p className="text-[11px] text-muted-foreground">Per transaksi belanja per orang</p>
        </div>

        {/* New Customers */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pelanggan Baru Bulan Ini</span>
            <UserPlus className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            +{stats.newCustomersThisMonth}
          </div>
          <p className="text-[11px] text-muted-foreground">Registrasi profil kasir & online</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, no. telepon, email, atau alamat..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Pelanggan Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "total_spent" | "orders_count" | "recent")
            }
            className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
          >
            <option value="recent">Terakhir Transaksi</option>
            <option value="total_spent">Total Belanja Terbanyak</option>
            <option value="orders_count">Jumlah Order Terbanyak</option>
            <option value="name">Nama (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Kontak (Telepon & Email)</th>
                <th className="py-3 px-4">Alamat & Catatan</th>
                <th className="py-3 px-4 text-center">Total Order</th>
                <th className="py-3 px-4 text-right">Total Belanja (LTV)</th>
                <th className="py-3 px-4 text-right">Order Terakhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-semibold text-sm">Tidak ada pelanggan ditemukan</p>
                    <p className="text-xs text-muted-foreground">Coba ubah kata kunci atau filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const initials = c.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Initials */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block text-sm">{c.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {c.is_active ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <XCircle className="h-2.5 w-2.5" /> Nonaktif
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </div>
                        )}
                      </td>

                      {/* Address & Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        {c.address ? (
                          <p className="truncate text-foreground text-[11px]" title={c.address}>
                            {c.address}
                          </p>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                        {c.notes && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded mt-0.5 truncate max-w-full"
                            title={c.notes}
                          >
                            <FileText className="h-2.5 w-2.5 shrink-0" /> {c.notes}
                          </span>
                        )}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-foreground text-sm">
                          {c.total_orders}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">transaksi</span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-extrabold text-primary text-sm">
                          {formatCurrency(c.total_spent)}
                        </span>
                      </td>

                      {/* Last Order */}
                      <td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
                        {formatDate(c.last_order_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailCustomer(c)}
                            title="Lihat Riwayat & Profil"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(c)}
                                title="Ubah Profil"
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(c)}
                                title="Hapus Pelanggan"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerModal
        customer={editingCustomer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        customer={detailCustomer}
        isOpen={Boolean(detailCustomer)}
        onClose={() => setDetailCustomer(null)}
        onEdit={(cust) => {
          setDetailCustomer(null);
          handleOpenEdit(cust);
        }}
      />
    </div>
  );
};
