import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItemVariant {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface CartItem {
  cartItemId: string; // Composite unique key: productId + variantId + addonIds
  productId: string;
  name: string;
  basePrice: number;
  unitPrice: number; // basePrice + variant.priceAdjustment + sum(addon.price)
  variant: CartItemVariant | null;
  addons: CartItemAddon[];
  quantity: number;
  itemNotes: string;
  imageUrl?: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartItemId" | "unitPrice">) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  setQuantity: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const generateCartItemId = (
  productId: string,
  variantId?: string | null,
  addons?: CartItemAddon[]
): string => {
  const sortedAddonIds = (addons || []).map((a) => a.id).sort().join(",");
  return `${productId}_${variantId || "novar"}_${sortedAddonIds || "noadd"}`;
};

export const calculateUnitPrice = (
  basePrice: number,
  variant: CartItemVariant | null,
  addons: CartItemAddon[]
): number => {
  const variantAdj = variant ? variant.priceAdjustment : 0;
  const addonsTotal = (addons || []).reduce((acc, a) => acc + a.price, 0);
  return basePrice + variantAdj + addonsTotal;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const unitPrice = calculateUnitPrice(newItem.basePrice, newItem.variant, newItem.addons);
        const cartItemId = generateCartItemId(
          newItem.productId,
          newItem.variant?.id,
          newItem.addons
        );

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.cartItemId === cartItemId);
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += newItem.quantity;
            if (newItem.itemNotes) {
              updated[existingIndex].itemNotes = newItem.itemNotes;
            }
            return { items: updated };
          }
          return {
            items: [
              ...state.items,
              {
                ...newItem,
                cartItemId,
                unitPrice,
              },
            ],
          };
        });
      },

      updateQuantity: (cartItemId, delta) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.cartItemId === cartItemId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[],
        }));
      },

      setQuantity: (cartItemId, qty) => {
        if (qty <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: qty } : item
          ),
        }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "foodpos-customer-cart",
    }
  )
);
