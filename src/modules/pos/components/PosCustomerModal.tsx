import React, { useState } from "react";
import { User, Phone, MapPin, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/stores/posStore";

interface PosCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABLE_OPTIONS = [
  "Meja 01", "Meja 02", "Meja 03", "Meja 04", "Meja 05",
  "Meja 06", "Meja 07", "Meja 08", "Meja 09", "Meja 10",
  "Area Bar 01", "Area Bar 02", "VIP Room 01", "Outdoor 01", "Outdoor 02"
];

export const PosCustomerModal: React.FC<PosCustomerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    customerName,
    customerPhone,
    tableNumber,
    serviceType,
    orderNotes,
    setCustomerName,
    setCustomerPhone,
    setTableNumber,
    setServiceType,
    setOrderNotes,
  } = usePosStore();

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [table, setTable] = useState(tableNumber);
  const [service, setService] = useState(serviceType);
  const [notes, setNotes] = useState(orderNotes);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerName(name.trim() || "Tamu Kasir");
    setCustomerPhone(phone.trim());
    setTableNumber(table);
    setServiceType(service);
    setOrderNotes(notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              Informasi Pelanggan & Meja
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Service Type Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Tipe Layanan Kasir:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setService("DINE_IN")}
                className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                  service === "DINE_IN"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                🍽️ Dine-in (Makan di Tempat)
              </button>
              <button
                type="button"
                onClick={() => setService("TAKEAWAY")}
                className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                  service === "TAKEAWAY"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                🛍️ Takeaway (Bungkus)
              </button>
              <button
                type="button"
                onClick={() => setService("DELIVERY")}
                className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                  service === "DELIVERY"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                🛵 Delivery (Kirim)
              </button>
              <button
                type="button"
                onClick={() => setService("PICKUP")}
                className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                  service === "PICKUP"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                🚶 Pickup (Ambil)
              </button>
            </div>
          </div>

          {/* Table Selection for Dine In */}
          {service === "DINE_IN" && (
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">Pilih Meja / Lokasi:</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border rounded-xl bg-muted/20">
                {TABLE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTable(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      table === t
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "bg-background border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Nama Pelanggan / Tamu:</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso atau Tamu Kasir"
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              />
            </div>
          </div>

          {/* Customer Phone (Optional) */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Nomor HP / WhatsApp (Opsional):</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx (untuk e-struk WhatsApp)"
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              />
            </div>
          </div>

          {/* Special Order Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Catatan Umum Pesanan:</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Sambal dipisah, minta sendok ekstra"
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 font-bold">
              <Check className="h-4 w-4" /> Simpan Data
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
