import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { UtensilsCrossed, ShoppingBag, Search, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Announcement Bar */}
      <div className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground flex items-center justify-center gap-2">
        <span>🎉 Selamat Datang di Restoran Kami! Buka Setiap Hari: 10:00 - 22:00 WIB</span>
        <span className="hidden sm:inline">|</span>
        <a 
          href="https://wa.me/6281234567890" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline hover:text-white flex items-center gap-1 font-semibold"
        >
          <PhoneCall className="w-3 h-3" /> WhatsApp Order
        </a>
      </div>

      {/* Main Public Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-foreground">
                  FOOD<span className="text-primary">POS</span>
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Resto & Cafe
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/"
                className={`transition-colors hover:text-primary ${
                  location.pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Beranda
              </Link>
              <Link
                to="/menu"
                className={`transition-colors hover:text-primary ${
                  location.pathname === "/menu" ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Katalog Menu
              </Link>
              <Link
                to="/track"
                className={`transition-colors hover:text-primary ${
                  location.pathname === "/track" ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Lacak Pesanan
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/menu">
              <Button variant="ghost" size="icon" aria-label="Cari Menu">
                <Search className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>

            <Link to="/cart">
              <Button variant="outline" size="sm" className="relative gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Keranjang</span>
                <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 font-bold">
                  {totalItems}
                </span>
              </Button>
            </Link>

            <Link to="/backoffice">
              <Button variant="default" size="sm" className="font-medium text-xs">
                Backoffice
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 text-muted-foreground">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg text-foreground">FOODPOS</span>
              </div>
              <p className="text-sm">
                Sistem Point of Sale dan manajemen kuliner modern terintegrasi, cepat, dan handal.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Navigasi</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-primary">Beranda</Link></li>
                <li><Link to="/menu" className="hover:text-primary">Daftar Menu</Link></li>
                <li><Link to="/track" className="hover:text-primary">Status Pesanan</Link></li>
                <li><Link to="/cart" className="hover:text-primary">Keranjang Belanja</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Jam Operasional</h4>
              <p className="text-sm">Senin - Minggu: 10:00 - 22:00 WIB</p>
              <p className="text-sm mt-2 text-primary font-medium">Layanan Delivery & Dine-in</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Kontak & Lokasi</h4>
              <p className="text-sm">Jl. Kuliner Rasa No. 88, Jakarta Selatan</p>
              <p className="text-sm mt-1">WA: +62 812-3456-7890</p>
              <p className="text-sm">Email: info@foodpos.local</p>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-xs">
            © {new Date().getFullYear()} FOODPOS — All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
