import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/public/PublicLayout";
import { BackofficeLayout } from "@/layouts/backoffice/BackofficeLayout";

// Public Store Pages
import { HomePage } from "@/modules/public-store/pages/HomePage";
import { MenuPage } from "@/modules/public-store/pages/MenuPage";
import { CartPage } from "@/modules/public-store/pages/CartPage";
import { CheckoutPage } from "@/modules/public-store/pages/CheckoutPage";
import { TrackOrderPage } from "@/modules/public-store/pages/TrackOrderPage";

// Backoffice Pages
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { PosPage } from "@/modules/pos/pages/PosPage";
import { OrdersPage } from "@/modules/orders/pages/OrdersPage";
import { ProductsPage } from "@/modules/products/pages/ProductsPage";
import { CategoriesPage } from "@/modules/categories/pages/CategoriesPage";
import { InventoryPage } from "@/modules/inventory/pages/InventoryPage";
import { ReportsPage } from "@/modules/reports/pages/ReportsPage";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";

// Shared Pages
import { NotFoundPage } from "@/components/shared/NotFoundPage";

export const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Storefront Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="track" element={<TrackOrderPage />} />
        </Route>

        {/* Backoffice Internal Routes */}
        <Route path="/backoffice" element={<BackofficeLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </HashRouter>
  );
};
