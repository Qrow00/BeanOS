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

      CREATE TABLE IF NOT EXISTS product_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        measurement TEXT DEFAULT '',
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES products(id),
        UNIQUE(product_id, ingredient_id)
      );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      old_price REAL NOT NULL,
      new_price REAL NOT NULL,
      changed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
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

  try {
    const recipeCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(product_recipes)');
    if (!recipeCols.some(c => c.name === 'measurement')) {
      await db.execAsync("ALTER TABLE product_recipes ADD COLUMN measurement TEXT DEFAULT ''");
    }
  } catch { /* table may not exist yet */ }

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
    const ingredientRows: [string, string, string, number, number, string, number][] = [
      ['ING-001', 'Espresso Shot', 'Coffee', 0, 200, 'shot', 200],
      ['ING-002', 'Fresh Milk', 'General', 0, 10000, 'mL', 10000],
      ['ING-003', 'Sugar Syrup', 'General', 0, 2000, 'mL', 2000],
      ['ING-004', 'Whipped Cream', 'General', 0, 50, 'pcs', 50],
      ['ING-005', 'Chocolate Sauce', 'General', 0, 1000, 'mL', 1000],
      ['ING-006', 'Vanilla Syrup', 'General', 0, 1000, 'mL', 1000],
      ['ING-007', 'Ice Cubes', 'General', 0, 500, 'pcs', 500],
      ['ING-008', 'Caramel Sauce', 'General', 0, 1000, 'mL', 1000],
      ['ING-009', 'Matcha Powder', 'General', 0, 2000, 'g', 2000],
      ['ING-010', 'Brewed Coffee', 'Coffee', 0, 5000, 'mL', 5000],
    ];

    for (const [itemId, name, category, price, stockQty, unit, initialStock] of ingredientRows) {
      await db.runAsync(
        'INSERT INTO products (item_id, name, category, price, stock_quantity, stock_unit, is_ingredient, initial_stock, icon_color) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
        itemId, name, category, price, stockQty, unit, initialStock, ''
      );
    }

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

    const getId = async (itemId: string) => {
      const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM products WHERE item_id = ?', itemId);
      return row?.id;
    };

    const recipeData: [string, string, number, string][] = [
      ['BEV-001', 'ING-001', 1, 'shot'],
      ['BEV-002', 'ING-001', 1, 'shot'],
      ['BEV-002', 'ING-002', 200, 'mL'],
      ['BEV-003', 'ING-001', 1, 'shot'],
      ['BEV-003', 'ING-002', 150, 'mL'],
      ['BEV-003', 'ING-004', 1, 'pcs'],
      ['BEV-004', 'ING-001', 1, 'shot'],
      ['BEV-004', 'ING-002', 200, 'mL'],
      ['BEV-004', 'ING-006', 15, 'mL'],
      ['BEV-004', 'ING-008', 10, 'mL'],
      ['BEV-005', 'ING-001', 1, 'shot'],
      ['BEV-005', 'ING-002', 200, 'mL'],
      ['BEV-005', 'ING-003', 20, 'mL'],
      ['BEV-006', 'ING-001', 1, 'shot'],
      ['BEV-006', 'ING-010', 150, 'mL'],
      ['BEV-006', 'ING-007', 5, 'pcs'],
      ['BEV-007', 'ING-009', 15, 'g'],
      ['BEV-007', 'ING-002', 200, 'mL'],
      ['BEV-007', 'ING-003', 15, 'mL'],
      ['BEV-007', 'ING-007', 5, 'pcs'],
      ['BEV-008', 'ING-009', 15, 'g'],
      ['BEV-008', 'ING-002', 200, 'mL'],
      ['BEV-008', 'ING-003', 15, 'mL'],
      ['BEV-009', 'ING-001', 1, 'shot'],
      ['BEV-009', 'ING-002', 150, 'mL'],
      ['BEV-009', 'ING-005', 30, 'mL'],
      ['BEV-009', 'ING-004', 1, 'pcs'],
      ['BEV-010', 'ING-001', 1, 'shot'],
      ['BEV-010', 'ING-002', 200, 'mL'],
      ['BEV-010', 'ING-008', 15, 'mL'],
      ['BEV-010', 'ING-007', 5, 'pcs'],
    ];

    for (const [productItemId, ingredientItemId, qty, measurement] of recipeData) {
      const productId = await getId(productItemId);
      const ingredientId = await getId(ingredientItemId);
      if (productId && ingredientId) {
        await db.runAsync(
          'INSERT INTO product_recipes (product_id, ingredient_id, quantity, measurement) VALUES (?, ?, ?, ?)',
          productId, ingredientId, qty, measurement
        );
      }
    }
  }
}
