import type { SQLiteDatabase } from 'expo-sqlite';
import type { HoldTransaction } from '../types/database';

export async function insertHold(
  db: SQLiteDatabase,
  label: string,
  itemsJson: string,
  couponId: number | null,
  paymentMethod: string,
  subtotal: number,
  discountAmount: number,
  total: number,
  itemCount: number,
  userId: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO hold_transactions (label, items_json, coupon_id, payment_method, subtotal, discount_amount, total, item_count, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    label,
    itemsJson,
    couponId,
    paymentMethod,
    subtotal,
    discountAmount,
    total,
    itemCount,
    userId
  );
}

export async function getAllHolds(db: SQLiteDatabase): Promise<HoldTransaction[]> {
  return db.getAllAsync<HoldTransaction>(
    'SELECT * FROM hold_transactions ORDER BY created_at DESC'
  );
}

export async function getHoldById(db: SQLiteDatabase, id: number): Promise<HoldTransaction | null> {
  return db.getFirstAsync<HoldTransaction>('SELECT * FROM hold_transactions WHERE id = ?', id);
}

export async function deleteHold(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM hold_transactions WHERE id = ?', id);
}
