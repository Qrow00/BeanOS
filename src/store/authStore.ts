import { create } from 'zustand';
import type { User } from '../types/database';
import type { AuthState } from '../types/store';
import { getDatabase } from '../database/connection';
import * as usersRepo from '../database/users';
import { ROLES } from '../utils/constants';

let cachedDb: any = null;
async function getDb() {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const user = await usersRepo.authenticateUser(db, username, password);
      if (user) {
        set({ isAuthenticated: true, user, isLoading: false, error: null });
      } else {
        set({ isLoading: false, error: 'Invalid username or password' });
      }
    } catch (err) {
      set({ isLoading: false, error: 'Login failed. Please try again.' });
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, error: null });
  },

  isAdmin: () => {
    return get().user?.role === ROLES.ADMIN;
  },
}));
