import type { SQLiteDatabase } from 'expo-sqlite';
import type { Customer, LoyaltyLedgerEntry } from '../types/database';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LC-${code}`;
}

export async function getAllCustomers(db: SQLiteDatabase): Promise<Customer[]> {
  return db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY name');
}

export async function searchCustomers(db: SQLiteDatabase, query: string): Promise<Customer[]> {
  const q = `%${query}%`;
  return db.getAllAsync<Customer>(
    'SELECT * FROM customers WHERE name LIKE ? OR code LIKE ? OR phone LIKE ? ORDER BY name',
    q, q, q
  );
}

export async function getCustomerById(db: SQLiteDatabase, id: number): Promise<Customer | null> {
  return db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', id);
}

export async function getCustomerByCode(db: SQLiteDatabase, code: string): Promise<Customer | null> {
  return db.getFirstAsync<Customer>(
    'SELECT * FROM customers WHERE UPPER(code) = UPPER(?)',
    code.trim()
  );
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
}

export async function createCustomer(
  db: SQLiteDatabase,
  input: CustomerInput
): Promise<Customer> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    try {
      const result = await db.runAsync(
        `INSERT INTO customers (code, name, phone) VALUES (?, ?, ?)`,
        code,
        input.name.trim(),
        input.phone?.trim() || null
      );
      const created = await getCustomerById(db, result.lastInsertRowId as number);
      if (created) return created;
    } catch (err: any) {
      if (!String(err?.message || '').includes('UNIQUE')) throw err;
    }
  }
  throw new Error('Failed to generate unique customer code');
}

export async function updateCustomer(
  db: SQLiteDatabase,
  id: number,
  input: Partial<CustomerInput> & { is_active?: number }
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name.trim()); }
  if (input.phone !== undefined) { fields.push('phone = ?'); values.push(input.phone?.trim() || null); }
  if (input.is_active !== undefined) { fields.push('is_active = ?'); values.push(input.is_active); }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.runAsync(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteCustomer(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM loyalty_ledger WHERE customer_id = ?', id);
    await txn.runAsync('UPDATE sales SET customer_id = NULL WHERE customer_id = ?', id);
    await txn.runAsync('DELETE FROM customers WHERE id = ?', id);
  });
}

export async function adjustPoints(
  db: SQLiteDatabase,
  customerId: number,
  deltaPoints: number,
  description: string,
  createdBy: number
): Promise<number> {
  let newBalance = 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    const customer = await txn.getFirstAsync<Customer>(
      'SELECT * FROM customers WHERE id = ?',
      customerId
    );
    if (!customer) throw new Error('Customer not found');
    newBalance = customer.points_balance + deltaPoints;
    if (newBalance < 0) throw new Error('Adjustment would make balance negative');

    await txn.runAsync(
      "INSERT INTO loyalty_ledger (customer_id, sale_id, type, points, description, created_by) VALUES (?, NULL, 'adjust', ?, ?, ?)",
      customerId, deltaPoints, description, createdBy
    );
    await txn.runAsync(
      `UPDATE customers SET points_balance = ?, lifetime_points = MAX(lifetime_points + ?, 0), updated_at = datetime('now') WHERE id = ?`,
      newBalance, Math.max(deltaPoints, 0), customerId
    );
  });
  return newBalance;
}

export async function getLedger(
  db: SQLiteDatabase,
  customerId: number,
  limit: number = 100
): Promise<LoyaltyLedgerEntry[]> {
  return db.getAllAsync<LoyaltyLedgerEntry>(
    'SELECT * FROM loyalty_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT ?',
    customerId, limit
  );
}

export async function getActiveCustomersCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM customers WHERE is_active = 1'
  );
  return row?.count ?? 0;
}
