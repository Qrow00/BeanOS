import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Customer } from '../types/database';
import { getDatabase } from '../database/connection';
import * as customersRepo from '../database/customers';

let cachedDb: SQLiteDatabase | null = null;
async function getDb(): Promise<SQLiteDatabase> {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (name: string, phone?: string | null) => Promise<Customer>;
  updateCustomer: (id: number, input: { name?: string; phone?: string | null; is_active?: number }) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  adjustPoints: (id: number, delta: number, description: string) => Promise<number>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true });
    try {
      const db = await getDb();
      const customers = await customersRepo.getAllCustomers(db);
      set({ customers });
    } catch (e) {
      set({ error: 'Failed to load members' });
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (name, phone) => {
    const db = await getDb();
    const created = await customersRepo.createCustomer(db, { name, phone });
    await get().fetchCustomers();
    return created;
  },

  updateCustomer: async (id, input) => {
    const db = await getDb();
    await customersRepo.updateCustomer(db, id, input);
    await get().fetchCustomers();
  },

  deleteCustomer: async (id) => {
    const db = await getDb();
    await customersRepo.deleteCustomer(db, id);
    await get().fetchCustomers();
  },

  adjustPoints: async (id, delta, description) => {
    const { useAuthStore } = await import('./authStore');
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not signed in');
    const db = await getDb();
    const newBalance = await customersRepo.adjustPoints(db, id, delta, description, userId);
    await get().fetchCustomers();
    return newBalance;
  },
}));
