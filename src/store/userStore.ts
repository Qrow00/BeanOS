import { create } from 'zustand';
import type { User, UserInput } from '../types/database';
import type { UserState } from '../types/store';
import { getDatabase } from '../database/connection';
import * as usersRepo from '../database/users';

let cachedDb: any = null;
async function getDb() {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const users = await usersRepo.getAllUsers(db);
      set({ users, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch users' });
    }
  },

  addUser: async (input: UserInput) => {
    try {
      const db = await getDb();
      await usersRepo.createUser(db, input);
      const users = await usersRepo.getAllUsers(db);
      set({ users });
    } catch {
      set({ error: 'Failed to add user' });
    }
  },

  updateUser: async (id: number, input: Partial<User>) => {
    try {
      const db = await getDb();
      await usersRepo.updateUser(db, id, input);
      const users = await usersRepo.getAllUsers(db);
      set({ users });
    } catch {
      set({ error: 'Failed to update user' });
    }
  },

  deleteUser: async (id: number) => {
    try {
      const db = await getDb();
      await usersRepo.deleteUser(db, id);
      const users = await usersRepo.getAllUsers(db);
      set({ users });
    } catch {
      set({ error: 'Failed to delete user' });
    }
  },
}));
