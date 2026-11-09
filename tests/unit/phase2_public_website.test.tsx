import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, generateCartItemId, calculateUnitPrice } from "@/stores/cartStore";
import {
  generate256BitToken,
  hashTokenSHA256,
  storeService,
  MOCK_PRODUCTS,
} from "@/services/storeService";

describe("PHASE 2 — Public Website & Shopping Cart Logic", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("calculates unit price with variants and addons accurately", () => {
    const basePrice = 38000;
    const variant = { id: "v1", name: "Porsi Jumbo", priceAdjustment: 8000 };
    const addons = [
      { id: "a1", name: "Telur Ceplok", price: 5000 },
      { id: "a2", name: "Kerupuk Udang", price: 3000 },
    ];

    const unitPrice = calculateUnitPrice(basePrice, variant, addons);
    // 38000 + 8000 + 5000 + 3000 = 54000
    expect(unitPrice).toBe(54000);
  });

  it("generates deterministic composite cartItemId", () => {
    const id1 = generateCartItemId("prod-1", "var-1", [
      { id: "addon-b", name: "B", price: 1000 },
      { id: "addon-a", name: "A", price: 2000 },
    ]);
    const id2 = generateCartItemId("prod-1", "var-1", [
      { id: "addon-a", name: "A", price: 2000 },
      { id: "addon-b", name: "B", price: 1000 },
    ]);

    expect(id1).toBe(id2);
  });

  it("manages cart lifecycle: addItem, updateQuantity, removeItem, clearCart", () => {
    const store = useCartStore.getState();

    // Add first item
    store.addItem({
      productId: "prod-1",
      name: "Nasi Goreng Spesial",
      basePrice: 38000,
      variant: null,
      addons: [],
      quantity: 2,
      itemNotes: "Pedas sedang",
    });

    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getSubtotal()).toBe(76000);

    // Increase quantity
    const cartItemId = useCartStore.getState().items[0].cartItemId;
    useCartStore.getState().updateQuantity(cartItemId, 1);
    expect(useCartStore.getState().getTotalItems()).toBe(3);
    expect(useCartStore.getState().getSubtotal()).toBe(114000);

    // Decrease quantity
    useCartStore.getState().updateQuantity(cartItemId, -1);
    expect(useCartStore.getState().getTotalItems()).toBe(2);

    // Clear cart
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  it("generates 256-bit entropy token and computes SHA-256 hash", async () => {
    const token = generate256BitToken();
    expect(token).toMatch(/^trk_[a-f0-9]{64}$/); // 32 bytes = 64 hex chars

    const hash = await hashTokenSHA256(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 output is 64 hex chars
  });

  it("creates an online order and tracks it via secure token", async () => {
    const sampleProduct = MOCK_PRODUCTS[0];

    const orderPayload = {
      customerName: "Siti Rahma",
      customerPhone: "081298765432",
      serviceType: "DELIVERY" as const,
      deliveryAddress: "Jl. Melati No. 12, RT 01/02",
      paymentMethod: "QRIS" as const,
      notes: "Tolong segera diantar",
      items: [
        {
          cartItemId: "item-1",
          productId: sampleProduct.id,
          name: sampleProduct.name,
          basePrice: sampleProduct.base_price,
          unitPrice: sampleProduct.base_price,
          variant: null,
          addons: [],
          quantity: 2,
          itemNotes: "",
        },
      ],
    };

    const result = await storeService.createOrder(orderPayload);
    expect(result.success).toBe(true);
    expect(result.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(result.grandTotal).toBeGreaterThan(0);
    expect(result.trackingToken).toBeDefined();

    // Track the order using the raw token
    const trackResult = await storeService.trackOrder(result.trackingToken);
    expect(trackResult.success).toBe(true);
    expect(trackResult.order_number).toBe(result.orderNumber);
    expect(trackResult.order_status).toBe("NEW");
  });
});
