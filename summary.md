## Goal
Build a complete offline-first Mobile Inventory Management & POS system using React Native, Expo SDK 54, TypeScript, SQLite, Zustand, and Expo Router.

## Constraints & Preferences
- Strict TypeScript everywhere (zero compile errors required).
- Modular architecture: separate database logic, UI components, Zustand stores.
- Offline-first: all data in local SQLite via `expo-sqlite`.
- RBAC: Admin (full access) / User (POS + inventory view only).
- Editable brand logo on Login and Dashboard (Settings screen).
- Excel import/export (xlsx) for inventory.
- POS must support receipt screen, payment selection, hold transaction (inside cart as tab), quantity numpad, category filter, top sellers weekly, list/grid toggle with product images, and discount modal (percentage/fixed).
- Light/dark mode toggle in Settings (system default on first boot). Dark mode colors customized: background `#141414`, primary `#808080`.
- Editable currency symbol (₱, $, €, £, ¥) in Settings.
- Loyalty card screen with uploadable QR code and card image placeholders.
- Finance module (admin-only) tracking income (POS sales + manual entries) and expenses.
- All screens and components consume dynamic theme colors from `useThemeStore` (no hardcoded COLORS in inline styles).

## Progress
### Done
- Scaffolded Expo project with TypeScript and installed all dependencies.
- 60+ source files across `app/`, `src/components/`, `src/database/`, `src/store/`, `src/types/`, `src/services/`, `src/utils/`.
- Database layer: 7 tables (`users`, `products`, `coupons`, `sales`, `sale_items`, `app_settings`, `transactions`) + migrations + seed data.
- Query modules for users, products, coupons, sales, holds, transactions (CRUD).
- Zustand stores: `authStore`, `productStore`, `cartStore`, `couponStore`, `userStore`, `themeStore`, `settingsStore`, `transactionStore`.
- UI components: Button, Input, Card, Modal, Logo, ProductCard, ProductForm (with image picker), SearchBar, CartItem, CartSummary, BarcodeScanner, FinanceSummary, TransactionCard.
- All 20 screens: Login, Dashboard, POS (full), Sales History, Inventory (list/new/edit), Coupons (list/new), Users (list/new), Settings, Loyalty Card, Finance (list/new).
- POS features: ReceiptScreen, PaymentMethodModal (keyboard-safe via ScrollView), QuantityInputModal, Top Sellers Weekly (7-day), category filter, list/grid toggle (below search bar), discount modal (percentage/fixed), hold tab inside cart view (HoldModal deleted).
- Excel export/import service using `expo-file-system` + `xlsx`.
- Delete with FK constraint: Alert with "Overwrite & Delete" option that removes `sale_items` first (`forceDeleteProduct`).
- Dashboard: Coupons removed from menu, QR preview + loyalty card removed (menu item kept).
- Dark mode colors: background `#141414`, surface `#1E1E1E`, primary `#808080`.
- Finance module: `transactions` table, `transactionStore`, Finance screen with Income/Expense tabs + summary bar, FAB for new transaction.
- All screens and components converted to use dynamic `colors` from `useThemeStore` (24+ files updated).
- TypeScript compiles with zero errors.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Chose Expo Router over React Navigation for file-based routing.
- Chose Zustand over React Context for simpler store patterns.
- Used `js-sha256` instead of Web Crypto API (unavailable in React Native).
- Payment methods typed as `'cash' | 'card' | 'gcash' | 'maya' | 'bank_transfer'`.
- View modes typed as `'list' | 'grid'`, toggled via keyed FlatLists to avoid `numColumns` mutation errors.
- Removed `SQLiteProvider` from `_layout.tsx` — all DB access uses `getDatabase()`.
- `formatCurrency` uses mutable global symbol set by `settingsStore` instead of passing symbol to all callers.
- Hold functionality moved inline into cart view as a "Cart"/"Held" tab; `HoldModal.tsx` deleted.
- Finance uses a single `transactions` table with `type` column (`'income' | 'expense'`). POS sales income computed from `sales` table directly.
- Top Sellers Weekly queries `sale_items` + `sales` for past 7 days (replaces `getRecentProductIds`).
- PaymentMethodModal content wrapped in `ScrollView` to prevent keyboard overflow.
- Discount modal is rendered inline in POS screen, not as separate component.
- Logo uses `require('../../assets/placeholder.png')` directly (no `IMAGE_PLACEHOLDER` constant).

## Next Steps
1. (none — all planned features are implemented)

## Critical Context
- Error "Cannot update a component during rendering" was caused by `router.replace()` in render body → fixed with `useEffect`.
- Error "Property 'crypto' doesn't exist" was Web Crypto → replaced with `js-sha256`.
- Error "Changing numColumns on the fly" was switching `viewMode` without unique FlatList `key` → fixed.
- Error "NativeDatabase.execAsync NullPointerException" was dual `SQLiteProvider` instances → fixed by removing `SQLiteProvider`.
- Inventory delete: FK constraint on `sale_items.product_id` → UI now shows Alert with "Overwrite & Delete" option.
- Default login: admin/admin123 (Admin), user/user123 (User).
- Product type has `item_id`, `description`, `image_uri`, `barcode` fields but NOT `cost`.
- Run with `npm start` from `mobile-pos/`.

## Relevant Files
- `src/store/themeStore.ts`: Hardcoded light/dark palettes + `overlay` color. Dark colors: background `#141414`, surface `#1E1E1E`, primary `#808080`, overlay `rgba(0,0,0,0.7)`.
- `src/store/settingsStore.ts`: Currency symbol/code, loadSettings, setCurrency. No `settings` or `brand_logo` properties.
- `src/store/cartStore.ts`: `manualDiscount` replaces coupon, `holdCart`/`restoreCart` store `manualDiscount` in JSON.
- `src/store/transactionStore.ts`: Zustand store for finance transactions (income/expense).
- `src/types/database.ts`: `Transaction`, `TransactionInput` types. Product type with `image_uri: string | null`.
- `src/types/store.ts`: `CartState` with `manualDiscount`, `TransactionState`.
- `src/database/schema.ts`: Products table without `cost` column. `transactions` table with FK to `users(id)`.
- `src/database/transactions.ts`: CRUD for transactions.
- `src/database/sales.ts`: Added `getTopSellersWeekly()` (7-day query).
- `src/components/pos/ReceiptScreen.tsx`: Accepts flat props (`receiptNumber`, `items`, `subtotal`, etc.), not `SaleWithItems`.
- `src/components/pos/CartSummary.tsx`: Accepts `subtotal`, `discount`, `total`, `itemCount`, `discountLabel`.
- `src/components/pos/RecentItems.tsx`: Queries weekly top sellers, label "★ Top Sellers Weekly".
- `src/components/pos/PaymentMethodModal.tsx`: Content wrapped in `ScrollView` for keyboard safety.
- `src/components/finance/FinanceSummary.tsx`: Accepts `incomeTotal`, `expenseTotal`, `netTotal` props.
- `src/components/ui/Button.tsx`: Supports `'primary' | 'secondary' | 'danger' | 'outline'` variants.
- `src/components/ui/Input.tsx`: Supports `label` prop.
- `src/components/ui/Logo.tsx`: Accepts `size: number | string`, maps string sizes via `SIZE_MAP`.
- `src/components/ui/Modal.tsx`: Uses `colors.overlay` for backdrop.
- `app/(app)/index.tsx`: Dashboard with Finance in menu (admin-only).
- `app/(app)/pos/index.tsx`: View toggle below search bar, category chips centered, hold tab inside cart, discount modal inline.
- `app/(app)/inventory/new.tsx`: ProductForm with `onSubmit` + `onCancel`.
- `app/(app)/inventory/[id].tsx`: ProductForm with `initial={product}` (not `initialValues`).
- `app/(app)/loyalty.tsx`: Header padding reduced, content raised, QR placeholder above card.
- `app/(app)/settings.tsx`: Currency picker (₱, $, €, £, ¥), dark mode switch, export/import.
- `app/(app)/finance/index.tsx`: Income/Expenses tabs, summary bar, transaction list, FAB.
- `app/(app)/finance/new.tsx`: Form with type toggle, description, amount, category, date.
