import type { SQLiteDatabase } from 'expo-sqlite';
import { hashPin, hashPinLegacy, generateSalt } from '../utils/helpers';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      salt TEXT NOT NULL DEFAULT '',
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

  const hasSalt = cols.some(c => c.name === 'salt');
  if (!hasSalt) {
    await db.execAsync("ALTER TABLE users ADD COLUMN salt TEXT NOT NULL DEFAULT ''");
  }

  const legacyAdminHash = hashPinLegacy('0000');
  const legacyUserHash = hashPinLegacy('1234');
  const legacyMigratedIds: number[] = [];
  const allUsers = await db.getAllAsync<{ id: number; pin_hash: string; salt: string }>(
    'SELECT id, pin_hash, salt FROM users'
  );
  for (const u of allUsers) {
    if (u.pin_hash === legacyAdminHash) {
      const s = await generateSalt();
      await db.runAsync('UPDATE users SET salt = ?, pin_hash = ? WHERE id = ?', s, await hashPin('0000', s), u.id);
      legacyMigratedIds.push(u.id);
      console.log(`[migrate] migrated legacy admin (id=${u.id})`);
    } else if (u.pin_hash === legacyUserHash) {
      const s = await generateSalt();
      await db.runAsync('UPDATE users SET salt = ?, pin_hash = ? WHERE id = ?', s, await hashPin('1234', s), u.id);
      legacyMigratedIds.push(u.id);
      console.log(`[migrate] migrated legacy user (id=${u.id})`);
    } else {
      console.log(`[migrate] user id=${u.id} pin_hash=${u.pin_hash.slice(0, 8)}... salt=${u.salt ? u.salt.slice(0, 6) + '...' : '(empty)'} NOT legacy`);
    }
  }
  if (legacyMigratedIds.length > 0) {
    const placeholders = legacyMigratedIds.map(() => '?').join(',');
    await db.runAsync(`UPDATE users SET salt = '' WHERE id NOT IN (${placeholders}) AND salt != ''`, ...legacyMigratedIds);
  }

  const prodCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
  if (!prodCols.some(c => c.name === 'stock_unit')) {
    await db.execAsync("ALTER TABLE products ADD COLUMN stock_unit TEXT NOT NULL DEFAULT 'pcs'");
  }
  if (!prodCols.some(c => c.name === 'icon_color')) {
    try { await db.execAsync("ALTER TABLE products ADD COLUMN icon_color TEXT DEFAULT ''"); } catch {}
  }

  const existingAdmin = await db.getFirstAsync<{ id: number; pin_hash: string; salt: string }>(
    'SELECT id, pin_hash, salt FROM users WHERE username = ?',
    'admin'
  );

  if (existingAdmin) {
    const adminSaltedOk = existingAdmin.salt ? await hashPin('0000', existingAdmin.salt) === existingAdmin.pin_hash : false;
    const adminLegacyOk = hashPinLegacy('0000') === existingAdmin.pin_hash;
    console.log(`[migrate] admin id=${existingAdmin.id} salt=${existingAdmin.salt ? existingAdmin.salt.slice(0,6)+'...' : '(empty)'} pin_hash=${existingAdmin.pin_hash.slice(0,8)}... saltedOk=${adminSaltedOk} legacyOk=${adminLegacyOk}`);
    if (!adminSaltedOk && !adminLegacyOk) {
      const s = await generateSalt();
      const newHash = await hashPin('0000', s);
      await db.runAsync('UPDATE users SET salt = ?, pin_hash = ? WHERE id = ?', s, newHash, existingAdmin.id);
      console.log(`[migrate] admin FORCE-RESET with new salt`);
    }
  } else {
    const adminSalt = await generateSalt();
    const userSalt = await generateSalt();
    await db.runAsync(
      'INSERT INTO users (username, pin_hash, salt, role, display_name) VALUES (?, ?, ?, ?, ?)',
      'admin',
      await hashPin('0000', adminSalt),
      adminSalt,
      'admin',
      'Admin'
    );

    await db.runAsync(
      'INSERT INTO users (username, pin_hash, salt, role, display_name) VALUES (?, ?, ?, ?, ?)',
      'user',
      await hashPin('1234', userSalt),
      userSalt,
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
    const productRows: [string, string, string, number, number, string][] = [
      ['BEV-001', 'Classic Espresso', 'Coffee', 90, 100, 'pcs'],
      ['BEV-002', 'Café Latte', 'Coffee', 120, 100, 'pcs'],
      ['BEV-003', 'Cappuccino', 'Coffee', 120, 100, 'pcs'],
      ['BEV-004', 'Caramel Macchiato', 'Coffee', 135, 100, 'pcs'],
      ['BEV-005', 'Spanish Latte', 'Coffee', 130, 100, 'pcs'],
      ['BEV-006', 'Iced Americano', 'Coffee', 100, 100, 'pcs'],
      ['BEV-007', 'Iced Matcha Latte', 'Tea', 140, 100, 'pcs'],
      ['BEV-008', 'Hot Matcha Latte', 'Tea', 130, 100, 'pcs'],
      ['BEV-009', 'Mocha', 'Coffee', 135, 100, 'pcs'],
      ['BEV-010', 'Iced Caramel Latte', 'Coffee', 140, 100, 'pcs'],
      ['PS-001', 'Croissant', 'Pastry', 75, 50, 'pcs'],
      ['PS-002', 'Blueberry Muffin', 'Pastry', 65, 50, 'pcs'],
      ['PS-003', 'Chocolate Chip Cookie', 'Pastry', 45, 50, 'pcs'],
      ['PS-004', 'Banana Bread', 'Pastry', 55, 50, 'pcs'],
      ['PS-005', 'Ensaymada', 'Pastry', 50, 50, 'pcs'],
    ];

    for (const [itemId, name, category, price, stockQty, unit] of productRows) {
      await db.runAsync(
        'INSERT INTO products (item_id, name, category, price, stock_quantity, stock_unit) VALUES (?, ?, ?, ?, ?, ?)',
        itemId, name, category, price, stockQty, unit
      );
    }
  }
}
