import { supabase } from "@/lib/supabase";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "./storeService";

export interface CategoryItem {
  id: string;
  outlet_id?: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  products_count?: number;
}

export interface ProductVariantItem {
  id?: string;
  product_id?: string;
  name: string;
  price_adjustment: number;
  display_order?: number;
  is_active?: boolean;
}

export interface ProductAddonItem {
  id?: string;
  product_id?: string;
  name: string;
  price: number;
  display_order?: number;
  is_active?: boolean;
}

export interface ProductItem {
  id: string;
  outlet_id?: string;
  category_id: string | null;
  category_name?: string;
  sku: string;
  name: string;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  is_active: boolean;
  is_available: boolean;
  display_order: number;
  current_stock: number;
  created_at?: string;
  updated_at?: string;
  variants: ProductVariantItem[];
  addons: ProductAddonItem[];
}

export interface ProductFilterOptions {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  is_available?: boolean;
  sortBy?: "name_asc" | "name_desc" | "price_asc" | "price_desc" | "order";
}

const CATEGORIES_KEY = "foodpos_categories_v1";
const PRODUCTS_KEY = "foodpos_products_v1";

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

// Initial state generators
const getInitialCategories = (): CategoryItem[] => {
  return MOCK_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || null,
    display_order: c.display_order,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};

const getInitialProducts = (): ProductItem[] => {
  return MOCK_PRODUCTS.map((p, idx) => ({
    id: p.id,
    category_id: p.category_id,
    category_name: p.category_name,
    sku: p.sku,
    name: p.name,
    description: p.description || null,
    base_price: p.base_price,
    image_url: p.image_url || null,
    is_active: true,
    is_available: p.is_available,
    display_order: idx + 1,
    current_stock: p.current_stock,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      name: v.name,
      price_adjustment: v.price_adjustment,
      is_active: true,
    })),
    addons: (p.addons || []).map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
      is_active: true,
    })),
  }));
};

const loadCategoriesFromStorage = (): CategoryItem[] => {
  if (typeof window === "undefined") return getInitialCategories();
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      const initial = getInitialCategories();
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialCategories();
  } catch {
    return getInitialCategories();
  }
};

const saveCategoriesToStorage = (categories: CategoryItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // ignore
  }
};

const loadProductsFromStorage = (): ProductItem[] => {
  if (typeof window === "undefined") return getInitialProducts();
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      const initial = getInitialProducts();
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialProducts();
  } catch {
    return getInitialProducts();
  }
};

const saveProductsToStorage = (products: ProductItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
};

export const catalogService = {
  // ==========================================
  // CATEGORIES CRUD
  // ==========================================
  async getCategories(includeInactive: boolean = true): Promise<CategoryItem[]> {
    if (isConfiguredSupabase()) {
      try {
        let query = supabase
          .from("categories")
          .select("*, products:products(count)")
          .order("display_order", { ascending: true });

        if (!includeInactive) {
          query = query.eq("is_active", true);
        }

        const { data, error } = await query;
        if (!error && data) {
          interface SupabaseCategoryRow {
            id: string;
            outlet_id: string;
            name: string;
            slug: string;
            description: string | null;
            display_order: number;
            is_active: boolean;
            created_at: string;
            updated_at: string;
            products?: [{ count: number }];
          }

          return (data as unknown as SupabaseCategoryRow[]).map((c) => ({
            id: c.id,
            outlet_id: c.outlet_id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            display_order: c.display_order,
            is_active: c.is_active,
            created_at: c.created_at,
            updated_at: c.updated_at,
            products_count: c.products?.[0]?.count || 0,
          }));
        }
      } catch {
        // Fall back to storage
      }
    }

    const categories = loadCategoriesFromStorage();
    const products = loadProductsFromStorage();

    const withCount = categories.map((c) => ({
      ...c,
      products_count: products.filter((p) => p.category_id === c.id).length,
    }));

    if (!includeInactive) {
      return withCount.filter((c) => c.is_active);
    }
    return withCount.sort((a, b) => a.display_order - b.display_order);
  },

  async createCategory(input: {
    name: string;
    slug?: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<CategoryItem> {
    const slug =
      input.slug?.trim() ||
      input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const newCategory: CategoryItem = {
      id: `cat-${Date.now()}`,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      products_count: 0,
    };

    if (isConfiguredSupabase()) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert({
            outlet_id: newCategory.outlet_id,
            name: newCategory.name,
            slug: newCategory.slug,
            description: newCategory.description,
            display_order: newCategory.display_order,
            is_active: newCategory.is_active,
          } as never)
          .select()
          .single();

        if (!error && data) {
          newCategory.id = (data as { id: string }).id;
        }
      } catch {
        // Fall back
      }
    }

    const categories = loadCategoriesFromStorage();
    categories.push(newCategory);
    saveCategoriesToStorage(categories);

    return newCategory;
  },

  async updateCategory(
    id: string,
    input: Partial<Omit<CategoryItem, "id">>
  ): Promise<CategoryItem> {
    const categories = loadCategoriesFromStorage();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error("Kategori tidak ditemukan.");
    }

    const existing = categories[index];
    const updated: CategoryItem = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };

    categories[index] = updated;
    saveCategoriesToStorage(categories);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("categories")
          .update({
            name: updated.name,
            slug: updated.slug,
            description: updated.description,
            display_order: updated.display_order,
            is_active: updated.is_active,
          } as never)
          .eq("id", id);
      } catch {
        // Fall back
      }
    }

    return updated;
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const products = loadProductsFromStorage();
    const hasProducts = products.some((p) => p.category_id === id);

    if (hasProducts) {
      return {
        success: false,
        message: "Kategori tidak dapat dihapus karena masih memiliki produk terhubung. Pindahkan produk terlebih dahulu.",
      };
    }

    const categories = loadCategoriesFromStorage();
    const filtered = categories.filter((c) => c.id !== id);
    saveCategoriesToStorage(filtered);

    if (isConfiguredSupabase()) {
      try {
        await supabase.from("categories").delete().eq("id", id);
      } catch {
        // Fall back
      }
    }

    return {
      success: true,
      message: "Kategori berhasil dihapus.",
    };
  },

  // ==========================================
  // PRODUCTS CRUD
  // ==========================================
  async getProducts(filters: ProductFilterOptions = {}): Promise<ProductItem[]> {
    if (isConfiguredSupabase()) {
      try {
        let query = supabase
          .from("products")
          .select(`
            *,
            category:categories(id, name),
            variants:product_variants(*),
            addons:product_addons(*)
          `);

        if (filters.category_id && filters.category_id !== "ALL") {
          query = query.eq("category_id", filters.category_id);
        }
        if (filters.is_active !== undefined) {
          query = query.eq("is_active", filters.is_active);
        }
        if (filters.is_available !== undefined) {
          query = query.eq("is_available", filters.is_available);
        }
        if (filters.search && filters.search.trim()) {
          query = query.ilike("name", `%${filters.search.trim()}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          interface SupabaseProductFetchRow {
            id: string;
            outlet_id: string;
            category_id: string | null;
            category?: { name: string } | null;
            sku: string;
            name: string;
            description: string | null;
            base_price: number | string;
            image_url: string | null;
            is_active: boolean;
            is_available: boolean;
            display_order: number;
            current_stock: number;
            created_at: string;
            updated_at: string;
            variants?: ProductVariantItem[];
            addons?: ProductAddonItem[];
          }

          return (data as unknown as SupabaseProductFetchRow[]).map((p) => ({
            id: p.id,
            outlet_id: p.outlet_id,
            category_id: p.category_id,
            category_name: p.category?.name,
            sku: p.sku,
            name: p.name,
            description: p.description,
            base_price: Number(p.base_price),
            image_url: p.image_url,
            is_active: p.is_active,
            is_available: p.is_available,
            display_order: p.display_order,
            current_stock: p.current_stock,
            created_at: p.created_at,
            updated_at: p.updated_at,
            variants: p.variants || [],
            addons: p.addons || [],
          }));
        }
      } catch {
        // Fall back
      }
    }

    let products = loadProductsFromStorage();
    const categories = loadCategoriesFromStorage();

    // Map category names
    products = products.map((p) => {
      const cat = categories.find((c) => c.id === p.category_id);
      return {
        ...p,
        category_name: cat?.name || p.category_name || "Tanpa Kategori",
      };
    });

    if (filters.category_id && filters.category_id !== "ALL") {
      products = products.filter((p) => p.category_id === filters.category_id);
    }
    if (filters.is_active !== undefined) {
      products = products.filter((p) => p.is_active === filters.is_active);
    }
    if (filters.is_available !== undefined) {
      products = products.filter((p) => p.is_available === filters.is_available);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (filters.sortBy === "name_asc") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === "name_desc") {
      products.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filters.sortBy === "price_asc") {
      products.sort((a, b) => a.base_price - b.base_price);
    } else if (filters.sortBy === "price_desc") {
      products.sort((a, b) => b.base_price - a.base_price);
    } else {
      products.sort((a, b) => a.display_order - b.display_order);
    }

    return products;
  },

  async getProductById(id: string): Promise<ProductItem | null> {
    const products = await this.getProducts();
    return products.find((p) => p.id === id) || null;
  },

  async createProduct(input: {
    category_id: string | null;
    sku: string;
    name: string;
    description?: string;
    base_price: number;
    image_url?: string;
    is_active?: boolean;
    is_available?: boolean;
    display_order?: number;
    current_stock?: number;
    variants?: Array<{ name: string; price_adjustment: number }>;
    addons?: Array<{ name: string; price: number }>;
  }): Promise<ProductItem> {
    const products = loadProductsFromStorage();
    const categories = loadCategoriesFromStorage();

    // Check SKU duplicate
    const skuNormalized = input.sku.trim().toUpperCase();
    const exists = products.some((p) => p.sku.toUpperCase() === skuNormalized);
    if (exists) {
      throw new Error(`SKU "${skuNormalized}" sudah digunakan oleh produk lain.`);
    }

    const cat = categories.find((c) => c.id === input.category_id);
    const productId = `prod-${Date.now()}`;

    const newProduct: ProductItem = {
      id: productId,
      outlet_id: "e0000000-0000-0000-0000-000000000001",
      category_id: input.category_id,
      category_name: cat?.name || "Tanpa Kategori",
      sku: skuNormalized,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      base_price: Number(input.base_price),
      image_url: input.image_url?.trim() || null,
      is_active: input.is_active ?? true,
      is_available: input.is_available ?? true,
      display_order: input.display_order ?? products.length + 1,
      current_stock: input.current_stock ?? 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      variants: (input.variants || []).map((v, i) => ({
        id: `v-${Date.now()}-${i}`,
        product_id: productId,
        name: v.name.trim(),
        price_adjustment: Number(v.price_adjustment) || 0,
        is_active: true,
      })),
      addons: (input.addons || []).map((a, i) => ({
        id: `a-${Date.now()}-${i}`,
        product_id: productId,
        name: a.name.trim(),
        price: Number(a.price) || 0,
        is_active: true,
      })),
    };

    if (isConfiguredSupabase()) {
      try {
        const { data, error } = await supabase
          .from("products")
          .insert({
            outlet_id: newProduct.outlet_id,
            category_id: newProduct.category_id,
            sku: newProduct.sku,
            name: newProduct.name,
            description: newProduct.description,
            base_price: newProduct.base_price,
            image_url: newProduct.image_url,
            is_active: newProduct.is_active,
            is_available: newProduct.is_available,
            display_order: newProduct.display_order,
            current_stock: newProduct.current_stock,
          } as never)
          .select()
          .single();

        if (!error && data) {
          newProduct.id = (data as { id: string }).id;
        }
      } catch {
        // Continue
      }
    }

    products.push(newProduct);
    saveProductsToStorage(products);

    return newProduct;
  },

  async updateProduct(
    id: string,
    input: Partial<Omit<ProductItem, "id">>
  ): Promise<ProductItem> {
    const products = loadProductsFromStorage();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error("Produk tidak ditemukan.");
    }

    // Check SKU if changing
    if (input.sku) {
      const skuNormalized = input.sku.trim().toUpperCase();
      const duplicate = products.some(
        (p) => p.id !== id && p.sku.toUpperCase() === skuNormalized
      );
      if (duplicate) {
        throw new Error(`SKU "${skuNormalized}" sudah digunakan oleh produk lain.`);
      }
      input.sku = skuNormalized;
    }

    const categories = loadCategoriesFromStorage();
    const existing = products[index];
    const categoryId = input.category_id !== undefined ? input.category_id : existing.category_id;
    const cat = categories.find((c) => c.id === categoryId);

    const updatedVariants = input.variants
      ? input.variants.map((v, i) => ({
          ...v,
          id: v.id || `v-${Date.now()}-${i}`,
          is_active: v.is_active ?? true,
        }))
      : existing.variants;

    const updatedAddons = input.addons
      ? input.addons.map((a, i) => ({
          ...a,
          id: a.id || `a-${Date.now()}-${i}`,
          is_active: a.is_active ?? true,
        }))
      : existing.addons;

    const updated: ProductItem = {
      ...existing,
      ...input,
      category_id: categoryId,
      category_name: cat?.name || existing.category_name,
      variants: updatedVariants,
      addons: updatedAddons,
      updated_at: new Date().toISOString(),
    };

    products[index] = updated;
    saveProductsToStorage(products);

    if (isConfiguredSupabase()) {
      try {
        await supabase
          .from("products")
          .update({
            category_id: updated.category_id,
            sku: updated.sku,
            name: updated.name,
            description: updated.description,
            base_price: updated.base_price,
            image_url: updated.image_url,
            is_active: updated.is_active,
            is_available: updated.is_available,
            display_order: updated.display_order,
            current_stock: updated.current_stock,
          } as never)
          .eq("id", id);
      } catch {
        // Continue
      }
    }

    return updated;
  },

  async toggleProductAvailability(id: string, isAvailable: boolean): Promise<ProductItem> {
    return this.updateProduct(id, { is_available: isAvailable });
  },

  async toggleProductActive(id: string, isActive: boolean): Promise<ProductItem> {
    return this.updateProduct(id, { is_active: isActive });
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const products = loadProductsFromStorage();
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) {
      return { success: false, message: "Produk tidak ditemukan." };
    }

    saveProductsToStorage(filtered);

    if (isConfiguredSupabase()) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch {
        // Fall back
      }
    }

    return {
      success: true,
      message: "Produk berhasil dihapus dari katalog.",
    };
  },

  resetDemoCatalog(): void {
    saveCategoriesToStorage(getInitialCategories());
    saveProductsToStorage(getInitialProducts());
  },
};
