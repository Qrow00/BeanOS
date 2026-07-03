import { sha256 } from 'js-sha256';
import * as Crypto from 'expo-crypto';
import { PIN_ITERATIONS } from './constants';

let _currencySymbol = '₱';

export function setCurrencySymbol(s: string) {
  _currencySymbol = s;
}

export function hashPinLegacy(pin: string): string {
  return sha256(pin + 'mobile-pos-salt');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  let hash = pin;
  for (let i = 0; i < PIN_ITERATIONS; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      salt + hash
    );
  }
  return hash;
}

export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateItemId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ITEM-${timestamp}-${random}`;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

export function formatCurrency(amount: number): string {
  return `${_currencySymbol}${amount.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
