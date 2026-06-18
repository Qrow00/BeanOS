import type { SQLiteDatabase } from 'expo-sqlite';
import type { Coupon, CouponInput } from '../types/database';

export async function getAllCoupons(db: SQLiteDatabase): Promise<Coupon[]> {
  return db.getAllAsync<Coupon>('SELECT * FROM coupons ORDER BY code');
}

export async function getCouponById(db: SQLiteDatabase, id: number): Promise<Coupon | null> {
  return db.getFirstAsync<Coupon>('SELECT * FROM coupons WHERE id = ?', id);
}

export async function getCouponByCode(db: SQLiteDatabase, code: string): Promise<Coupon | null> {
  return db.getFirstAsync<Coupon>('SELECT * FROM coupons WHERE code = ?', code);
}

export async function createCoupon(db: SQLiteDatabase, input: CouponInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, is_active, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.code,
    input.discount_type,
    input.discount_value,
    input.min_purchase,
    input.max_uses,
    input.is_active,
    input.expiry_date
  );
}

export async function deleteCoupon(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM coupons WHERE id = ?', id);
}

export async function validateAndUseCoupon(
  db: SQLiteDatabase,
  code: string,
  subtotal: number
): Promise<Coupon | null> {
  const coupon = await getCouponByCode(db, code);
  if (!coupon) return null;
  if (!coupon.is_active) return null;

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return null;
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) return null;
  if (subtotal < coupon.min_purchase) return null;

  return coupon;
}

export async function incrementCouponUses(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?',
    id
  );
}
