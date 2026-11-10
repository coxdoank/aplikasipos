import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, User, Phone, Mail, MapPin, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerItem, CustomerInput } from "@/services/customerService";

const customerSchema = z.object({
  name: z.string().min(2, "Nama pelanggan minimal 2 karakter").max(100, "Maksimal 100 karakter"),
  phone: z
    .string()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Maksimal 20 digit")
    .regex(/^[0-9+\-\s()]+$/, "Format nomor telepon tidak valid"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().max(300, "Maksimal 300 karakter").optional().or(z.literal("")),
  notes: z.string().max(300, "Maksimal 300 karakter").optional().or(z.literal("")),
  is_active: z.boolean(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  customer: CustomerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerInput) => Promise<void>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const isEditMode = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        reset({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
          address: customer.address || "",
          notes: customer.notes || "",
          is_active: customer.is_active,
        });
      } else {
        reset({
          name: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, customer, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (values: CustomerFormValues) => {
    await onSubmit({
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
      is_active: values.is_active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isEditMode ? "Ubah Data Pelanggan" : "Tambah Pelanggan Baru"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditMode ? `ID: ${customer?.id}` : "Daftarkan data kontak dan preferensi pelanggan"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Contoh: Budi Santoso"
                className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.name && (
                <p className="text-[11px] text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                No. Telepon / WhatsApp <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("phone")}
                placeholder="Contoh: 081234567890"
                className="w-full text-xs font-mono bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.phone && (
                <p className="text-[11px] text-destructive font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Alamat Email <span className="text-muted-foreground font-normal">(Opsional)</span>
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="Contoh: budi.santoso@gmail.com"
              className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.email && (
              <p className="text-[11px] text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Alamat Pengiriman Default <span className="text-muted-foreground font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              {...register("address")}
              placeholder="Contoh: Jl. Sudirman No. 45, RT 02/03, Gedung Plaza Tower Lt. 12..."
              className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            {errors.address && (
              <p className="text-[11px] text-destructive font-medium">{errors.address.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Catatan Preferensi / Alergi <span className="text-muted-foreground font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              {...register("notes")}
              placeholder="Contoh: Suka sambal dipisah, tidak pakai daun bawang, meja langganan outdoor..."
              className="w-full text-xs bg-background border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            {errors.notes && (
              <p className="text-[11px] text-destructive font-medium">{errors.notes.message}</p>
            )}
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div>
              <span className="text-xs font-semibold text-foreground block">Status Akun Pelanggan</span>
              <span className="text-[11px] text-muted-foreground">
                Pelanggan aktif dapat dicari dan dipilih saat kasir mencatat transaksi.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register("is_active")} className="sr-only peer" />
              <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isEditMode ? "Simpan Perubahan" : "Daftarkan Pelanggan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
