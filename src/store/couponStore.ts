import { create } from 'zustand';
import type { Coupon, CouponInput } from '../types/database';
import type { CouponState } from '../types/store';
import { getDatabase } from '../database/connection';
import * as couponsRepo from '../database/coupons';

let cachedDb: any = null;
async function getDb() {
  if (!cachedDb) cachedDb = await getDatabase();
  return cachedDb;
}

export const useCouponStore = create<CouponState>((set) => ({
  coupons: [],
  isLoading: false,
  error: null,

  fetchCoupons: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const coupons = await couponsRepo.getAllCoupons(db);
      set({ coupons, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch coupons' });
    }
  },

  addCoupon: async (input: CouponInput) => {
    try {
      const db = await getDb();
      await couponsRepo.createCoupon(db, input);
      const coupons = await couponsRepo.getAllCoupons(db);
      set({ coupons });
    } catch {
      set({ error: 'Failed to add coupon' });
    }
  },

  deleteCoupon: async (id: number) => {
    try {
      const db = await getDb();
      await couponsRepo.deleteCoupon(db, id);
      const coupons = await couponsRepo.getAllCoupons(db);
      set({ coupons });
    } catch {
      set({ error: 'Failed to delete coupon' });
    }
  },

  validateCoupon: async (code: string) => {
    try {
      const db = await getDb();
      const coupon = await couponsRepo.getCouponByCode(db, code);
      if (!coupon) return null;
      if (!coupon.is_active) return null;
      if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return null;
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) return null;
      return coupon;
    } catch {
      return null;
    }
  },
}));
