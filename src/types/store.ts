import type { Product, Coupon, User, PaymentMethod, HoldTransaction, Transaction } from './database';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DiscountInput {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CartState {
  items: CartItem[];
  manualDiscount: DiscountInput | null;
  isLoading: boolean;
  paymentMethod: PaymentMethod;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setManualDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  clearManualDiscount: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  holdCart: (label: string) => Promise<void>;
  restoreCart: (hold: HoldTransaction) => void;
  getHeldTransactions: () => Promise<HoldTransaction[]>;
  deleteHeldTransaction: (id: number) => Promise<void>;
  getRecentProductIds: (limit?: number) => Promise<number[]>;
}

export interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: import('../types/database').ProductInput) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  forceDeleteProduct: (id: number) => Promise<number>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  getFilteredProducts: () => Product[];
  getCategories: () => string[];
}

export interface CouponState {
  coupons: Coupon[];
  isLoading: boolean;
  error: string | null;
  fetchCoupons: () => Promise<void>;
  addCoupon: (coupon: import('../types/database').CouponInput) => Promise<void>;
  deleteCoupon: (id: number) => Promise<void>;
  validateCoupon: (code: string) => Promise<Coupon | null>;
}

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (input: import('../types/database').TransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  getIncomeTotal: () => number;
  getExpenseTotal: () => number;
  getNetTotal: () => number;
}

export interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (user: import('../types/database').UserInput) => Promise<void>;
  updateUser: (id: number, user: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}
