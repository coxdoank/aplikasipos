import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Clock, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-amber-500/15 via-primary/10 to-orange-500/5 py-16 sm:py-24 border-b">
        <div className="container mx-auto px-4 sm:px-8 text-center max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Sajian Spesial Berkualitas
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Nikmati Hidangan Terbaik dengan Rasa Autentik & Higienis
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Pesan langsung secara online untuk pengantaran cepat ke rumah Anda, atau pilih opsi ambil langsung di restoran kami tanpa perlu mengantre.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/menu">
              <Button size="lg" className="gap-2 font-bold shadow-md hover:shadow-lg">
                <ShoppingBag className="h-5 w-5" /> Pesan Sekarang
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" size="lg" className="font-semibold">
                Lacak Status Pesanan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights / Keunggulan */}
      <section className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Penyajian Cepat & Tepat</h3>
            <p className="text-sm text-muted-foreground">
              Pesanan langsung diproses di dapur secara realtime untuk menjaga kesegaran hidangan.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Bahan Pilihan & 100% Halal</h3>
            <p className="text-sm text-muted-foreground">
              Semua bahan baku dipilih dari supplier lokal terpercaya dengan standar kebersihan tinggi.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Delivery & Ambil di Toko</h3>
            <p className="text-sm text-muted-foreground">
              Bebas pilih metode penerimaan pesanan sesuai kebutuhan Anda dengan notifikasi otomatis.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Menu Teaser */}
      <section className="container mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b pb-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Favorit Pengunjung</span>
            <h2 className="text-2xl font-bold">Menu Pilihan Hari Ini</h2>
          </div>
          <Link to="/menu" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            Lihat Semua Menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: "1", name: "Nasi Goreng Spesial Resto", category: "Makanan Utama", price: 38000, desc: "Ayam suwir, telur mata sapi, kerupuk udang, acar segar" },
            { id: "2", name: "Ayam Bakar Madu Gurih", category: "Makanan Utama", price: 42000, desc: "Potongan ayam bakar bumbu madu khas dipanggang arang" },
            { id: "3", name: "Es Kopi Susu Gula Aren", category: "Minuman", price: 22000, desc: "Espresso robusta & arabika blend dengan sirup aren murni" },
            { id: "4", name: "Pisang Goreng Karamel Crispy", category: "Snack / Camilan", price: 20000, desc: "Pisang raja goreng krispi dengan lelehan saus karamel" },
          ].map((item) => (
            <div key={item.id} className="border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col justify-between p-5 hover:border-primary/50 transition-colors">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">{item.category}</span>
                <h4 className="font-bold text-base">{item.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="font-extrabold text-foreground">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}
                </span>
                <Link to="/menu">
                  <Button size="sm" variant="outline" className="text-xs">
                    Pilih Menu
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
