export interface User {
  id: number;
  username: string;
  pin_hash: string;
  role: 'admin' | 'user';
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  item_id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  stock_unit: string;
  measurement: string | null;
  is_ingredient: number;
  initial_stock: number;
  barcode: string | null;
  description: string | null;
  image_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  is_active: number;
  expiry_date: string | null;
  created_at: string;
}

export interface Sale {
  id: number;
  receipt_number: string;
  user_id: number;
  coupon_id: number | null;
  subtotal: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  sale_date: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface HoldTransaction {
  id: number;
  label: string;
  items_json: string;
  coupon_id: number | null;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  item_count: number;
  user_id: number;
  created_at: string;
}

export interface PriceHistory {
  id: number;
  product_id: number;
  old_price: number;
  new_price: number;
  changed_at: string;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  entry_date: string;
  created_by: number;
  created_at: string;
}

export interface RecipeItem {
  id: number;
  product_id: number;
  ingredient_id: number;
  quantity: number;
  measurement: string | null;
}

export interface RecipeItemWithName extends RecipeItem {
  ingredient_name: string | null;
  ingredient_category: string | null;
}

export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'maya';
export type ViewMode = 'list' | 'grid';

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type CouponInput = Omit<Coupon, 'id' | 'created_at' | 'current_uses'>;
export type SaleInput = Omit<Sale, 'id' | 'sale_date'>;
export type SaleItemInput = Omit<SaleItem, 'id'>;
export type CartSaleItem = Omit<SaleItemInput, 'sale_id'>;
export type TransactionInput = Omit<Transaction, 'id' | 'created_at'>;
