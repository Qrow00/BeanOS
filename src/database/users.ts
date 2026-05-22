import type { SQLiteDatabase } from 'expo-sqlite';
import type { User, UserInput } from '../types/database';
import { hashPassword } from '../utils/helpers';

export async function getAllUsers(db: SQLiteDatabase): Promise<User[]> {
  return db.getAllAsync<User>('SELECT * FROM users ORDER BY username');
}

export async function getUserById(db: SQLiteDatabase, id: number): Promise<User | null> {
  return db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', id);
}

export async function getUserByUsername(db: SQLiteDatabase, username: string): Promise<User | null> {
  return db.getFirstAsync<User>('SELECT * FROM users WHERE username = ?', username);
}

export async function createUser(db: SQLiteDatabase, input: UserInput): Promise<void> {
  const password_hash = hashPassword(input.password_hash);
  await db.runAsync(
    'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
    input.username,
    password_hash,
    input.role,
    input.display_name
  );
}

export async function updateUser(
  db: SQLiteDatabase,
  id: number,
  input: Partial<UserInput>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.username !== undefined) { fields.push('username = ?'); values.push(input.username); }
  if (input.password_hash !== undefined) {
    fields.push('password_hash = ?');
    values.push(hashPassword(input.password_hash));
  }
  if (input.role !== undefined) { fields.push('role = ?'); values.push(input.role); }
  if (input.display_name !== undefined) { fields.push('display_name = ?'); values.push(input.display_name); }

  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  await db.runAsync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteUser(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM users WHERE id = ?', id);
}

export async function authenticateUser(
  db: SQLiteDatabase,
  username: string,
  password: string
): Promise<User | null> {
  const user = await getUserByUsername(db, username);
  if (!user) return null;
  const hash = hashPassword(password);
  return hash === user.password_hash ? user : null;
}
