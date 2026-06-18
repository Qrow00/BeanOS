import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../database/connection';
import { setCurrencySymbol } from '../utils/helpers';

export interface SettingsState {
  storeName: string;
  currencySymbol: string;
  currencyCode: string;
  brandLogoUri: string | null;
  gcashQrUri: string | null;
  gcashCompanyName: string;
  mayaQrUri: string | null;
  mayaCompanyName: string;
  isLoading: boolean;
  loadSettings: (db: SQLiteDatabase) => Promise<void>;
  saveStoreName: (name: string) => Promise<void>;
  setCurrency: (symbol: string, code: string) => Promise<void>;
  saveBrandLogo: (uri: string) => Promise<void>;
  saveGcashQr: (uri: string) => Promise<void>;
  saveGcashCompanyName: (name: string) => Promise<void>;
  saveMayaQr: (uri: string) => Promise<void>;
  saveMayaCompanyName: (name: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storeName: 'BeanOS',
  currencySymbol: '₱',
  currencyCode: 'PHP',
  brandLogoUri: null,
  gcashQrUri: null,
  gcashCompanyName: '',
  mayaQrUri: null,
  mayaCompanyName: '',
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
}));
