import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Utensils,
  Layers,
  Package,
  FileBarChart,
  Settings,
  Bell,
  Menu,
  X,
  Store,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Dashboard", path: "/backoffice", icon: LayoutDashboard },
  { label: "POS / Kasir", path: "/backoffice/pos", icon: ShoppingCart },
  { label: "Manajemen Pesanan", path: "/backoffice/orders", icon: Receipt },
  { label: "Produk & Menu", path: "/backoffice/products", icon: Utensils },
  { label: "Kategori", path: "/backoffice/categories", icon: Layers },
  { label: "Stok & Inventori", path: "/backoffice/inventory", icon: Package },
  { label: "Laporan Keuangan", path: "/backoffice/reports", icon: FileBarChart },
  { label: "Pengaturan Toko", path: "/backoffice/settings", icon: Settings },
];

export const BackofficeLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active page label for breadcrumb
  const currentItem = menuItems.find((item) => 
    item.path === location.pathname || 
    (item.path !== "/backoffice" && location.pathname.startsWith(item.path))
  );

  return (
    <div className="min-h-screen flex bg-muted/20 text-foreground">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Link to="/backoffice" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight">
                FOOD<span className="text-primary">POS</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Backoffice System
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu Operasional
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/backoffice"
                  ? location.pathname === "/backoffice"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Store Info at Bottom */}
        <div className="p-4 border-t bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Kasir / Administrator</p>
              <p className="text-xs text-muted-foreground truncate">Outlet Pusat (ID-01)</p>
            </div>
            <Link to="/">
              <Button variant="ghost" size="icon" title="Kembali ke Web Publik">
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Backoffice Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer" onClick={() => navigate("/backoffice")}>
                Backoffice
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-semibold text-foreground">
                {currentItem ? currentItem.label : "Halaman"}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="hidden sm:flex text-xs gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Lihat Toko Publik
              </Button>
            </Link>

            <Link to="/backoffice/pos">
              <Button variant="default" size="sm" className="text-xs gap-1.5 font-semibold">
                <ShoppingCart className="h-3.5 w-3.5" />
                Buka Kasir POS
              </Button>
            </Link>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
