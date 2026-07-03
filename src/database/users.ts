import type { SQLiteDatabase } from 'expo-sqlite';
import type { User, UserInput } from '../types/database';
import { hashPin, hashPinLegacy, generateSalt } from '../utils/helpers';

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
  const salt = await generateSalt();
  const pin_hash = await hashPin(input.pin_hash, salt);
  await db.runAsync(
    'INSERT INTO users (username, pin_hash, salt, role, display_name) VALUES (?, ?, ?, ?, ?)',
    input.username,
    pin_hash,
    salt,
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
  if (input.pin_hash !== undefined) {
    const existing = await db.getFirstAsync<{ salt: string }>('SELECT salt FROM users WHERE id = ?', id);
    if (existing) {
      if (existing.salt) {
        const newHash = await hashPin(input.pin_hash, existing.salt);
        fields.push('pin_hash = ?');
        values.push(newHash);
      } else {
        const newSalt = await generateSalt();
        fields.push('salt = ?');
        values.push(newSalt);
        fields.push('pin_hash = ?');
        values.push(await hashPin(input.pin_hash, newSalt));
      }
    }
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
  userId: number,
  pin: string
): Promise<User | null> {
  const user = await getUserById(db, userId);
  if (!user) return null;

  let lastError = '';

  try {
    if (user.salt) {
      const salted = await hashPin(pin, user.salt);
      if (salted === user.pin_hash) {
        console.log(`[auth] OK salted: user=${user.username} salt=${user.salt.slice(0, 6)}...`);
        return user;
      }
      lastError = `salted mismatch`;
    } else {
      lastError = `no salt`;
    }
  } catch (e: any) {
    lastError = `hashPin threw: ${e?.message ?? e}`;
  }

  try {
    const legacy = hashPinLegacy(pin);
    if (legacy === user.pin_hash) {
      console.log(`[auth] OK legacy: user=${user.username}`);
      return user;
    }
    lastError += ` | legacy mismatch`;
  } catch (e: any) {
    lastError += ` | hashPinLegacy threw: ${e?.message ?? e}`;
  }

  console.log(`[auth] FAIL: user=${user.username} salt=${user.salt ? user.salt.slice(0, 6) + '...' : '(empty)'} pin_hash=${user.pin_hash.slice(0, 8)}... err=${lastError}`);
  return null;
}
