import React, { useState } from "react";
import { Search, ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockCategories = ["Semua", "Makanan Utama", "Minuman", "Snack & Camilan", "Paket Hemat"];

const mockMenuItems = [
  { id: "1", name: "Nasi Goreng Spesial Resto", category: "Makanan Utama", price: 38000, desc: "Ayam suwir, telur mata sapi, kerupuk udang, acar segar", available: true },
  { id: "2", name: "Ayam Bakar Madu Gurih", category: "Makanan Utama", price: 42000, desc: "Potongan ayam bakar bumbu madu khas dipanggang arang", available: true },
  { id: "3", name: "Mie Goreng Seafood", category: "Makanan Utama", price: 45000, desc: "Mie kenyal dengan udang, cumi, dan sayuran segar", available: true },
  { id: "4", name: "Es Kopi Susu Gula Aren", category: "Minuman", price: 22000, desc: "Espresso robusta & arabika blend dengan sirup aren murni", available: true },
  { id: "5", name: "Ice Lychee Tea Segar", category: "Minuman", price: 24000, desc: "Teh melati wangi dengan buah leci utuh dan daun mint", available: true },
  { id: "6", name: "Pisang Goreng Karamel Crispy", category: "Snack & Camilan", price: 20000, desc: "Pisang raja goreng krispi dengan saus karamel legit", available: true },
  { id: "7", name: "Kentang Goreng Truffle", category: "Snack & Camilan", price: 28000, desc: "French fries renyah dengan taburan aroma truffle gurih", available: true },
  { id: "8", name: "Paket Kenyang Berdua", category: "Paket Hemat", price: 75000, desc: "2 Nasi Goreng + 2 Es Teh Manis + 1 Porsi Pisang Goreng", available: true },
];

export const MenuPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = mockMenuItems.filter((item) => {
    const matchesCat = selectedCategory === "Semua" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Katalog Menu Kami</h1>
        <p className="text-muted-foreground text-sm">
          Pilih menu favorit Anda dengan bahan segar pilihan setiap hari.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {mockCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari makanan atau minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="border rounded-xl bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-primary uppercase">{item.category}</span>
              <h3 className="font-bold text-base text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
            </div>

            <div className="mt-5 pt-4 border-t flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Harga</span>
                <span className="font-extrabold text-base text-foreground">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}
                </span>
              </div>
              <Button size="sm" className="gap-1 text-xs">
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <ShoppingBag className="h-10 w-10 mx-auto opacity-40" />
          <p className="font-semibold">Menu tidak ditemukan</p>
          <p className="text-xs">Coba gunakan kata kunci pencarian lain atau pilih kategori lain.</p>
        </div>
      )}
    </div>
  );
};
