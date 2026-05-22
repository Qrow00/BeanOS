import { sha256 } from 'js-sha256';

let _currencySymbol = '₱';

export function setCurrencySymbol(s: string) {
  _currencySymbol = s;
}

export function hashPassword(password: string): string {
  return sha256(password + 'mobile-pos-salt');
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
