import { supabase } from "@/lib/supabase";
import { catalogService, type ProductItem } from "./catalogService";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "REFUND";

export interface StockMovementItem {
  id: string;
  outlet_id?: string;
  product_id: string;
  product_name: string;
  sku: string;
  movement_type: StockMovementType;
  quantity_change: number; // positive for IN/REFUND, negative for OUT/SALE, delta for ADJUSTMENT
  previous_stock: number;
  new_stock: number;
  reference_id?: string | null;
  reason: string;
  actor_name: string;
  created_at: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalPhysicalStock: number;
  lowStockCount: number; // current_stock <= 10 && current_stock > 0
  outOfStockCount: number; // current_stock === 0
}

export interface StockAdjustmentInput {
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number; // for IN/OUT: amount to add/subtract. for ADJUSTMENT: final target count
  reason: string;
  referenceId?: string;
  actorName: string;
}

const STOCK_MOVEMENTS_KEY = "foodpos_stock_movements_v1";
export const LOW_STOCK_THRESHOLD = 10;

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

const getInitialMovements = (): StockMovementItem[] => [
  {
    id: "mov-init-001",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    product_id: "m0000000-0000-0000-0000-000000000001",
    product_name: "Nasi Goreng Spesial Resto",
    sku: "FOOD-001",
    movement_type: "IN",
    quantity_change: 50,
    previous_stock: 0,
    new_stock: 50,
    reference_id: "PO-20261109-001",
    reason: "Penerimaan stok awal dapur resto",
    actor_name: "Hendra Wijaya (Pemilik)",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mov-init-002",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    product_id: "m0000000-0000-0000-0000-000000000002",
    product_name: "Ayam Bakar Madu Gurih",
    sku: "FOOD-002",
    movement_type: "IN",
    quantity_change: 40,
    previous_stock: 0,
    new_stock: 40,
    reference_id: "PO-20261109-001",
    reason: "Penerimaan stok awal dapur resto",
    actor_name: "Hendra Wijaya (Pemilik)",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mov-init-003",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    product_id: "m0000000-0000-0000-0000-000000000003",
    product_name: "Mie Goreng Seafood Spesial",
    sku: "FOOD-003",
    movement_type: "SALE",
    quantity_change: -4,
    previous_stock: 12,
    new_stock: 8,
    reference_id: "ORD-20261109-001",
    reason: "Penjualan kasir POS terbayar",
    actor_name: "Budi Santoso (Kasir)",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mov-init-004",
    outlet_id: "e0000000-0000-0000-0000-000000000001",
    product_id: "m0000000-0000-0000-0000-000000000004",
    product_name: "Es Teh Manis Melati",
    sku: "DRK-001",
    movement_type: "IN",
    quantity_change: 100,
    previous_stock: 0,
    new_stock: 100,
    reference_id: "PO-20261109-002",
    reason: "Restok sirup & teh melati",
    actor_name: "Ratna Sari (Manajer Resto)",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const loadMovementsFromStorage = (): StockMovementItem[] => {
  if (typeof window === "undefined") return getInitialMovements();
  try {
    const raw = localStorage.getItem(STOCK_MOVEMENTS_KEY);
    if (!raw) {
      const initial = getInitialMovements();
      localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialMovements();
  } catch {
    return getInitialMovements();
  }
};

const saveMovementsToStorage = (movements: StockMovementItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements));
  } catch {
    // ignore
  }
};

export const inventoryService = {
  // Get all stock movements (ledger)
  async getStockMovements(filters?: {
    productId?: string;
    movementType?: StockMovementType | "ALL";
  }): Promise<StockMovementItem[]> {
    if (isConfiguredSupabase()) {
      try {
        let query = supabase
          .from("stock_movements")
          .select("*, products(name, sku)")
          .order("created_at", { ascending: false });

        if (filters?.productId) {
          query = query.eq("product_id", filters.productId);
        }
        if (filters?.movementType && filters.movementType !== "ALL") {
          query = query.eq("movement_type", filters.movementType);
        }

        const { data, error } = await query;
        if (!error && data) {
          interface SupabaseStockMovementRow {
            id: string;
            outlet_id: string;
            product_id: string;
            products?: { name: string; sku: string } | null;
            movement_type: StockMovementType;
            quantity_change: number;
            previous_stock: number;
            new_stock: number;
            reference_id: string | null;
            reason: string;
            created_at: string;
          }

          return (data as unknown as SupabaseStockMovementRow[]).map((row) => ({
            id: row.id,
            outlet_id: row.outlet_id,
            product_id: row.product_id,
            product_name: row.products?.name || "Produk",
            sku: row.products?.sku || "-",
            movement_type: row.movement_type,
            quantity_change: row.quantity_change,
            previous_stock: row.previous_stock,
            new_stock: row.new_stock,
            reference_id: row.reference_id,
            reason: row.reason,
            actor_name: "Staf Operasional",
            created_at: row.created_at,
          }));
        }
      } catch {
        // Fall back
      }
    }

    let movements = loadMovementsFromStorage();

    if (filters?.productId) {
      movements = movements.filter((m) => m.product_id === filters.productId);
    }
    if (filters?.movementType && filters.movementType !== "ALL") {
      movements = movements.filter((m) => m.movement_type === filters.movementType);
    }

    return movements.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // Perform Stock Adjustment (Opname / IN / OUT)
  async adjustStock(input: StockAdjustmentInput): Promise<{
    success: boolean;
    message: string;
    product?: ProductItem;
    movement?: StockMovementItem;
  }> {
    if (!input.reason || !input.reason.trim()) {
      return { success: false, message: "Alasan penyesuaian stok wajib diisi." };
    }

    const product = await catalogService.getProductById(input.productId);
    if (!product) {
      return { success: false, message: "Produk tidak ditemukan." };
    }

    const previousStock = product.current_stock;
    let newStock = previousStock;
    let quantityChange = 0;
    let movementType: StockMovementType = input.type;

    if (input.type === "IN") {
      if (input.quantity <= 0) {
        return { success: false, message: "Jumlah barang masuk harus lebih dari 0." };
      }
      quantityChange = input.quantity;
      newStock = previousStock + quantityChange;
    } else if (input.type === "OUT") {
      if (input.quantity <= 0) {
        return { success: false, message: "Jumlah barang keluar harus lebih dari 0." };
      }
      if (input.quantity > previousStock) {
        return {
          success: false,
          message: `Stok tidak mencukupi untuk pengurangan ${input.quantity} unit (Stok saat ini: ${previousStock}).`,
        };
      }
      quantityChange = -input.quantity;
      newStock = previousStock - input.quantity;
    } else {
      // ADJUSTMENT (Opname)
      if (input.quantity < 0) {
        return { success: false, message: "Jumlah stok opname tidak boleh negatif." };
      }
      newStock = input.quantity;
      quantityChange = newStock - previousStock;
      movementType = "ADJUSTMENT";
    }

    const now = new Date().toISOString();
    const movement: StockMovementItem = {
      id: `mov-${Date.now()}`,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      movement_type: movementType,
      quantity_change: quantityChange,
      previous_stock: previousStock,
      new_stock: newStock,
      reference_id: input.referenceId || `ADJ-${Date.now().toString().slice(-6)}`,
      reason: input.reason.trim(),
      actor_name: input.actorName,
      created_at: now,
    };

    // Update Product Stock in Catalog
    const updatedProduct = await catalogService.updateProduct(product.id, {
      current_stock: newStock,
      // Auto-toggle availability if stock reached 0 or recovered from 0
      is_available: newStock > 0 ? true : false,
    });

    // Save movement to storage
    const movements = loadMovementsFromStorage();
    movements.unshift(movement);
    saveMovementsToStorage(movements);

    // If Supabase remote connected, insert to remote table
    if (isConfiguredSupabase()) {
      try {
        await supabase.from("stock_movements").insert({
          outlet_id: movement.outlet_id,
          product_id: movement.product_id,
          movement_type: movement.movement_type,
          quantity_change: movement.quantity_change,
          previous_stock: movement.previous_stock,
          new_stock: movement.new_stock,
          reference_id: movement.reference_id,
          reason: movement.reason,
        } as never);
      } catch {
        // Fall back
      }
    }

    return {
      success: true,
      message: `Stok "${product.name}" berhasil disesuaikan dari ${previousStock} menjadi ${newStock} unit.`,
      product: updatedProduct,
      movement,
    };
  },

  // Record a Sale deduction (used by POS/Online checkout)
  async recordSaleDeduction(
    productId: string,
    quantitySold: number,
    orderNumber: string,
    actorName: string
  ): Promise<void> {
    const product = await catalogService.getProductById(productId);
    if (!product) return;

    const previousStock = product.current_stock;
    const newStock = Math.max(0, previousStock - quantitySold);

    const movement: StockMovementItem = {
      id: `mov-${Date.now()}`,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      movement_type: "SALE",
      quantity_change: -quantitySold,
      previous_stock: previousStock,
      new_stock: newStock,
      reference_id: orderNumber,
      reason: `Penjualan pesanan ${orderNumber}`,
      actor_name: actorName,
      created_at: new Date().toISOString(),
    };

    await catalogService.updateProduct(product.id, {
      current_stock: newStock,
      is_available: newStock > 0,
    });

    const movements = loadMovementsFromStorage();
    movements.unshift(movement);
    saveMovementsToStorage(movements);
  },

  // Get Inventory Summary KPIs
  async getInventoryStats(): Promise<InventoryStats> {
    const products = await catalogService.getProducts();

    let totalPhysicalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalPhysicalStock += p.current_stock;
      if (p.current_stock === 0) {
        outOfStockCount++;
      } else if (p.current_stock <= LOW_STOCK_THRESHOLD) {
        lowStockCount++;
      }
    }

    return {
      totalProducts: products.length,
      totalPhysicalStock,
      lowStockCount,
      outOfStockCount,
    };
  },

  resetDemoInventory(): void {
    saveMovementsToStorage(getInitialMovements());
  },
};
