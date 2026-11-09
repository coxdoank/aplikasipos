import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Star,
  Tag,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { storeService, type PublicProduct } from "@/services/storeService";
import { ProductDetailModal } from "@/modules/public-store/components/ProductDetailModal";

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<PublicProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const prods = await storeService.getProducts();
        setFeaturedProducts(prods.slice(0, 4));
      } catch (e) {
        console.error("Gagal memuat produk unggulan:", e);
      }
    }
    loadFeatured();
  }, []);

  const handleOpenDetail = (prod: PublicProduct) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-500/15 via-primary/10 to-orange-500/5 py-16 sm:py-24 border-b">
        <div className="container mx-auto px-4 sm:px-8 text-center max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Restoran & Cafe Modern Pilihan Keluarga
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            Nikmati Hidangan Nusantara dengan Cita Rasa Autentik
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Pesan langsung secara online untuk pengantaran cepat ke rumah Anda, atau pilih opsi ambil langsung di gerai kami tanpa perlu antre di kasir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/menu">
              <Button size="lg" className="gap-2 font-bold shadow-lg h-12 px-8 text-base">
                <ShoppingBag className="h-5 w-5" /> Pesan Menu Sekarang
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" size="lg" className="font-semibold h-12 px-6">
                Lacak Status Pesanan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Promotional Banner */}
      <section className="container mx-auto px-4 sm:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-primary text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Tag className="h-3.5 w-3.5" /> Promo Spesial Bulan Ini
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Diskon 15% untuk Pesanan Pertama via Online!
            </h2>
            <p className="text-sm opacity-90 max-w-xl">
              Gunakan kesempatan untuk mencicipi Nasi Goreng Spesial Resto dan Es Kopi Susu Gula Aren dengan harga promo menarik.
            </p>
          </div>
          <Link to="/menu" className="shrink-0">
            <Button size="lg" variant="secondary" className="font-bold shadow-md text-foreground">
              Klaim Promo di Menu <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. Value Propositions */}
      <section className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Penyajian Cepat & Higienis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pesanan online langsung diteruskan ke layar dapur kasir secara realtime untuk menjamin hidangan disajikan selalu segar dan hangat.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Bahan Segar 100% Halal</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seluruh bahan baku daging dan sayuran dipilih dari pemasok lokal terpercaya dengan standar kontrol kebersihan ketat setiap hari.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Delivery Cepat & Dine-in Nyaman</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pilih opsi pengantaran ke tempat tinggal Anda atau reservasi makan di tempat dengan suasana restoran yang nyaman ber-AC.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Featured Menu Catalog Teaser */}
      <section className="container mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b pb-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Favorit Pelanggan</span>
            <h2 className="text-2xl font-bold tracking-tight">Menu Terpopuler Minggu Ini</h2>
          </div>
          <Link to="/menu" className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            Lihat Seluruh Menu ({featuredProducts.length > 0 ? "Tersedia" : "Memuat..."}) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="group border rounded-2xl bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                  {item.category_name || "Menu Unggulan"}
                </span>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description || "Menu spesial lezat siap saji dari dapur kami."}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Harga</span>
                  <span className="font-black text-sm text-foreground">
                    {formatRupiah(item.base_price)}
                  </span>
                </div>
                <Button size="sm" className="gap-1 text-xs font-bold">
                  <Plus className="h-3.5 w-3.5" /> Pilih
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Customer Feedback / Review Architecture */}
      <section className="container mx-auto px-4 sm:px-8">
        <div className="border rounded-3xl p-8 bg-card shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Ulasan & Kepuasan</span>
            <h2 className="text-2xl font-bold">Apa Kata Pelanggan Kami?</h2>
            <p className="text-xs text-muted-foreground">Ulasan nyata dari pelanggan yang memesan secara online dan dine-in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Dewi Anggraini", rating: 5, comment: "Nasi goreng spesialnya enak banget, porsinya pas dan pengantarannya super cepat!", menu: "Nasi Goreng Spesial" },
              { name: "Reza Pratama", rating: 5, comment: "Es kopi susu gula arennya mantap, kopinya berasa dan manis arennya alami. Langganan!", menu: "Es Kopi Susu Aren" },
              { name: "Hendra Wijaya", rating: 5, comment: "Ayam bakar bumbu madu empuk sampai ke tulang. Packaging rapi dan higienis.", menu: "Ayam Bakar Madu" },
            ].map((rev, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-foreground italic">&ldquo;{rev.comment}&rdquo;</p>
                <div className="pt-1 text-[11px] text-muted-foreground font-medium">
                  — <span className="font-bold text-foreground">{rev.name}</span> ({rev.menu})
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Contact, Store Location & WhatsApp Details */}
      <section className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border rounded-3xl p-8 bg-card shadow-sm">
          <div className="space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Lokasi & Kontak Kami</span>
            <h2 className="text-2xl font-bold">Kunjungi Outlet Pusat Kami</h2>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground text-sm">Alamat Gerai:</p>
                  <p>Jl. Kuliner Rasa No. 88, Kebayoran Baru, Jakarta Selatan 12180</p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold mt-1 inline-block"
                  >
                    Buka Petunjuk Arah di Google Maps &rarr;
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground text-sm">Jam Operasional:</p>
                  <p>Senin s/d Minggu: 10:00 - 22:00 WIB (Buka Setiap Hari)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PhoneCall className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground text-sm">Layanan Bantuan Pelanggan:</p>
                  <p>WhatsApp: +62 812-3456-7890 | Email: order@foodpos.local</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Action Box */}
          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground">Punya Pesanan Khusus atau Katering?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kami juga melayani pemesanan nasi kotak untuk acara kantor, syukuran keluarga, dan pesta ulang tahun dengan harga khusus katering.
              </p>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20FOODPOS,%20saya%20ingin%20tanya%20menu%20dan%20pesanan"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button size="lg" className="w-full gap-2 font-bold shadow-md">
                <PhoneCall className="h-4 w-4" /> Hubungi CS WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
