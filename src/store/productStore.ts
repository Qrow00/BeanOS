import { create } from 'zustand';
import type { Product, ProductInput } from '../types/database';
import type { ProductState } from '../types/store';
import { getDatabase } from '../database/connection';
import * as productsRepo from '../database/products';

let cachedDb: any = null;
async function getDb() {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const products = await productsRepo.getAllProducts(db);
      set({ products, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to fetch products' });
    }
  },

  addProduct: async (input: ProductInput) => {
    try {
      const db = await getDb();
      await productsRepo.createProduct(db, input);
      await get().fetchProducts();
    } catch (err) {
      set({ error: 'Failed to add product' });
    }
  },

  updateProduct: async (id: number, input: Partial<Product>) => {
    try {
      const db = await getDb();
      await productsRepo.updateProduct(db, id, input);
      await get().fetchProducts();
    } catch (err) {
      set({ error: 'Failed to update product' });
    }
  },

  deleteProduct: async (id: number) => {
    const db = await getDb();
    await productsRepo.deleteProduct(db, id);
    await get().fetchProducts();
  },

  forceDeleteProduct: async (id: number) => {
    const db = await getDb();
    const count = await productsRepo.forceDeleteProduct(db, id);
    await get().fetchProducts();
    return count;
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    let filtered = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.item_id.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  },

  getCategories: () => {
    const categories = new Set(get().products.map(p => p.category));
    return Array.from(categories).sort();
  },
}));
