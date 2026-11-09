import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CartPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-4xl space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
        <p className="text-sm text-muted-foreground">Periksa item dan catatan pesanan Anda sebelum checkout.</p>
      </div>

      <div className="border rounded-xl p-12 text-center bg-card shadow-sm space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">Keranjang Masih Kosong</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Anda belum menambahkan menu ke dalam keranjang. Silakan jelajahi katalog menu lezat kami.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/menu">
            <Button className="gap-2">
              Jelajahi Menu Sekarang <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
