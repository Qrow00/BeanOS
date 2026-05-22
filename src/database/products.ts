import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product, ProductInput } from '../types/database';

export async function getAllProducts(db: SQLiteDatabase): Promise<Product[]> {
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY name');
}

export async function getProductById(db: SQLiteDatabase, id: number): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
}

export async function getProductByBarcode(db: SQLiteDatabase, barcode: string): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE barcode = ?', barcode);
}

export async function getProductByItemId(db: SQLiteDatabase, itemId: string): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE item_id = ?', itemId);
}

export async function searchProducts(
  db: SQLiteDatabase,
  query: string,
  category?: string | null
): Promise<Product[]> {
  let sql = 'SELECT * FROM products WHERE (name LIKE ? OR item_id LIKE ? OR barcode LIKE ?)';
  const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY name';
  return db.getAllAsync<Product>(sql, ...params);
}

export async function createProduct(db: SQLiteDatabase, input: ProductInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO products (item_id, name, category, price, stock_quantity, barcode, description, image_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.item_id,
    input.name,
    input.category,
    input.price,
    input.stock_quantity,
    input.barcode,
    input.description,
    input.image_uri
  );
}

export async function updateProduct(
  db: SQLiteDatabase,
  id: number,
  input: Partial<ProductInput>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.item_id !== undefined) { fields.push('item_id = ?'); values.push(input.item_id); }
  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
  if (input.category !== undefined) { fields.push('category = ?'); values.push(input.category); }
  if (input.price !== undefined) { fields.push('price = ?'); values.push(input.price); }
  if (input.stock_quantity !== undefined) { fields.push('stock_quantity = ?'); values.push(input.stock_quantity); }
  if (input.barcode !== undefined) { fields.push('barcode = ?'); values.push(input.barcode); }
  if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
  if (input.image_uri !== undefined) { fields.push('image_uri = ?'); values.push(input.image_uri); }

  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  await db.runAsync(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteProduct(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}

export async function forceDeleteProduct(db: SQLiteDatabase, id: number): Promise<number> {
  const result = await db.runAsync('DELETE FROM sale_items WHERE product_id = ?', id);
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
  return result.changes;
}

export async function getCategories(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM products ORDER BY category'
  );
  return rows.map(r => r.category);
}
