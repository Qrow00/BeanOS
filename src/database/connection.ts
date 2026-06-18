import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from '../utils/constants';
import { initializeDatabase } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(db);
  return db;
}

export function useDb() {
  const database = SQLite.useSQLiteContext();
  return database;
}
