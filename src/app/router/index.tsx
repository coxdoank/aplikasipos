import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/public/PublicLayout";
import { BackofficeLayout } from "@/layouts/backoffice/BackofficeLayout";

// Public Store Pages
import { HomePage } from "@/modules/public-store/pages/HomePage";
import { MenuPage } from "@/modules/public-store/pages/MenuPage";
import { CartPage } from "@/modules/public-store/pages/CartPage";
import { CheckoutPage } from "@/modules/public-store/pages/CheckoutPage";
import { OrderConfirmationPage } from "@/modules/public-store/pages/OrderConfirmationPage";
import { TrackOrderPage } from "@/modules/public-store/pages/TrackOrderPage";

// Auth Pages
import { LoginPage } from "@/modules/auth/pages/LoginPage";

// Backoffice Pages
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { PosPage } from "@/modules/pos/pages/PosPage";
import { OrdersPage } from "@/modules/orders/pages/OrdersPage";
import { ProductsPage } from "@/modules/products/pages/ProductsPage";
import { CategoriesPage } from "@/modules/categories/pages/CategoriesPage";
import { InventoryPage } from "@/modules/inventory/pages/InventoryPage";
import { ReportsPage } from "@/modules/reports/pages/ReportsPage";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";

// Security & Shared Components
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
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
          <Route path="order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="track" element={<TrackOrderPage />} />
        </Route>

        {/* Backoffice Unauthenticated Login Route */}
        <Route path="/backoffice/login" element={<LoginPage />} />

        {/* Protected Backoffice Routes */}
        <Route
          path="/backoffice"
          element={
            <ProtectedRoute>
              <BackofficeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="pos"
            element={
              <ProtectedRoute requiredPermission="orders.create">
                <PosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute requiredPermission="orders.view">
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute requiredPermission="products.view">
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute requiredPermission="products.manage">
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <ProtectedRoute requiredPermission="inventory.adjust">
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredPermission="reports.view">
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute requiredPermission="settings.manage">
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </HashRouter>
  );
};
