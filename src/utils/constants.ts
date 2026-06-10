export const DATABASE_NAME = 'mobile_pos.db';
export const APP_NAME = 'BeanOS';

export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  disabled: '#CBD5E1',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const ROLES = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
};

export const CATEGORY_COLORS: Record<string, string> = {
  Coffee: '#6F4E37',
  Tea: '#4CAF50',
  Frappe: '#FF9800',
  Drink: '#2196F3',
  Pastry: '#FFC107',
  'Rice Meal': '#FF5722',
  Pasta: '#9C27B0',
  Snacks: '#FF6F00',
  'Add-on': '#607D8B',
  Merchandise: '#E91E63',
  General: '#2563EB',
};

export const COLOR_PRESETS = [
  '#2563EB', '#6F4E37', '#4CAF50', '#FF9800', '#2196F3',
  '#FFC107', '#FF5722', '#9C27B0', '#FF6F00', '#607D8B',
  '#E91E63', '#F44336', '#00BCD4', '#795548', '#333333',
];

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
}

export function getProductIconColor(icon_color: string | null | undefined, category: string): string {
  return icon_color || getCategoryColor(category);
}
