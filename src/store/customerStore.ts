import { create } from 'zustand';
import type { Customer } from '../types/database';
import * as customersRepo from '../database/customers';

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
      const customers = await customersRepo.getAllCustomers();
      set({ customers });
    } catch (e) {
      set({ error: 'Failed to load members' });
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (name, phone) => {
    const created = await customersRepo.createCustomer({ name, phone });
    await get().fetchCustomers();
    return created;
  },

  updateCustomer: async (id, input) => {
    await customersRepo.updateCustomer(id, input);
    await get().fetchCustomers();
  },

  deleteCustomer: async (id) => {
    await customersRepo.deleteCustomer(id);
    await get().fetchCustomers();
  },

  adjustPoints: async (id, delta, description) => {
    const { useAuthStore } = await import('./authStore');
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not signed in');
    const newBalance = await customersRepo.adjustPoints(id, delta, description, userId);
    await get().fetchCustomers();
    return newBalance;
  },
}));
