import { Alert, Platform } from 'react-native';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { CartItem } from '../types/store';

export type PrinterConnectionType = 'none' | 'bluetooth' | 'network';

export interface PrinterConfig {
  connectionType: PrinterConnectionType;
  ipAddress: string;
  port: number;
  macAddress: string;
  paperSize: 58 | 80;
}

export interface BluetoothDevice {
  name: string;
  macAddress: string;
}

const PAYLOAD_OPTIONS = {
  mmWidth: 80,
  charset: 'CP1252',
  removeSpecialCode: true,
  beepAtEnd: true,
};

function getLineWidth(paperSize: 58 | 80): number {
  return paperSize === 58 ? 32 : 48;
}

function padCenter(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text;
}

function padRight(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  return text + ' '.repeat(pad);
}

function formatItemLine(
  name: string,
  qty: number,
  price: number,
  width: number
): string {
  const priceStr = formatCurrency(price * qty);
  const qtyStr = `x${qty}`;
  const rightSide = `${qtyStr} ${priceStr}`;
  const maxNameLen = width - rightSide.length - 1;
  const displayName =
    name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '~' : name;
  return `${displayName}${' '.repeat(width - displayName.length - rightSide.length)}${rightSide}`;
}

export function buildReceiptText(
  storeName: string,
  receiptNumber: string,
  items: CartItem[],
  subtotal: number,
  discount: number,
  total: number,
  paymentMethod: string,
  amountTendered: number,
  change: number,
  cashierName: string,
  dateStr: string,
  paperSize: 58 | 80 = 58
): string {
  const w = getLineWidth(paperSize);
  const line = '-'.repeat(w);
  const now = formatDate(dateStr);
  const method = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);

  let text = '';

  text += `[C]<b>${storeName}</b>\n`;
  text += `[C]Receipt\n`;
  text += `[C]#${receiptNumber}\n`;
  text += `[C]${now}\n`;
  text += `[C]Cashier: ${cashierName}\n`;
  text += `[L]${line}\n`;

  text += `[L]${'Item'.padEnd(w - 20)}${'Qty'.padEnd(6)}Price\n`;
  text += `[L]${line}\n`;

  for (const item of items) {
    const line = formatItemLine(
      item.product.name,
      item.quantity,
      item.product.price,
      w
    );
    text += `[L]${line}\n`;
  }

  text += `[L]${line}\n`;
  text += `[L]${padRight('Subtotal:', w - 10)}${' '.repeat(10 - formatCurrency(subtotal).length)}${formatCurrency(subtotal)}\n`;

  if (discount > 0) {
    text += `[L]${padRight('Discount:', w - 10)}-${' '.repeat(9 - formatCurrency(discount).length)}${formatCurrency(discount)}\n`;
  }

  text += `[L]<b>${padRight('TOTAL:', w - 10)}${' '.repeat(10 - formatCurrency(total).length)}${formatCurrency(total)}</b>\n`;
  text += `[L]${line}\n`;

  text += `[L]Payment: ${method}\n`;
  text += `[L]Amount: ${formatCurrency(amountTendered)}\n`;
  if (change > 0) {
    text += `[L]Change: ${formatCurrency(change)}\n`;
  }
  text += `[L]${line}\n`;

  text += `[C]Thank you!\n`;
  text += `[C]${storeName}\n`;
  text += `\n`;
  text += `<cut>`;

  return text;
}

export async function getBluetoothDeviceList(): Promise<BluetoothDevice[]> {
  try {
    const ThermalPrinterModule = require('react-native-thermal-printer');
    const list = await ThermalPrinterModule.getBluetoothDeviceList();
    if (Array.isArray(list)) {
      return list.map((d: any) => ({
        name: d.name || d.device_name || 'Unknown',
        macAddress: d.macAddress || d.address || d.mac_address || '',
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function printReceipt(
  config: PrinterConfig,
  receiptData: {
    storeName: string;
    receiptNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    amountTendered: number;
    change: number;
    cashierName: string;
    date: string;
  }
): Promise<void> {
  if (config.connectionType === 'none') {
    throw new Error('No printer configured');
  }

  const text = buildReceiptText(
    receiptData.storeName,
    receiptData.receiptNumber,
    receiptData.items,
    receiptData.subtotal,
    receiptData.discount,
    receiptData.total,
    receiptData.paymentMethod,
    receiptData.amountTendered,
    receiptData.change,
    receiptData.cashierName,
    receiptData.date,
    config.paperSize
  );

  try {
    const ThermalPrinterModule = require('react-native-thermal-printer');

    if (config.connectionType === 'bluetooth') {
      await ThermalPrinterModule.printBluetooth({
        ...PAYLOAD_OPTIONS,
        payload: text,
      });
    } else {
      await ThermalPrinterModule.printIP({
        ...PAYLOAD_OPTIONS,
        ip: config.ipAddress,
        port: config.port || 9100,
        payload: text,
      });
    }
  } catch (err: any) {
    throw new Error(err?.message || 'Print failed');
  }
}
