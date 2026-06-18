import { create } from 'zustand';
import type { Transaction, TransactionInput } from '../types/database';
import type { TransactionState } from '../types/store';
import { getDatabase } from '../database/connection';
import * as transactionsRepo from '../database/transactions';

let cachedDb: any = null;
async function getDb() {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const transactions = await transactionsRepo.getAllTransactions(db);
      set({ transactions, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch transactions' });
    }
  },

  addTransaction: async (input: TransactionInput) => {
    try {
      const db = await getDb();
      await transactionsRepo.createTransaction(db, input);
      const transactions = await transactionsRepo.getAllTransactions(db);
      set({ transactions });
    } catch {
      set({ error: 'Failed to add transaction' });
    }
  },

  deleteTransaction: async (id: number) => {
    try {
      const db = await getDb();
      await transactionsRepo.deleteTransaction(db, id);
      const transactions = await transactionsRepo.getAllTransactions(db);
      set({ transactions });
    } catch {
      set({ error: 'Failed to delete transaction' });
    }
  },

  getIncomeTotal: () => {
    return get().transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getExpenseTotal: () => {
    return get().transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getNetTotal: () => {
    return get().getIncomeTotal() - get().getExpenseTotal();
  },
}));
