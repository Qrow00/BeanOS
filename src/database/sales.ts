import type { SQLiteDatabase } from 'expo-sqlite';
import type { Sale, SaleItem, SaleInput, SaleItemInput, CartSaleItem, LoyaltySaleData } from '../types/database';

export async function getAllSales(db: SQLiteDatabase): Promise<Sale[]> {
  return db.getAllAsync<Sale>('SELECT * FROM sales ORDER BY sale_date DESC');
}

export async function getSaleById(db: SQLiteDatabase, id: number): Promise<Sale | null> {
  return db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', id);
}

export async function getSaleItems(db: SQLiteDatabase, saleId: number): Promise<SaleItem[]> {
  return db.getAllAsync<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', saleId);
}

export async function createSale(
  db: SQLiteDatabase,
  saleInput: SaleInput,
  items: CartSaleItem[],
  loyalty?: LoyaltySaleData
): Promise<number> {
  let saleId = 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    const result = await txn.runAsync(
      `INSERT INTO sales (receipt_number, user_id, coupon_id, customer_id, subtotal, discount_amount, total, payment_method, points_earned, points_redeemed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      saleInput.receipt_number,
      saleInput.user_id,
      saleInput.coupon_id,
      loyalty?.customerId ?? null,
      saleInput.subtotal,
      saleInput.discount_amount,
      saleInput.total,
      saleInput.payment_method,
      loyalty?.pointsEarned ?? 0,
      loyalty?.pointsRedeemed ?? 0
    );
    saleId = result.lastInsertRowId;

    for (const item of items) {
      await txn.runAsync(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        saleId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.total_price
      );

      await txn.runAsync(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        item.quantity,
        item.product_id
      );
    }

    if (loyalty && (loyalty.pointsEarned > 0 || loyalty.pointsRedeemed > 0)) {
      const customer = await txn.getFirstAsync<{ points_balance: number }>(
        'SELECT points_balance FROM customers WHERE id = ?',
        loyalty.customerId
      );
      if (!customer) throw new Error('Loyalty member not found');

      if (loyalty.pointsRedeemed > 0) {
        if (customer.points_balance < loyalty.pointsRedeemed) {
          throw new Error('Insufficient loyalty points');
        }
        await txn.runAsync(
          "INSERT INTO loyalty_ledger (customer_id, sale_id, type, points, description, created_by) VALUES (?, ?, 'redeem', ?, ?, ?)",
          loyalty.customerId, saleId, -loyalty.pointsRedeemed, `Redeemed on sale #${saleInput.receipt_number}`, saleInput.user_id
        );
      }
      if (loyalty.pointsEarned > 0) {
        await txn.runAsync(
          "INSERT INTO loyalty_ledger (customer_id, sale_id, type, points, description, created_by) VALUES (?, ?, 'earn', ?, ?, ?)",
          loyalty.customerId, saleId, loyalty.pointsEarned, `Earned on sale #${saleInput.receipt_number}`, saleInput.user_id
        );
      }

      await txn.runAsync(
        `UPDATE customers SET
           points_balance = points_balance + ? - ?,
           lifetime_points = lifetime_points + ?,
           updated_at = datetime('now')
         WHERE id = ?`,
        loyalty.pointsEarned,
        loyalty.pointsRedeemed,
        Math.max(loyalty.pointsEarned, 0),
        loyalty.customerId
      );
    }
  });
  return saleId;
}

export async function getSalesByDateRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<Sale[]> {
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE sale_date >= ? AND sale_date <= ? ORDER BY sale_date DESC',
    startDate,
    endDate
  );
}

export async function getTodaySales(db: SQLiteDatabase): Promise<Sale[]> {
  const today = new Date().toISOString().split('T')[0];
  return getSalesByDateRange(db, `${today} 00:00:00`, `${today} 23:59:59`);
}

export async function getTopSellersWeekly(db: SQLiteDatabase): Promise<{ product_id: number; total_qty: number }[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const startDate = weekAgo.toISOString().split('T')[0];
  return db.getAllAsync<{ product_id: number; total_qty: number }>(
    `SELECT si.product_id, SUM(si.quantity) as total_qty
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= ?
     GROUP BY si.product_id
     ORDER BY total_qty DESC
     LIMIT 10`,
    startDate
  );
}
