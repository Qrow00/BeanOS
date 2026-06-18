import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product, PaymentMethod, HoldTransaction } from '../types/database';
import type { CartItem, CartState, DiscountInput } from '../types/store';
import { getDatabase } from '../database/connection';
import * as holdsRepo from '../database/holds';

let cachedDb: SQLiteDatabase | null = null;
async function getDb(): Promise<SQLiteDatabase> {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  manualDiscount: null,
  isLoading: false,
  paymentMethod: 'cash',

  addItem: (product: Product, quantity: number = 1) => {
    set(state => {
      const existing = state.items.find(i => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock_quantity) }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity: Math.min(quantity, product.stock_quantity) }] };
    });
  },

  removeItem: (productId: number) => {
    set(state => ({
      items: state.items.filter(i => i.product.id !== productId),
    }));
  },

  updateQuantity: (productId: number, quantity: number) => {
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.product.stock_quantity)) }
          : i
      ),
    }));
  },

  clearCart: () => set({ items: [], manualDiscount: null }),

  setManualDiscount: (type: 'percentage' | 'fixed', value: number) => {
    set({ manualDiscount: { type, value: Math.max(0, value) } });
  },

  clearManualDiscount: () => set({ manualDiscount: null }),

  setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getDiscount: () => {
    const { manualDiscount, items } = get();
    if (!manualDiscount) return 0;
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (manualDiscount.type === 'percentage') {
      return subtotal * (manualDiscount.value / 100);
    }
    return Math.min(manualDiscount.value, subtotal);
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscount();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  holdCart: async (label: string) => {
    const { items, manualDiscount, paymentMethod } = get();
    if (items.length === 0) return;
    const db = await getDb();
    const user = (await import('../store/authStore')).useAuthStore.getState().user;
    if (!user) return;

    const cartData = { items, manualDiscount };
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();

    await holdsRepo.insertHold(
      db,
      label,
      JSON.stringify(cartData),
      null,
      paymentMethod,
      subtotal,
      discount,
      subtotal - discount,
      get().getItemCount(),
      user.id
    );
    set({ items: [], manualDiscount: null });
  },

  restoreCart: (hold: HoldTransaction) => {
    try {
      const data = JSON.parse(hold.items_json);
      set({
        items: data.items as CartItem[],
        manualDiscount: data.manualDiscount as DiscountInput | null,
        paymentMethod: hold.payment_method as PaymentMethod,
      });
    } catch {}
  },

  getHeldTransactions: async () => {
    const db = await getDb();
    return holdsRepo.getAllHolds(db);
  },

  deleteHeldTransaction: async (id: number) => {
    const db = await getDb();
    await holdsRepo.deleteHold(db, id);
  },

  getRecentProductIds: async (limit: number = 10) => {
    const db = await getDb();
    const rows = await db.getAllAsync<{ product_id: number }>(
      `SELECT product_id, SUM(quantity) as total_qty
       FROM sale_items
       GROUP BY product_id
       ORDER BY total_qty DESC
       LIMIT ?`,
      limit
    );
    return rows.map(r => r.product_id);
  },
}));
