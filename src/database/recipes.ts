import type { SQLiteDatabase } from 'expo-sqlite';
import type { RecipeItem, RecipeItemWithName } from '../types/database';

export async function getRecipe(
  db: SQLiteDatabase,
  productId: number
): Promise<RecipeItemWithName[]> {
  return db.getAllAsync<RecipeItemWithName>(
    `SELECT pr.*, p.name AS ingredient_name, p.category AS ingredient_category
     FROM product_recipes pr
     LEFT JOIN products p ON p.id = pr.ingredient_id
     WHERE pr.product_id = ?
     ORDER BY p.name`,
    productId
  );
}

export async function addRecipeItem(
  db: SQLiteDatabase,
  productId: number,
  ingredientId: number,
  quantity: number,
  measurement?: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO product_recipes (product_id, ingredient_id, quantity, measurement) VALUES (?, ?, ?, ?)',
    productId,
    ingredientId,
    quantity,
    measurement || ''
  );
}

export async function removeRecipeItem(
  db: SQLiteDatabase,
  productId: number,
  ingredientId: number
): Promise<void> {
  await db.runAsync(
    'DELETE FROM product_recipes WHERE product_id = ? AND ingredient_id = ?',
    productId,
    ingredientId
  );
}
