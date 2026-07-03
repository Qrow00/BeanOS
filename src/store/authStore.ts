import { create } from 'zustand';
import type { User } from '../types/database';
import type { AuthState } from '../types/store';
import { getDatabase } from '../database/connection';
import * as usersRepo from '../database/users';
import { ROLES, RATE_LIMIT } from '../utils/constants';

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
  failedAttempts: {},

  login: async (userId: number, pin: string) => {
    const { failedAttempts } = get();
    const attempt = failedAttempts[userId];
    if (attempt && Date.now() < attempt.lockedUntil) {
      const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
      set({ isLoading: false, error: `Too many attempts. Try again in ${remaining}s` });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const user = await usersRepo.authenticateUser(db, userId, pin);
      if (user) {
        const { [userId]: _, ...rest } = failedAttempts;
        set({ isAuthenticated: true, user, isLoading: false, error: null, failedAttempts: rest });
      } else {
        const count = (attempt?.count ?? 0) + 1;
        let lockedUntil = 0;
        if (count >= RATE_LIMIT.HARD_LOCK_AFTER) {
          lockedUntil = Date.now() + RATE_LIMIT.HARD_LOCK_DURATION_MS;
        } else if (count >= RATE_LIMIT.LOCK_AFTER) {
          lockedUntil = Date.now() + RATE_LIMIT.LOCK_DURATION_MS;
        }
        set({
          isLoading: false,
          error: `Invalid PIN (uid:${userId})`,
          failedAttempts: { ...failedAttempts, [userId]: { count, lockedUntil } },
        });
      }
    } catch (err: any) {
      console.error('Login error:', err?.message ?? err);
      set({ isLoading: false, error: `ERR: ${err?.message ?? err}` });
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, error: null });
  },

  isAdmin: () => {
    return get().user?.role === ROLES.ADMIN;
  },
}));
