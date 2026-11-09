import React from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockOrders = [
  { id: "ORD-20261109-001", customer: "Budi Santoso", channel: "Dine-in", total: 115000, status: "PROCESSING", payment: "PAID", time: "19:30 WIB" },
  { id: "ORD-20261109-002", customer: "Siti Rahma", channel: "Takeaway", total: 42000, status: "READY", payment: "PAID", time: "19:42 WIB" },
  { id: "ORD-20261109-003", customer: "Ahmad Fauzi", channel: "Online Delivery", total: 85000, status: "NEW", payment: "PAID", time: "20:05 WIB" },
  { id: "ORD-20261109-004", customer: "Dewi Lestari", channel: "Dine-in", total: 64000, status: "COMPLETED", payment: "PAID", time: "18:50 WIB" },
];

export const OrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pesanan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola dan pantau seluruh alur pesanan dari kasir dan pemesanan online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" /> Filter Status
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari ID pesanan atau nama..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">ID Pesanan</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Layanan</th>
                <th className="p-3.5">Waktu</th>
                <th className="p-3.5">Total Tagihan</th>
                <th className="p-3.5">Status Pembayaran</th>
                <th className="p-3.5">Status Pesanan</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5 font-mono font-bold">{ord.id}</td>
                  <td className="p-3.5 font-medium">{ord.customer}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] font-semibold">
                      {ord.channel}
                    </span>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{ord.time}</td>
                  <td className="p-3.5 font-bold">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(ord.total)}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                      {ord.payment}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      ord.status === "COMPLETED"
                        ? "bg-muted text-muted-foreground"
                        : ord.status === "READY"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : ord.status === "PROCESSING"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-blue-500/10 text-blue-600"
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
