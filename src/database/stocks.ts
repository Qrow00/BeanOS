import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product } from '../types/database';

export interface ProductWithRecipe extends Product {
  recipe_quantity: number | null;
  recipe_measurement: string | null;
}

export async function getRecipeIngredientsWithStock(db: SQLiteDatabase): Promise<ProductWithRecipe[]> {
  return db.getAllAsync<ProductWithRecipe>(
    `SELECT p.*, pr.quantity AS recipe_quantity, pr.measurement AS recipe_measurement
     FROM products p
     LEFT JOIN product_recipes pr ON pr.ingredient_id = p.id
     WHERE p.is_ingredient = 1
     GROUP BY p.id
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

export async function setMeasurement(db: SQLiteDatabase, productId: number, measurement: string): Promise<void> {
  await db.runAsync(
    `UPDATE products SET measurement = ?, updated_at = datetime('now') WHERE id = ?`,
    measurement,
    productId
  );
}
