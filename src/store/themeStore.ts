import { create } from 'zustand';
import { Appearance } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../database/connection';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primarySurface: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  disabled: string;
  overlay: string;
}

export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primarySurface: '#EEF2FF',
  secondary: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  disabled: '#CBD5E1',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkTheme: ThemeColors = {
  background: '#141414',
  surface: '#1E1E1E',
  text: '#F5F5F5',
  textSecondary: '#A3A3A3',
  border: '#333333',
  primary: '#60A5FA',
  primarySurface: '#1E3A5F',
  secondary: '#A3A3A3',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  disabled: '#525252',
  overlay: 'rgba(0,0,0,0.7)',
};

function getSystemMode(): 'light' | 'dark' {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export interface ThemeState {
  colors: ThemeColors;
  mode: 'light' | 'dark';
  isLoading: boolean;
  loadThemeFromDb: (db: SQLiteDatabase) => Promise<void>;
  toggleTheme: () => Promise<void>;
  themeOverlay: { originX: number; originY: number; overlayBg: string; newBg: string } | null;
  setThemeOverlay: (overlay: { originX: number; originY: number; overlayBg: string; newBg: string } | null) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colors: getSystemMode() === 'dark' ? darkTheme : lightTheme,
  mode: getSystemMode(),
  isLoading: true,
  themeOverlay: null,

  setThemeOverlay: (overlay) => set({ themeOverlay: overlay }),

  loadThemeFromDb: async (db: SQLiteDatabase) => {
    try {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'theme_mode'
      );
      const saved = row?.value;
      const mode: 'light' | 'dark' = saved === 'light' || saved === 'dark' ? saved : getSystemMode();
      set({ colors: mode === 'dark' ? darkTheme : lightTheme, mode, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleTheme: async () => {
    const newMode = get().mode === 'light' ? 'dark' : 'light';
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'theme_mode',
        newMode
      );
    } catch {}
    set({ colors: newMode === 'dark' ? darkTheme : lightTheme, mode: newMode });
  },
}));
