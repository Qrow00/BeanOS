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
  // Glass design tokens
  glassFill: string;
  glassFillStrong: string;
  glassStroke: string;
  glowPrimary: string;
  primaryGradientFrom: string;
  primaryGradientTo: string;
  secondaryAccent: string;
  blobA: string;
  blobB: string;
  blobC: string;
}

export const lightTheme: ThemeColors = {
  background: '#F2EDE4',
  surface: '#FBF8F2',
  text: '#1C1917',
  textSecondary: '#6B6560',
  border: 'rgba(28,25,23,0.14)',
  primary: '#D97706',
  primarySurface: 'rgba(217,119,6,0.14)',
  secondary: '#78716C',
  success: '#059669',
  danger: '#DC2626',
  warning: '#F59E0B',
  disabled: '#D6D3D1',
  overlay: 'rgba(41,37,36,0.45)',
  glassFill: 'rgba(255,255,255,0.82)',
  glassFillStrong: 'rgba(255,255,255,0.95)',
  glassStroke: 'rgba(146,94,28,0.30)',
  glowPrimary: 'rgba(245,158,11,0.35)',
  primaryGradientFrom: '#F59E0B',
  primaryGradientTo: '#EA580C',
  secondaryAccent: '#0D9488',
  blobA: 'rgba(245,158,11,0.45)',
  blobB: 'rgba(13,148,136,0.30)',
  blobC: 'rgba(244,114,182,0.22)',
};

export const darkTheme: ThemeColors = {
  background: '#07070B',
  surface: '#12121C',
  text: '#F4F4F6',
  textSecondary: '#9CA0AF',
  border: 'rgba(255,255,255,0.10)',
  primary: '#8B5CF6',
  primarySurface: 'rgba(139,92,246,0.16)',
  secondary: '#9CA0AF',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  disabled: '#3F3F50',
  overlay: 'rgba(4,4,8,0.68)',
  glassFill: 'rgba(24,24,38,0.66)',
  glassFillStrong: 'rgba(22,22,36,0.95)',
  glassStroke: 'rgba(255,255,255,0.22)',
  glowPrimary: 'rgba(139,92,246,0.45)',
  primaryGradientFrom: '#A78BFA',
  primaryGradientTo: '#6366F1',
  secondaryAccent: '#22D3EE',
  blobA: 'rgba(124,58,237,0.30)',
  blobB: 'rgba(34,211,238,0.16)',
  blobC: 'rgba(99,102,241,0.22)',
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
