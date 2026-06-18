import { create } from 'zustand';
import { getDatabase } from '../database/connection';
import { getIngredientPriceMovements } from '../database/priceHistory';
import type { PriceMovement } from '../database/priceHistory';

type SortBy = 'price' | 'name' | 'quantity' | 'date';

interface PriceHistoryState {
  movements: PriceMovement[];
  sortBy: SortBy;
  isLoading: boolean;
  fetchMovements: () => Promise<void>;
  setSortBy: (sort: SortBy) => void;
  sortedMovements: () => PriceMovement[];
}

export const usePriceHistoryStore = create<PriceHistoryState>((set, get) => ({
  movements: [],
  sortBy: 'name',
  isLoading: false,

  fetchMovements: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const movements = await getIngredientPriceMovements(db);
      set({ movements, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSortBy: (sortBy: SortBy) => set({ sortBy }),

  sortedMovements: () => {
    const { movements, sortBy } = get();
    const sorted = [...movements];
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'quantity':
        sorted.sort((a, b) => a.stock_quantity - b.stock_quantity);
        break;
      case 'date':
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
    }
    return sorted;
  },
}));
