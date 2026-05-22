import type { SQLiteDatabase } from 'expo-sqlite';
import { hashPassword } from '../utils/helpers';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      display_name TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      price REAL NOT NULL CHECK(price >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
      barcode TEXT,
      description TEXT,
      image_uri TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL CHECK(discount_value > 0),
      min_purchase REAL DEFAULT 0,
      max_uses INTEGER,
      current_uses INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      coupon_id INTEGER,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      sale_date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      category TEXT NOT NULL DEFAULT 'General',
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      entry_date TEXT DEFAULT (datetime('now')),
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS hold_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL DEFAULT 'Held Cart',
      items_json TEXT NOT NULL,
      coupon_id INTEGER,
      payment_method TEXT DEFAULT 'cash',
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      item_count INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const existingAdmin = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE username = ?',
    'admin'
  );

  if (!existingAdmin) {
    const defaultHash = hashPassword('admin123');
    await db.runAsync(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
      'admin',
      defaultHash,
      'admin',
      'Administrator'
    );

    await db.runAsync(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
      'user',
      hashPassword('user123'),
      'user',
      'Staff User'
    );

    await db.runAsync(
      'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)',
      'brand_logo',
      ''
    );
  }
}
