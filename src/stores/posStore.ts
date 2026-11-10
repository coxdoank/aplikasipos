import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PosItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface PosItemVariant {
  id: string;
  name: string;
  price_adjustment?: number;
  priceAdjustment?: number;
}

export interface PosItem {
  posItemId: string; // Composite unique key: productId + variantId + sorted addonIds
  productId: string;
  sku: string;
  name: string;
  basePrice: number;
  unitPrice: number;
  variant: PosItemVariant | null;
  addons: PosItemAddon[];
  quantity: number;
  itemNotes: string;
  imageUrl?: string | null;
}

export interface ParkedCart {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  serviceType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP";
  orderNotes: string;
  items: PosItem[];
  subtotal: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

interface PosState {
  items: PosItem[];
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  serviceType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP";
  orderNotes: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;

  parkedCarts: ParkedCart[];

  // Actions
  addItem: (item: Omit<PosItem, "posItemId" | "unitPrice">) => void;
  updateQuantity: (posItemId: string, delta: number) => void;
  setQuantity: (posItemId: string, qty: number) => void;
  setItemNotes: (posItemId: string, notes: string) => void;
  removeItem: (posItemId: string) => void;
  clearCart: () => void;

  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setTableNumber: (table: string) => void;
  setServiceType: (service: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "PICKUP") => void;
  setOrderNotes: (notes: string) => void;
  setDiscount: (type: "PERCENTAGE" | "FIXED", value: number) => void;

  // Park & Resume
  holdCurrentCart: () => boolean;
  resumeParkedCart: (parkedCartId: string) => void;
  deleteParkedCart: (parkedCartId: string) => void;

  // Computed calculations
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number; // 10% PB1
  getGrandTotal: () => number;
  getTotalItemsCount: () => number;
}

export const generatePosItemId = (
  productId: string,
  variantId?: string | null,
  addons?: PosItemAddon[]
): string => {
  const sortedAddonIds = (addons || []).map((a) => a.id).sort().join(",");
  return `${productId}_${variantId || "novar"}_${sortedAddonIds || "noadd"}`;
};

export const calculatePosUnitPrice = (
  basePrice: number,
  variant: PosItemVariant | null,
  addons: PosItemAddon[]
): number => {
  const variantAdj = variant ? (variant.price_adjustment ?? variant.priceAdjustment ?? 0) : 0;
  const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
  return basePrice + variantAdj + addonsTotal;
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      customerName: "Tamu Kasir",
      customerPhone: "",
      tableNumber: "Meja 01",
      serviceType: "DINE_IN",
      orderNotes: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      parkedCarts: [],

      addItem: (item) => {
        const unitPrice = calculatePosUnitPrice(
          item.basePrice,
          item.variant,
          item.addons
        );
        const posItemId = generatePosItemId(
          item.productId,
          item.variant?.id,
          item.addons
        );

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.posItemId === posItemId
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + item.quantity,
              itemNotes: item.itemNotes || updated[existingIndex].itemNotes,
            };
            return { items: updated };
          }

          const newItem: PosItem = {
            ...item,
            posItemId,
            unitPrice,
          };
          return { items: [...state.items, newItem] };
        });
      },

      updateQuantity: (posItemId, delta) => {
        set((state) => {
          const updated = state.items
            .map((item) => {
              if (item.posItemId === posItemId) {
                const nextQty = item.quantity + delta;
                return nextQty > 0 ? { ...item, quantity: nextQty } : null;
              }
              return item;
            })
            .filter(Boolean) as PosItem[];

          return { items: updated };
        });
      },

      setQuantity: (posItemId, qty) => {
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.posItemId !== posItemId) };
          }
          return {
            items: state.items.map((i) =>
              i.posItemId === posItemId ? { ...i, quantity: qty } : i
            ),
          };
        });
      },

      setItemNotes: (posItemId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.posItemId === posItemId ? { ...i, itemNotes: notes } : i
          ),
        }));
      },

      removeItem: (posItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.posItemId !== posItemId),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          customerName: "Tamu Kasir",
          customerPhone: "",
          tableNumber: "Meja 01",
          serviceType: "DINE_IN",
          orderNotes: "",
          discountType: "PERCENTAGE",
          discountValue: 0,
        });
      },

      setCustomerName: (name) => set({ customerName: name }),
      setCustomerPhone: (phone) => set({ customerPhone: phone }),
      setTableNumber: (table) => set({ tableNumber: table }),
      setServiceType: (service) => set({ serviceType: service }),
      setOrderNotes: (notes) => set({ orderNotes: notes }),
      setDiscount: (type, value) => set({ discountType: type, discountValue: Math.max(0, value) }),

      holdCurrentCart: () => {
        const { items, customerName, customerPhone, tableNumber, serviceType, orderNotes, discountType, discountValue } = get();
        if (items.length === 0) return false;

        const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const newParkedCart: ParkedCart = {
          id: `parked-${Date.now()}`,
          createdAt: new Date().toISOString(),
          customerName: customerName || "Tamu Kasir",
          customerPhone,
          tableNumber,
          serviceType,
          orderNotes,
          items: [...items],
          subtotal,
          discountType,
          discountValue,
        };

        set((state) => ({
          parkedCarts: [newParkedCart, ...state.parkedCarts],
          items: [],
          customerName: "Tamu Kasir",
          customerPhone: "",
          tableNumber: "Meja 01",
          serviceType: "DINE_IN",
          orderNotes: "",
          discountType: "PERCENTAGE",
          discountValue: 0,
        }));

        return true;
      },

      resumeParkedCart: (parkedCartId) => {
        const { parkedCarts } = get();
        const target = parkedCarts.find((p) => p.id === parkedCartId);
        if (!target) return;

        set((state) => ({
          items: target.items,
          customerName: target.customerName,
          customerPhone: target.customerPhone,
          tableNumber: target.tableNumber,
          serviceType: target.serviceType,
          orderNotes: target.orderNotes,
          discountType: target.discountType,
          discountValue: target.discountValue,
          parkedCarts: state.parkedCarts.filter((p) => p.id !== parkedCartId),
        }));
      },

      deleteParkedCart: (parkedCartId) => {
        set((state) => ({
          parkedCarts: state.parkedCarts.filter((p) => p.id !== parkedCartId),
        }));
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const { discountType, discountValue } = get();
        if (discountValue <= 0) return 0;
        if (discountType === "PERCENTAGE") {
          return Math.round((subtotal * Math.min(100, discountValue)) / 100);
        }
        return Math.min(subtotal, discountValue);
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const taxable = Math.max(0, subtotal - discount);
        return Math.round(taxable * 0.1); // 10% PB1
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const tax = get().getTaxAmount();
        return Math.max(0, subtotal - discount + tax);
      },

      getTotalItemsCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "foodpos_pos_cart_storage",
    }
  )
);
