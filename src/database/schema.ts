import type { SQLiteDatabase } from 'expo-sqlite';
import { hashPin } from '../utils/helpers';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
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
      is_ingredient INTEGER NOT NULL DEFAULT 0,
      barcode TEXT,
      description TEXT,
      image_uri TEXT,
      stock_unit TEXT NOT NULL DEFAULT 'pcs',
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

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      points_balance INTEGER NOT NULL DEFAULT 0 CHECK(points_balance >= 0),
      lifetime_points INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loyalty_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      sale_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('earn', 'redeem', 'adjust')),
      points INTEGER NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  await db.execAsync(`
    DROP TABLE IF EXISTS product_recipes;
    DROP TABLE IF EXISTS price_history;
    DELETE FROM products WHERE is_ingredient = 1;
  `);

  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(users)');
  if (cols.some(c => c.name === 'password_hash')) {
    await db.execAsync('ALTER TABLE users RENAME COLUMN password_hash TO pin_hash');
  }

  const prodCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
  if (!prodCols.some(c => c.name === 'stock_unit')) {
    await db.execAsync("ALTER TABLE products ADD COLUMN stock_unit TEXT NOT NULL DEFAULT 'pcs'");
  }
  if (!prodCols.some(c => c.name === 'measurement')) {
    await db.execAsync("ALTER TABLE products ADD COLUMN measurement TEXT DEFAULT ''");
  }
  if (!prodCols.some(c => c.name === 'is_ingredient')) {
    await db.execAsync("ALTER TABLE products ADD COLUMN is_ingredient INTEGER DEFAULT 0");
  }
  if (!prodCols.some(c => c.name === 'initial_stock')) {
    try { await db.execAsync("ALTER TABLE products ADD COLUMN initial_stock INTEGER DEFAULT 0"); } catch {}
  }
  if (!prodCols.some(c => c.name === 'icon_color')) {
    try { await db.execAsync("ALTER TABLE products ADD COLUMN icon_color TEXT DEFAULT ''"); } catch {}
  }

  const saleCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sales)');
  if (!saleCols.some(c => c.name === 'customer_id')) {
    try { await db.execAsync('ALTER TABLE sales ADD COLUMN customer_id INTEGER REFERENCES customers(id)'); } catch {}
  }
  if (!saleCols.some(c => c.name === 'points_earned')) {
    try { await db.execAsync('ALTER TABLE sales ADD COLUMN points_earned INTEGER DEFAULT 0'); } catch {}
  }
  if (!saleCols.some(c => c.name === 'points_redeemed')) {
    try { await db.execAsync('ALTER TABLE sales ADD COLUMN points_redeemed INTEGER DEFAULT 0'); } catch {}
  }

  await db.runAsync(
    "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('loyalty_earn_rate', '50')"
  );
  await db.runAsync(
    "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('loyalty_point_value', '1')"
  );

  await db.runAsync('UPDATE users SET pin_hash = ? WHERE username = ?', hashPin('0000'), 'admin');
  await db.runAsync('UPDATE users SET pin_hash = ? WHERE username = ?', hashPin('1234'), 'user');

  const existingAdmin = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE username = ?',
    'admin'
  );

  if (!existingAdmin) {
    await db.runAsync(
      'INSERT INTO users (username, pin_hash, role, display_name) VALUES (?, ?, ?, ?)',
      'admin',
      hashPin('0000'),
      'admin',
      'Admin'
    );

    await db.runAsync(
      'INSERT INTO users (username, pin_hash, role, display_name) VALUES (?, ?, ?, ?)',
      'user',
      hashPin('1234'),
      'user',
      'Cashier'
    );

    await db.runAsync(
      'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)',
      'brand_logo',
      ''
    );
  }

  const existingProducts = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM products'
  );

  if (existingProducts?.count === 0) {
    const productRows: [string, string, string, number, number, string, number][] = [
      ['BEV-001', 'Classic Espresso', 'Coffee', 90, 100, 'pcs', 100],
      ['BEV-002', 'Café Latte', 'Coffee', 120, 100, 'pcs', 100],
      ['BEV-003', 'Cappuccino', 'Coffee', 120, 100, 'pcs', 100],
      ['BEV-004', 'Caramel Macchiato', 'Coffee', 135, 100, 'pcs', 100],
      ['BEV-005', 'Spanish Latte', 'Coffee', 130, 100, 'pcs', 100],
      ['BEV-006', 'Iced Americano', 'Coffee', 100, 100, 'pcs', 100],
      ['BEV-007', 'Iced Matcha Latte', 'Tea', 140, 100, 'pcs', 100],
      ['BEV-008', 'Hot Matcha Latte', 'Tea', 130, 100, 'pcs', 100],
      ['BEV-009', 'Mocha', 'Coffee', 135, 100, 'pcs', 100],
      ['BEV-010', 'Iced Caramel Latte', 'Coffee', 140, 100, 'pcs', 100],
      ['PS-001', 'Croissant', 'Pastry', 75, 50, 'pcs', 50],
      ['PS-002', 'Blueberry Muffin', 'Pastry', 65, 50, 'pcs', 50],
      ['PS-003', 'Chocolate Chip Cookie', 'Pastry', 45, 50, 'pcs', 50],
      ['PS-004', 'Banana Bread', 'Pastry', 55, 50, 'pcs', 50],
      ['PS-005', 'Ensaymada', 'Pastry', 50, 50, 'pcs', 50],
    ];

    for (const [itemId, name, category, price, stockQty, unit, initialStock] of productRows) {
      await db.runAsync(
        'INSERT INTO products (item_id, name, category, price, stock_quantity, stock_unit, is_ingredient, initial_stock, icon_color) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
        itemId, name, category, price, stockQty, unit, initialStock, ''
      );
    }
  }
}
