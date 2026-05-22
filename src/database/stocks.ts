import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product } from '../types/database';

export async function getRecipeIngredientsWithStock(db: SQLiteDatabase): Promise<Product[]> {
  return db.getAllAsync<Product>(
    `SELECT DISTINCT p.* FROM products p
     INNER JOIN product_recipes pr ON pr.ingredient_id = p.id
     ORDER BY p.name`
  );
}

export async function addStock(db: SQLiteDatabase, productId: number, quantity: number): Promise<void> {
  await db.runAsync(
    `UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?`,
    quantity,
    productId
  );
}

export async function setStockUnit(db: SQLiteDatabase, productId: number, unit: string): Promise<void> {
  await db.runAsync(
    `UPDATE products SET stock_unit = ?, updated_at = datetime('now') WHERE id = ?`,
    unit,
    productId
  );
}
