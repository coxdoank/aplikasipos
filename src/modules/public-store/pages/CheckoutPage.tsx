import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CheckoutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-3xl space-y-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link to="/cart">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Checkout Pesanan</h1>
          <p className="text-sm text-muted-foreground">Lengkapi data penerima dan pilih metode pembayaran.</p>
        </div>
      </div>

      <div className="p-8 border rounded-xl bg-card text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Modul Checkout Online interaktif akan diaktifkan penuh pada Phase 2 sesuai urutan pengembangan sistem.
        </p>
        <Link to="/menu">
          <Button variant="outline" size="sm">Kembali ke Menu</Button>
        </Link>
      </div>
    </div>
  );
};
