import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useProductStore } from '../../../src/store/productStore';
import { useCartStore } from '../../../src/store/cartStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { getDatabase } from '../../../src/database/connection';
import * as salesRepo from '../../../src/database/sales';
import { generateReceiptNumber, formatCurrency, formatDate } from '../../../src/utils/helpers';
import ProductCard from '../../../src/components/inventory/ProductCard';
import ProductTile from '../../../src/components/pos/ProductTile';
import CartItemComponent from '../../../src/components/pos/CartItem';
import CartSummary from '../../../src/components/pos/CartSummary';
import SearchBar from '../../../src/components/inventory/SearchBar';
import RecentItems from '../../../src/components/pos/RecentItems';
import QuantityInputModal from '../../../src/components/pos/QuantityInputModal';
import PaymentMethodModal from '../../../src/components/pos/PaymentMethodModal';
import ReceiptScreen from '../../../src/components/pos/ReceiptScreen';
import type { ViewMode, PaymentMethod, HoldTransaction } from '../../../src/types/database';
import type { CartItem } from '../../../src/types/store';

export default function POSScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { products, fetchProducts, searchQuery, setSearchQuery, getFilteredProducts, getCategories, selectedCategory, setSelectedCategory } = useProductStore();
  const { items, manualDiscount, addItem, removeItem, updateQuantity, clearCart, setManualDiscount, clearManualDiscount, getSubtotal, getDiscount, getTotal, getItemCount, paymentMethod, setPaymentMethod, holdCart, getHeldTransactions, restoreCart, deleteHeldTransaction } = useCartStore();
  const { user } = useAuthStore();

  const [showCart, setShowCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountInput, setDiscountInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [cartTab, setCartTab] = useState<'cart' | 'held'>('cart');
  const [holds, setHolds] = useState<HoldTransaction[]>([]);
  const [holdsLoading, setHoldsLoading] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const numColumns = isLandscape ? 4 : 2;
  const tileWidth = (screenWidth - SPACING.md * 2 - SPACING.sm * (numColumns - 1)) / numColumns;

  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
  } | null>(null);

  const [quantityTarget, setQuantityTarget] = useState<{ productId: number; current: number; max: number } | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    fetchProducts();
    loadTodayTotal();
  }, []);

  const refreshHolds = async () => {
    setHoldsLoading(true);
    try {
      const result = await getHeldTransactions();
      setHolds(result);
    } catch {} finally {
      setHoldsLoading(false);
    }
  };

  const loadTodayTotal = async () => {
    try {
      const db = await getDatabase();
      const sales = await salesRepo.getTodaySales(db);
      const total = sales.reduce((sum, s) => sum + s.total, 0);
      setTodayTotal(total);
    } catch {}
  };

  const handleHoldSave = async () => {
    await holdCart(holdLabel.trim() || 'Held Cart');
    setHoldLabel('');
    setCartTab('held');
    refreshHolds();
  };

  const handleHoldRestore = (hold: HoldTransaction) => {
    Alert.alert('Restore Cart', `Restore "${hold.label}"?\nCurrent cart will be replaced.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: () => {
          restoreCart(hold);
          deleteHeldTransaction(hold.id);
          setCartTab('cart');
        },
      },
    ]);
  };

  const handleHoldDelete = (hold: HoldTransaction) => {
    Alert.alert('Delete', `Delete "${hold.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHeldTransaction(hold.id).then(refreshHolds) },
    ]);
  };

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();
  const itemCount = getItemCount();

  const handleCheckout = async (method: PaymentMethod, amountTendered: number) => {
    if (items.length === 0) return;
    setProcessing(true);
    try {
      const db = await getDatabase();
      const receiptNumber = generateReceiptNumber();

      await salesRepo.createSale(
        db,
        {
          receipt_number: receiptNumber,
          user_id: user!.id,
          coupon_id: null,
          subtotal,
          discount_amount: discount,
          total,
          payment_method: method,
        },
        items.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
          total_price: i.product.price * i.quantity,
        }))
      );

      const change = method === 'cash' ? Math.max(0, amountTendered - total) : 0;

      setReceiptData({
        receiptNumber,
        items: [...items],
        subtotal,
        discount,
        total,
        paymentMethod: method,
        amountTendered: method === 'cash' ? amountTendered : total,
        change,
      });

      setShowPaymentModal(false);
      clearCart();
      fetchProducts();
    } catch (err) {
      Alert.alert('Error', 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleQuantityTap = (productId: number, current: number, max: number) => {
    setQuantityTarget({ productId, current, max });
    setShowQuantityModal(true);
  };

  const handleQuantityApply = (qty: number) => {
    if (quantityTarget) {
      updateQuantity(quantityTarget.productId, qty);
    }
  };

  const handleNewSale = () => {
    setReceiptData(null);
  };

  const handleAddToCart = (product: any) => {
    addItem(product);
    setShowCart(true);
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid', 'Enter a valid discount value');
      return;
    }
    if (discountType === 'percentage' && value > 100) {
      Alert.alert('Invalid', 'Percentage cannot exceed 100%');
      return;
    }
    setManualDiscount(discountType, value);
    setShowDiscountModal(false);
    setDiscountInput('');
  };

  if (receiptData) {
    return (
      <ReceiptScreen
        receiptNumber={receiptData.receiptNumber}
        items={receiptData.items}
        subtotal={receiptData.subtotal}
        discount={receiptData.discount}
        total={receiptData.total}
        paymentMethod={receiptData.paymentMethod}
        amountTendered={receiptData.amountTendered}
        change={receiptData.change}
        cashierName={user?.display_name || user?.username || ''}
        onNewSale={handleNewSale}
      />
    );
  }

  if (showCart) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.cartHeader}>
          <TouchableOpacity onPress={() => setShowCart(false)}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← Products</Text>
          </TouchableOpacity>
          <Text style={[styles.cartTitle, { color: colors.text }]}>Cart ({itemCount})</Text>
          {cartTab === 'cart' && (
            <TouchableOpacity onPress={() => { clearCart(); }}>
              <Text style={[styles.clearBtn, { color: colors.danger }]}>Clear</Text>
            </TouchableOpacity>
          )}
          {cartTab === 'held' && (
            <TouchableOpacity onPress={() => { setCartTab('cart'); }}>
              <Text style={[styles.clearBtn, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, cartTab === 'cart' && { backgroundColor: colors.primary }]}
            onPress={() => setCartTab('cart')}
          >
            <Text style={[styles.tabText, { color: cartTab === 'cart' ? '#fff' : colors.text }]}>
              Cart ({itemCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, cartTab === 'held' && { backgroundColor: colors.primary }]}
            onPress={() => { refreshHolds(); setCartTab('held'); }}
          >
            <Text style={[styles.tabText, { color: cartTab === 'held' ? '#fff' : colors.text }]}>
              Held ({holds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {cartTab === 'cart' ? (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.product.id)}
              renderItem={({ item }) => (
                <CartItemComponent
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.product.id, qty)}
                  onRemove={() => removeItem(item.product.id)}
                  onQuantityPress={() => handleQuantityTap(item.product.id, item.quantity, item.product.stock_quantity)}
                />
              )}
              contentContainerStyle={styles.cartList}
              ListEmptyComponent={
                <View style={styles.emptyCart}>
                  <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>Cart is empty</Text>
                </View>
              }
            />

            {items.length > 0 && (
              <View style={[styles.checkoutSection, { borderTopColor: colors.border }]}>
                <View style={styles.discountRow}>
                  <TouchableOpacity
                    style={[styles.discountBtn, { borderColor: colors.primary }]}
                    onPress={() => { setDiscountType('percentage'); setDiscountInput(''); setShowDiscountModal(true); }}
                  >
                    <Text style={[styles.discountBtnText, { color: colors.primary }]}>Discount</Text>
                  </TouchableOpacity>
                  {manualDiscount && (
                    <TouchableOpacity onPress={clearManualDiscount}>
                      <Text style={[styles.removeDiscount, { color: colors.danger }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {manualDiscount && (
                  <Text style={[styles.appliedDiscount, { color: colors.success }]}>
                    Discount: {manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : formatCurrency(manualDiscount.value)}
                  </Text>
                )}
                <CartSummary
                  subtotal={subtotal}
                  discount={discount}
                  total={total}
                  itemCount={itemCount}
                  discountLabel={manualDiscount ? (manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : formatCurrency(manualDiscount.value)) : null}
                />
                <TouchableOpacity
                  style={[styles.payBtn, { backgroundColor: colors.primary, marginTop: SPACING.sm }]}
                  onPress={() => setShowPaymentModal(true)}
                >
                  <Text style={styles.payBtnText}>Pay {formatCurrency(total)}</Text>
                </TouchableOpacity>
              </View>
            )}

            <QuantityInputModal
              visible={showQuantityModal}
              currentQuantity={quantityTarget?.current ?? 1}
              maxQuantity={quantityTarget?.max ?? 999}
              onApply={handleQuantityApply}
              onClose={() => setShowQuantityModal(false)}
            />

            <PaymentMethodModal
              visible={showPaymentModal}
              total={total}
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              onConfirm={handleCheckout}
              onClose={() => setShowPaymentModal(false)}
            />

            {showDiscountModal && (
              <View style={styles.discountOverlay}>
                <View style={[styles.discountModal, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.discountTitle, { color: colors.text }]}>Apply Discount</Text>

                  <View style={styles.typeToggle}>
                    <TouchableOpacity
                      style={[styles.typeBtn, discountType === 'percentage' && { backgroundColor: colors.primary }]}
                      onPress={() => setDiscountType('percentage')}
                    >
                      <Text style={[styles.typeBtnText, { color: discountType === 'percentage' ? '#fff' : colors.text }]}>%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeBtn, discountType === 'fixed' && { backgroundColor: colors.primary }]}
                      onPress={() => setDiscountType('fixed')}
                    >
                      <Text style={[styles.typeBtnText, { color: discountType === 'fixed' ? '#fff' : colors.text }]}>₱</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.discountInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    keyboardType="decimal-pad"
                    placeholder={discountType === 'percentage' ? 'Enter percentage (1-100)' : 'Enter amount'}
                    placeholderTextColor={colors.textSecondary}
                    value={discountInput}
                    onChangeText={setDiscountInput}
                  />

                  <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={handleApplyDiscount}>
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowDiscountModal(false)}>
                    <Text style={[styles.closeDiscount, { color: colors.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.heldContainer}>
            {items.length > 0 && (
              <View style={[styles.holdSaveSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.holdSaveLabel, { color: colors.textSecondary }]}>Hold current cart</Text>
                <TextInput
                  style={[styles.holdInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={holdLabel}
                  onChangeText={setHoldLabel}
                  placeholder="e.g. Customer Walk-in #1"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.holdSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleHoldSave}
                >
                  <Text style={styles.holdSaveBtnText}>Save & Hold</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={holds}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={[styles.heldCard, { borderBottomColor: colors.border }]}>
                  <View style={styles.heldInfo}>
                    <Text style={[styles.heldLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.heldMeta, { color: colors.textSecondary }]}>
                      {item.item_count} items • {formatCurrency(item.total)}
                    </Text>
                    <Text style={[styles.heldDate, { color: colors.disabled }]}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={styles.heldActions}>
                    <TouchableOpacity
                      style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleHoldRestore(item)}
                    >
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleHoldDelete(item)}>
                      <Text style={[styles.heldDelete, { color: colors.danger }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.heldList}
              refreshing={holdsLoading}
              onRefresh={refreshHolds}
              ListEmptyComponent={
                <View style={styles.emptyCart}>
                  <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>No held transactions</Text>
                </View>
              }
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.posHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.posTitle, { color: colors.text }]}>POS Terminal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowCart(true)}
            style={[styles.cartBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.cartBtnText}>🛒 {itemCount > 0 ? `(${itemCount})` : ''}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search products to add..." />

      {categories.length > 0 && (
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }, !selectedCategory && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, { color: colors.textSecondary }, !selectedCategory && { color: '#fff' }]}>All</Text>
          </TouchableOpacity>
          {categories.slice(0, 8).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }, selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.categoryText, { color: colors.textSecondary }, selectedCategory === cat && { color: '#fff' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} style={styles.viewToggleRow}>
            <Text style={[styles.viewToggleRowText, { color: colors.text }]}>
              {viewMode === 'list' ? '▦ Grid' : '☰ List'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.todayRow}>
        <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Today's Sales</Text>
        <Text style={[styles.todayValue, { color: colors.success }]}>{formatCurrency(todayTotal)}</Text>
      </View>

      <RecentItems onAddToCart={addItem} />

      {viewMode === 'list' ? (
        <FlatList
          key="list"
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={item.stock_quantity > 0 ? () => addItem(item) : undefined}
            />
          )}
          contentContainerStyle={styles.productList}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          numColumns={numColumns}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <ProductTile
              product={item}
              tileWidth={tileWidth}
              onAddToCart={() => {
                addItem(item);
              }}
            />
          )}
          contentContainerStyle={styles.productList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
            </View>
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  posHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  posTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  todayLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  todayValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  backBtn: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  viewToggleRow: {
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginLeft: 'auto',
  },
  viewToggleRowText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  cartBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  cartBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  productList: {
    paddingBottom: 20,
  },
  gridRow: {
    gap: SPACING.sm,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  clearBtn: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
  },
  emptyCart: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: FONT_SIZES.md,
  },
  checkoutSection: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  discountBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  discountBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  removeDiscount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  appliedDiscount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  payBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  heldContainer: {
    flex: 1,
  },
  holdSaveSection: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    marginBottom: SPACING.sm,
  },
  holdSaveLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  holdInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
  },
  holdSaveBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdSaveBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  heldList: {
    paddingBottom: 20,
  },
  heldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  heldInfo: {
    flex: 1,
  },
  heldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  heldMeta: {
    fontSize: FONT_SIZES.xs,
  },
  heldDate: {
    fontSize: 10,
  },
  heldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resumeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 6,
  },
  resumeBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  heldDelete: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    padding: SPACING.xs,
  },
  discountOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  discountModal: {
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  discountTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    width: 60,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  typeBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  discountInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  applyBtn: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  closeDiscount: {
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
});
