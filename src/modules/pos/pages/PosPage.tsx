import React, { useState, useEffect } from "react";
import { storeService, type PublicProduct, type PublicCategory } from "@/services/storeService";
import type { OrderDetail } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";
import { PosProductGrid } from "../components/PosProductGrid";
import { PosCartPanel } from "../components/PosCartPanel";
import { PosItemModal } from "../components/PosItemModal";
import { PosCustomerModal } from "../components/PosCustomerModal";
import { PosParkedBillsModal } from "../components/PosParkedBillsModal";
import { PosPaymentModal } from "../components/PosPaymentModal";
import { PosSuccessModal } from "../components/PosSuccessModal";

export const PosPage: React.FC = () => {
  const { profile } = useAuthStore();

  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isParkedBillsOpen, setIsParkedBillsOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Success state
  const [completedOrder, setCompletedOrder] = useState<OrderDetail | null>(null);
  const [lastCashReceived, setLastCashReceived] = useState<number>(0);
  const [lastChangeAmount, setLastChangeAmount] = useState<number>(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadCatalog = async () => {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          storeService.getCategories(),
          storeService.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleCustomizeProduct = (product: PublicProduct) => {
    setSelectedProduct(product);
    setIsItemModalOpen(true);
  };

  const handlePaymentSuccess = (
    order: OrderDetail,
    cashReceived: number,
    changeAmount: number
  ) => {
    setCompletedOrder(order);
    setLastCashReceived(cashReceived);
    setLastChangeAmount(changeAmount);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-3">
      {/* Shift Operator Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-muted/40 border text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">
            Sesi Kasir Aktif:
          </span>
          <span className="text-muted-foreground">
            {profile?.fullName || "Kasir Operasional"} (Shift 1)
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground hidden sm:block">
          FOODPOS Fast-Checkout POS Terminal v1.0
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
        {/* Left Column: Product Catalog & Fast Grid */}
        <PosProductGrid
          products={products}
          categories={categories}
          onCustomizeProduct={handleCustomizeProduct}
          isLoading={isLoading}
        />

        {/* Right Column: POS Cart & Checkout Panel */}
        <PosCartPanel
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
          onOpenParkedBills={() => setIsParkedBillsOpen(true)}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        />
      </div>

      {/* Item Customization Modal */}
      <PosItemModal
        product={selectedProduct}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
      />

      {/* Customer & Table Edit Modal */}
      <PosCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />

      {/* Parked / Held Bills Modal */}
      <PosParkedBillsModal
        isOpen={isParkedBillsOpen}
        onClose={() => setIsParkedBillsOpen(false)}
      />

      {/* Payment Processing Modal */}
      <PosPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Payment Success & Receipt Modal */}
      <PosSuccessModal
        order={completedOrder}
        cashReceived={lastCashReceived}
        changeAmount={lastChangeAmount}
        isOpen={isSuccessModalOpen}
        onNewOrder={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
};
