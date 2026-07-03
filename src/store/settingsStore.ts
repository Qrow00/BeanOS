import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../database/connection';
import { setCurrencySymbol } from '../utils/helpers';
import type { PrinterConfig } from '../services/printer';

const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  connectionType: 'none',
  ipAddress: '',
  port: 9100,
  macAddress: '',
  paperSize: 58,
};

export interface SettingsState {
  storeName: string;
  currencySymbol: string;
  currencyCode: string;
  brandLogoUri: string | null;
  gcashQrUri: string | null;
  gcashCompanyName: string;
  mayaQrUri: string | null;
  mayaCompanyName: string;
  printerConfig: PrinterConfig;
  isLoading: boolean;
  loadSettings: (db: SQLiteDatabase) => Promise<void>;
  saveStoreName: (name: string) => Promise<void>;
  setCurrency: (symbol: string, code: string) => Promise<void>;
  saveBrandLogo: (uri: string) => Promise<void>;
  saveGcashQr: (uri: string) => Promise<void>;
  saveGcashCompanyName: (name: string) => Promise<void>;
  saveMayaQr: (uri: string) => Promise<void>;
  saveMayaCompanyName: (name: string) => Promise<void>;
  savePrinterConfig: (config: Partial<PrinterConfig>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  storeName: 'BeanOS',
  currencySymbol: '₱',
  currencyCode: 'PHP',
  brandLogoUri: null,
  gcashQrUri: null,
  gcashCompanyName: '',
  mayaQrUri: null,
  mayaCompanyName: '',
  printerConfig: { ...DEFAULT_PRINTER_CONFIG },
  isLoading: true,

  loadSettings: async (db: SQLiteDatabase) => {
    try {
      const storeName = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'store_name'
      );
      if (storeName?.value) {
        set({ storeName: storeName.value });
      }

      const currency = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'app_currency'
      );
      if (currency?.value) {
        const parts = currency.value.split('|');
        if (parts.length === 2) {
          const [code, symbol] = parts;
          setCurrencySymbol(symbol);
          set({ currencySymbol: symbol, currencyCode: code });
        }
      }
      const logo = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'brand_logo'
      );
      if (logo?.value) {
        set({ brandLogoUri: logo.value });
      }

      const gcashQr = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'gcash_qr_uri'
      );
      if (gcashQr?.value) {
        set({ gcashQrUri: gcashQr.value });
      }

      const gcashName = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'gcash_company_name'
      );
      if (gcashName?.value) {
        set({ gcashCompanyName: gcashName.value });
      }

      const mayaQr = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'maya_qr_uri'
      );
      if (mayaQr?.value) {
        set({ mayaQrUri: mayaQr.value });
      }

      const mayaName = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'maya_company_name'
      );
      if (mayaName?.value) {
        set({ mayaCompanyName: mayaName.value });
      }

      const printerType = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'printer_connection_type'
      );
      const printerIp = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'printer_ip_address'
      );
      const printerPort = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'printer_port'
      );
      const printerMac = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'printer_mac_address'
      );
      const printerPaper = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'printer_paper_size'
      );

      set({
        printerConfig: {
          connectionType: (printerType?.value as any) || 'none',
          ipAddress: printerIp?.value || '',
          port: parseInt(printerPort?.value || '9100', 10),
          macAddress: printerMac?.value || '',
          paperSize: parseInt(printerPaper?.value || '58', 10) as 58 | 80,
        },
      });
    } catch {}
    set({ isLoading: false });
  },

  saveStoreName: async (name: string) => {
    set({ storeName: name });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'store_name',
        name
      );
    } catch {}
  },

  setCurrency: async (symbol: string, code: string) => {
    setCurrencySymbol(symbol);
    set({ currencySymbol: symbol, currencyCode: code });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'app_currency',
        `${code}|${symbol}`
      );
    } catch {}
  },

  saveBrandLogo: async (uri: string) => {
    set({ brandLogoUri: uri });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'brand_logo',
        uri
      );
    } catch {}
  },

  saveGcashQr: async (uri: string) => {
    set({ gcashQrUri: uri });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'gcash_qr_uri',
        uri
      );
    } catch {}
  },

  saveGcashCompanyName: async (name: string) => {
    set({ gcashCompanyName: name });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'gcash_company_name',
        name
      );
    } catch {}
  },

  saveMayaQr: async (uri: string) => {
    set({ mayaQrUri: uri });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'maya_qr_uri',
        uri
      );
    } catch {}
  },

  saveMayaCompanyName: async (name: string) => {
    set({ mayaCompanyName: name });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'maya_company_name',
        name
      );
    } catch {}
  },

  savePrinterConfig: async (config: Partial<PrinterConfig>) => {
    const current = get().printerConfig;
    const merged = { ...current, ...config };
    set({ printerConfig: merged });
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'printer_connection_type',
        merged.connectionType
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'printer_ip_address',
        merged.ipAddress
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'printer_port',
        String(merged.port)
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'printer_mac_address',
        merged.macAddress
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'printer_paper_size',
        String(merged.paperSize)
      );
    } catch {}
  },
}));
