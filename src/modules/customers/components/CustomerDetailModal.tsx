import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingBag,
  Receipt,
  Clock,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  customerService,
  type CustomerItem,
} from "@/services/customerService";
import type { OrderDetail } from "@/services/orderService";

interface CustomerDetailModalProps {
  customer: CustomerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: CustomerItem) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setIsLoading(true);
      customerService
        .getCustomerOrderHistory(customer.id, customer.phone)
        .then((data) => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Belum pernah transaksi";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const averageOrderValue =
    customer.total_orders > 0
      ? Math.round(customer.total_spent / customer.total_orders)
      : 0;

  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
                {customer.is_active ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AKTIF
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                    NONAKTIF
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Terdaftar sejak {formatDate(customer.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="text-xs gap-1.5 h-8"
            >
              <Edit2 className="h-3 w-3" />
              Edit Profil
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Contact Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/30 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block">No. Telepon</span>
                <span className="font-mono font-bold text-foreground">{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block">Email</span>
                <span className="text-foreground truncate block">{customer.email || "-"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-1">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Order Terakhir</span>
                <span className="text-foreground font-semibold">
                  {customer.last_order_at ? formatDate(customer.last_order_at) : "-"}
                </span>
              </div>
            </div>

            {customer.address && (
              <div className="sm:col-span-3 pt-2 border-t border-border/60 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Alamat Pengiriman Default</span>
                  <span className="text-foreground">{customer.address}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes Alert if present */}
          {customer.notes && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-start gap-2 text-amber-900 dark:text-amber-200">
              <FileText className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold block text-[11px]">Catatan Preferensi / Alergi:</span>
                <p className="italic">{customer.notes}</p>
              </div>
            </div>
          )}

          {/* 4 Financial Metrics for Customer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-border bg-card text-center space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Total Transaksi</span>
              <span className="text-lg font-black text-foreground">{customer.total_orders}</span>
              <span className="text-[10px] text-muted-foreground block">kali belanja</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card text-center space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Total Belanja (LTV)</span>
              <span className="text-sm font-black text-primary block mt-1">
                {formatCurrency(customer.total_spent)}
              </span>
              <span className="text-[10px] text-muted-foreground block">akumulasi omset</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card text-center space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Rata-rata Order (AOV)</span>
              <span className="text-sm font-black text-emerald-600 block mt-1">
                {formatCurrency(averageOrderValue)}
              </span>
              <span className="text-[10px] text-muted-foreground block">per transaksi</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card text-center space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Status Pelanggan</span>
              <span className="text-xs font-bold text-foreground block mt-1">
                {customer.total_orders >= 5
                  ? "Loyal VIP"
                  : customer.total_orders >= 2
                  ? "Reguler"
                  : "Baru"}
              </span>
              <span className="text-[10px] text-muted-foreground block">kategori profil</span>
            </div>
          </div>

          {/* Order History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Riwayat Pesanan Pelanggan ({orders.length})
              </h3>
              <span className="text-xs text-muted-foreground">POS & Online</span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Memuat riwayat transaksi...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <Receipt className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                  <p className="font-semibold">Belum ada riwayat pesanan tercatat</p>
                  <p className="text-[11px]">
                    Transaksi di kasir atau online dengan nomor telepon ini akan muncul otomatis.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5 px-3">No. Pesanan</th>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Saluran</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Total Belanja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/30">
                          <td className="py-2.5 px-3 font-mono font-bold">{o.order_number}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {formatDate(o.created_at)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                              {o.channel} • {o.service_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">
                              {o.order_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-foreground">
                            {formatCurrency(o.grand_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
