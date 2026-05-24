import type { SQLiteDatabase } from 'expo-sqlite';

export interface PriceMovement {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  stock_unit: string;
  measurement: string | null;
  old_price: number | null;
  new_price: number | null;
  changed_at: string | null;
  created_at: string;
}

export async function recordPriceChange(
  db: SQLiteDatabase,
  productId: number,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO price_history (product_id, old_price, new_price) VALUES (?, ?, ?)`,
    productId,
    oldPrice,
    newPrice
  );
}

export async function getIngredientPriceMovements(db: SQLiteDatabase): Promise<PriceMovement[]> {
  return db.getAllAsync<PriceMovement>(
    `SELECT p.id, p.name, p.price, p.stock_quantity, p.stock_unit, p.measurement, p.created_at,
            ph.old_price, ph.new_price, ph.changed_at
     FROM products p
     LEFT JOIN (
       SELECT product_id, old_price, new_price, changed_at
       FROM price_history
       WHERE id IN (SELECT MAX(id) FROM price_history GROUP BY product_id)
     ) ph ON ph.product_id = p.id
     WHERE p.is_ingredient = 1
     ORDER BY p.name`
  );
}
