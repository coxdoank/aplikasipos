import React, { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const mockPosProducts = [
  { id: "1", name: "Nasi Goreng Spesial", price: 38000, category: "Makanan" },
  { id: "2", name: "Ayam Bakar Madu", price: 42000, category: "Makanan" },
  { id: "3", name: "Mie Goreng Seafood", price: 45000, category: "Makanan" },
  { id: "4", name: "Es Kopi Susu Aren", price: 22000, category: "Minuman" },
  { id: "5", name: "Ice Lychee Tea", price: 24000, category: "Minuman" },
  { id: "6", name: "Pisang Goreng Karamel", price: 20000, category: "Snack" },
  { id: "7", name: "Kentang Goreng Truffle", price: 28000, category: "Snack" },
  { id: "8", name: "Jus Alpukat Kocok", price: 25000, category: "Minuman" },
];

export const PosPage: React.FC = () => {
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([
    { id: "1", name: "Nasi Goreng Spesial", price: 38000, qty: 1 },
    { id: "4", name: "Es Kopi Susu Aren", price: 22000, qty: 2 },
  ]);
  const [receivedCash, setReceivedCash] = useState<number>(100000);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.1); // 10% tax
  const grandTotal = subtotal + tax;
  const change = Math.max(0, receivedCash - grandTotal);

  const handleQuickCash = (amount: number) => {
    setReceivedCash((prev) => prev + amount);
  };

  const handleExactCash = () => {
    setReceivedCash(grandTotal);
  };

  const handleResetCash = () => {
    setReceivedCash(0);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { id: string; name: string; price: number; qty: number }[]
    );
  };

  const addToCart = (product: typeof mockPosProducts[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Left: Product Catalog & Fast Selector */}
      <div className="flex-1 flex flex-col border rounded-xl bg-card overflow-hidden shadow-sm">
        {/* Top Search & Filter */}
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between bg-muted/10">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["Semua", "Makanan", "Minuman", "Snack"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari item kasir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {mockPosProducts
            .filter(
              (p) =>
                (selectedCategory === "Semua" || p.category === selectedCategory) &&
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((prod) => (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-3 border rounded-lg text-left bg-background hover:border-primary hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{prod.category}</span>
                  <h4 className="font-semibold text-xs text-foreground line-clamp-2 mt-0.5">{prod.name}</h4>
                </div>
                <div className="mt-3 text-xs font-bold text-primary">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(prod.price)}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Right: Cart & Payment Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="font-bold text-sm">Pesanan Kasir Aktif</h3>
            <span className="text-[11px] text-muted-foreground">Order Ref: POS-{Date.now().toString().slice(-4)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCart([])}
            className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Kosongkan
          </Button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.map((item) => (
            <div key={item.id} className="p-2 border rounded-md bg-muted/10 flex items-center justify-between text-xs">
              <div className="flex-1 pr-2">
                <span className="font-semibold block">{item.name}</span>
                <span className="text-muted-foreground text-[11px]">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="h-6 w-6 rounded border bg-background flex items-center justify-center hover:bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-bold text-xs">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="h-6 w-6 rounded border bg-background flex items-center justify-center hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Belum ada item di kasir. Pilih menu di sebelah kiri.
            </div>
          )}
        </div>

        {/* Summary & Fast Payment Calculation */}
        <div className="p-4 border-t bg-muted/20 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pajak Restoran (10%):</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(tax)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-foreground pt-1 border-t">
              <span>Total Tagihan:</span>
              <span className="text-primary">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(grandTotal)}
              </span>
            </div>
          </div>

          {/* Quick Cash Buttons */}
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Uang Tunai Cepat:</span>
              <span className="font-mono text-foreground">
                Diterima: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(receivedCash)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[10000, 20000, 50000, 100000].map((denom) => (
                <button
                  key={denom}
                  onClick={() => handleQuickCash(denom)}
                  className="py-1 bg-background border rounded text-[11px] font-medium hover:bg-accent"
                >
                  +{denom / 1000}k
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                onClick={handleExactCash}
                className="py-1 bg-background border rounded text-[11px] font-bold text-primary hover:bg-accent"
              >
                Uang Pas
              </button>
              <button
                onClick={handleResetCash}
                className="py-1 bg-background border rounded text-[11px] text-muted-foreground hover:bg-accent flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>

          {/* Change Display */}
          <div className="p-2 rounded bg-background border flex justify-between items-center text-xs">
            <span className="font-semibold text-muted-foreground">Kembalian:</span>
            <span className={`font-bold ${receivedCash >= grandTotal ? "text-emerald-600" : "text-destructive"}`}>
              {receivedCash >= grandTotal
                ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(change)
                : "Kurang Pembayaran"}
            </span>
          </div>

          {/* Payment Actions */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            <Button size="sm" className="text-xs gap-1 font-semibold" disabled={cart.length === 0 || receivedCash < grandTotal}>
              <Banknote className="h-3.5 w-3.5" /> Tunai
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" disabled={cart.length === 0}>
              <QrCode className="h-3.5 w-3.5" /> QRIS
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" disabled={cart.length === 0}>
              <CreditCard className="h-3.5 w-3.5" /> EDC
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
