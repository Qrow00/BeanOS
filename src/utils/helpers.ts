import { sha256 } from 'js-sha256';

let _currencySymbol = '₱';
let _locale = 'en-US';
let _timeZone: string | undefined;

export function setCurrencySymbol(s: string) {
  _currencySymbol = s;
}

export function setLocale(locale: string) {
  _locale = locale || 'en-US';
}

export function setTimeZone(timeZone: string) {
  _timeZone = timeZone || undefined;
}

export function hashPin(pin: string): string {
  return sha256(pin + 'mobile-pos-salt');
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

function parseDate(dateString: string): Date {
  if (!dateString) return new Date(NaN);
  const s = dateString.trim();
  // SQLite stores datetime('now') as UTC "YYYY-MM-DD HH:MM:SS" (no timezone).
  // Mark it as UTC so it is not misread as local time.
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z');
  }
  // Date-only string: keep as local midnight to avoid a day shift.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + 'T00:00:00');
  }
  return new Date(s);
}

export function formatDate(dateString: string): string {
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleDateString(_locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: _timeZone,
    });
  } catch {
    return date.toLocaleDateString(_locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
