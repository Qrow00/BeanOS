import type { SQLiteDatabase } from 'expo-sqlite';
import type { Transaction, TransactionInput } from '../types/database';

export async function getAllTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY entry_date DESC, id DESC');
}

export async function getTransactionsByType(db: SQLiteDatabase, type: 'income' | 'expense'): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE type = ? ORDER BY entry_date DESC, id DESC',
    type
  );
}

export async function createTransaction(db: SQLiteDatabase, input: TransactionInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions (description, amount, category, type, entry_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.description,
    input.amount,
    input.category,
    input.type,
    input.entry_date,
    input.created_by
  );
}

export async function deleteTransaction(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}
