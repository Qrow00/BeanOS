import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, useWindowDimensions } from 'react-native';
import { SPACING, FONT_SIZES, RADII, GLASS, getCategoryColor } from '../../../src/utils/constants';
import { useProductStore } from '../../../src/store/productStore';
import { useCartStore } from '../../../src/store/cartStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
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
import ConfirmModal from '../../../src/components/ui/ConfirmModal';
import CoffeeConfetti from '../../../src/components/pos/CoffeeConfetti';
import LoyaltyScanModal from '../../../src/components/pos/LoyaltyScanModal';
import RedeemPointsModal from '../../../src/components/pos/RedeemPointsModal';
import GlassPanel from '../../../src/components/ui/glass/GlassPanel';
import GlassChip from '../../../src/components/ui/glass/GlassChip';
import GradientButton from '../../../src/components/ui/glass/GradientButton';
import { useBreakpoint } from '../../../src/hooks/useBreakpoint';
import type { ViewMode, PaymentMethod, HoldTransaction, Product } from '../../../src/types/database';
import type { CartItem } from '../../../src/types/store';

export default function POSScreen() {
  const colors = useThemeStore(s => s.colors);
  const products = useProductStore(s => s.products);
  const fetchProducts = useProductStore(s => s.fetchProducts);
  const searchQuery = useProductStore(s => s.searchQuery);
  const setSearchQuery = useProductStore(s => s.setSearchQuery);
  const selectedCategory = useProductStore(s => s.selectedCategory);
  const setSelectedCategory = useProductStore(s => s.setSelectedCategory);

  const items = useCartStore(s => s.items);
  const manualDiscount = useCartStore(s => s.manualDiscount);
  const addItem = useCartStore(s => s.addItem);
  const removeItem = useCartStore(s => s.removeItem);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const clearCart = useCartStore(s => s.clearCart);
  const setManualDiscount = useCartStore(s => s.setManualDiscount);
  const clearManualDiscount = useCartStore(s => s.clearManualDiscount);
  const paymentMethod = useCartStore(s => s.paymentMethod);
  const setPaymentMethod = useCartStore(s => s.setPaymentMethod);
  const holdCart = useCartStore(s => s.holdCart);
  const getHeldTransactions = useCartStore(s => s.getHeldTransactions);
  const restoreCart = useCartStore(s => s.restoreCart);
  const deleteHeldTransaction = useCartStore(s => s.deleteHeldTransaction);
  const loyaltyCustomer = useCartStore(s => s.loyaltyCustomer);
  const pointsToRedeem = useCartStore(s => s.pointsToRedeem);
  const setLoyaltyCustomer = useCartStore(s => s.setLoyaltyCustomer);
  const clearLoyaltyCustomer = useCartStore(s => s.clearLoyaltyCustomer);
  const setPointsToRedeem = useCartStore(s => s.setPointsToRedeem);
  const loyaltyEarnRate = useSettingsStore(s => s.loyaltyEarnRate);
  const loyaltyPointValue = useSettingsStore(s => s.loyaltyPointValue);
  const { user } = useAuthStore();

  const [showCart, setShowCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountInput, setDiscountInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [cartTab, setCartTab] = useState<'cart' | 'held'>('cart');
  const [holds, setHolds] = useState<HoldTransaction[]>([]);
  const [holdsLoading, setHoldsLoading] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'category'>('category');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const bp = useBreakpoint();
  const { width: screenWidth } = useWindowDimensions();
  const cartPaneWidth = Math.min(430, Math.max(330, Math.round(screenWidth * 0.38)));
  const productsAreaWidth = bp.posSplitView ? screenWidth - cartPaneWidth - SPACING.md * 4 : screenWidth;
  const numColumns = productsAreaWidth >= 700 ? 5 : productsAreaWidth >= 500 ? 4 : 3;
  const tileWidth = (productsAreaWidth - SPACING.md * 2 - SPACING.sm * (numColumns - 1)) / numColumns;

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.item_id.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'category') list.sort((a, b) => {
      if (a.category === b.category) return a.name.localeCompare(b.name);
      if (a.category === 'Pastry') return 1;
      if (b.category === 'Pastry') return -1;
      return a.category.localeCompare(b.category);
    });
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filteredProducts, sortBy]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const subtotal = useCartStore(s => s.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0));
  const discount = useCartStore(s => {
    if (!s.manualDiscount) return 0;
    const sub = s.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    if (s.manualDiscount.type === 'percentage') return sub * (s.manualDiscount.value / 100);
    return Math.min(s.manualDiscount.value, sub);
  });
  const total = useCartStore(s => {
    const sub = s.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    if (!s.manualDiscount) return sub;
    const disc = s.manualDiscount.type === 'percentage' ? sub * (s.manualDiscount.value / 100) : Math.min(s.manualDiscount.value, sub);
    return sub - disc;
  });
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const maxRedeemablePoints = loyaltyPointValue > 0
    ? Math.min(Math.floor(total / loyaltyPointValue), loyaltyCustomer?.points_balance ?? 0)
    : 0;
  const effectiveRedeemPoints = Math.min(pointsToRedeem, maxRedeemablePoints);
  const pointsDiscount = effectiveRedeemPoints * loyaltyPointValue;
  const finalTotal = Math.max(0, total - pointsDiscount);

  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
    customerName: string | null;
    pointsEarned: number;
    pointsRedeemed: number;
    remainingBalance: number;
  } | null>(null);

  const [quantityTarget, setQuantityTarget] = useState<{ productId: number; current: number; max: number } | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [pendingRestoreHold, setPendingRestoreHold] = useState<HoldTransaction | null>(null);
  const [pendingDeleteHold, setPendingDeleteHold] = useState<HoldTransaction | null>(null);

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
    setPendingRestoreHold(hold);
  };

  const handleHoldDelete = (hold: HoldTransaction) => {
    setPendingDeleteHold(hold);
  };

  const confirmRestore = () => {
    const hold = pendingRestoreHold;
    if (!hold) return;
    restoreCart(hold);
    deleteHeldTransaction(hold.id);
    setCartTab('cart');
    setPendingRestoreHold(null);
  };

  const confirmDelete = async () => {
    const hold = pendingDeleteHold;
    if (!hold) return;
    await deleteHeldTransaction(hold.id);
    refreshHolds();
    setPendingDeleteHold(null);
  };

  const handleCheckout = async (method: PaymentMethod, amountTendered: number) => {
    if (items.length === 0) return;
    setProcessing(true);
    try {
      const db = await getDatabase();
      const receiptNumber = generateReceiptNumber();

      const pointsEarned = loyaltyCustomer && finalTotal > 0 && loyaltyEarnRate > 0
        ? Math.floor(finalTotal / loyaltyEarnRate)
        : 0;
      const loyalty = loyaltyCustomer
        ? { customerId: loyaltyCustomer.id, pointsEarned, pointsRedeemed: effectiveRedeemPoints }
        : undefined;
      const remainingBalance = loyaltyCustomer
        ? Math.max(0, loyaltyCustomer.points_balance - effectiveRedeemPoints + pointsEarned)
        : 0;

      await salesRepo.createSale(
        db,
        {
          receipt_number: receiptNumber,
          user_id: user!.id,
          coupon_id: null,
          customer_id: loyaltyCustomer?.id ?? null,
          subtotal,
          discount_amount: discount,
          total: finalTotal,
          payment_method: method,
          points_earned: pointsEarned,
          points_redeemed: effectiveRedeemPoints,
        },
        items.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
          total_price: i.product.price * i.quantity,
        })),
        loyalty
      );

      const change = method === 'cash' ? Math.max(0, amountTendered - finalTotal) : 0;

      setReceiptData({
        receiptNumber,
        items: [...items],
        subtotal,
        discount,
        total: finalTotal,
        paymentMethod: method,
        amountTendered: method === 'cash' ? amountTendered : finalTotal,
        change,
        customerName: loyaltyCustomer?.name ?? null,
        pointsEarned,
        pointsRedeemed: effectiveRedeemPoints,
        remainingBalance,
      });

      setShowPaymentModal(false);
      clearCart();
      fetchProducts();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
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
    setShowConfetti(false);
  };

  const addToCartIfValid = useCallback((product: any, openCart?: boolean) => {
    addItem(product);
    if (openCart) setShowCart(true);
  }, [addItem, setShowCart]);

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

  const keyExtractor = useCallback((item: Product) => String(item.id), []);

  const renderListHeader = useCallback((includeTodayRow: boolean) => (
    <View>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search products to add..." />

      {categories.length > 0 && (
        <View style={styles.categoryRow}>
          <GlassChip label="All" active={!selectedCategory} onPress={() => setSelectedCategory(null)} />
          {categories.slice(0, bp.posSplitView ? 12 : 8).map(cat => (
            <GlassChip
              key={cat}
              label={cat}
              color={getCategoryColor(cat)}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            />
          ))}
        </View>
      )}

      {includeTodayRow && (
        <View style={styles.todayRow}>
          <View style={[styles.todayPill, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
            <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>TODAY</Text>
            <Text style={[styles.todayValue, { color: colors.success }]}>{formatCurrency(todayTotal)}</Text>
          </View>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} style={[styles.pillBtn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
              <Text style={[styles.pillBtnText, { color: colors.text }]}>
                {viewMode === 'list' ? '▦ Grid' : '☰ List'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSortModal(true)} style={[styles.pillBtn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
              <Text style={[styles.pillBtnText, { color: colors.text }]}>⇅ Sort</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <RecentItems onAddToCart={addToCartIfValid} />
    </View>
  ), [searchQuery, setSearchQuery, categories, colors, selectedCategory, setSelectedCategory, bp.posSplitView, todayTotal, viewMode, addToCartIfValid]);

  const listHeader = useMemo(() => renderListHeader(!bp.posSplitView), [renderListHeader, bp.posSplitView]);

  const renderListItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={item.stock_quantity > 0 ? () => addToCartIfValid(item) : undefined}
    />
  ), [addToCartIfValid]);

  const renderGridItem = useCallback(({ item }: { item: Product }) => (
    <ProductTile
      product={item}
      tileWidth={tileWidth}
      onAddToCart={() => addToCartIfValid(item)}
    />
  ), [addToCartIfValid, tileWidth]);

  const renderProductList = () =>
    viewMode === 'list' ? (
      <FlatList
        key="list"
        data={sortedProducts}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        renderItem={renderListItem}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
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
        data={sortedProducts}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={listHeader}
        renderItem={renderGridItem}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No products found' : 'No products available'}
            </Text>
          </View>
        }
      />
    );

  const renderCartContent = (inPane: boolean) => (
    <View style={inPane ? styles.paneInner : styles.cartScreenInner}>
      <View style={[styles.segWrap, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
        <TouchableOpacity
          style={[styles.segBtn, cartTab === 'cart' && { backgroundColor: colors.primarySurface }, cartTab === 'cart' && styles.segBtnActive]}
          onPress={() => setCartTab('cart')}
        >
          <Text style={[styles.segText, { color: cartTab === 'cart' ? colors.primary : colors.textSecondary }]}>
            Cart ({itemCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segBtn, cartTab === 'held' && { backgroundColor: colors.primarySurface }, cartTab === 'held' && styles.segBtnActive]}
          onPress={() => { refreshHolds(); setCartTab('held'); }}
        >
          <Text style={[styles.segText, { color: cartTab === 'held' ? colors.primary : colors.textSecondary }]}>
            Held ({holds.length})
          </Text>
        </TouchableOpacity>
      </View>

      {cartTab === 'cart' ? (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.product.id)}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <CartItemComponent
                item={item}
                onUpdateQuantity={(qty) => updateQuantity(item.product.id, qty)}
                onRemove={() => removeItem(item.product.id)}
                onQuantityPress={() => handleQuantityTap(item.product.id, item.quantity, item.product.stock_quantity)}
              />
            )}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyCart}>
                <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>Cart is empty</Text>
                {!inPane && (
                  <GradientButton title="Browse Products" onPress={() => setShowCart(false)} height={48} glow={false} style={{ alignSelf: 'stretch' }} />
                )}
              </View>
            }
          />

          {items.length > 0 && (
            <View style={styles.checkoutSection}>
              <View style={styles.discountRow}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                  onPress={() => { setDiscountType('percentage'); setDiscountInput(''); setShowDiscountModal(true); }}
                >
                  <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Discount</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.secondaryAccent, backgroundColor: colors.glassFill }]}
                  onPress={handleHoldSave}
                >
                  <Text style={[styles.outlineBtnText, { color: colors.secondaryAccent }]}>Hold</Text>
                </TouchableOpacity>
                {manualDiscount && (
                  <TouchableOpacity onPress={clearManualDiscount} style={styles.removeDiscountWrap}>
                    <Text style={[styles.removeDiscount, { color: colors.danger }]}>Remove</Text>
                  </TouchableOpacity>
                )}
                {!loyaltyCustomer && (
                  <TouchableOpacity
                    style={[styles.outlineBtn, styles.attachMemberBtn, { borderColor: colors.glassStroke, backgroundColor: colors.glassFill }]}
                    onPress={() => setShowLoyaltyModal(true)}
                  >
                    <Text style={[styles.outlineBtnText, { color: colors.primary }]}>＋ Attach Member</Text>
                  </TouchableOpacity>
                )}
              </View>
              {manualDiscount && (
                <Text style={[styles.appliedDiscount, { color: colors.success }]}>
                  Discount: {manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : formatCurrency(manualDiscount.value)}
                </Text>
              )}
              {loyaltyCustomer && (
                <View style={[styles.memberRow, { borderColor: colors.glassStroke }]}>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>👤 {loyaltyCustomer.name}</Text>
                    <Text style={[styles.memberBalance, { color: colors.textSecondary }]}>
                      {loyaltyCustomer.points_balance} pts available
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.redeemBtn, { borderColor: colors.secondaryAccent, backgroundColor: colors.glassFill }]}
                    onPress={() => setShowRedeemModal(true)}
                    disabled={maxRedeemablePoints <= 0}
                  >
                    <Text style={[styles.redeemBtnText, { color: maxRedeemablePoints > 0 ? colors.secondaryAccent : colors.disabled }]}>
                      {effectiveRedeemPoints > 0 ? 'Edit' : 'Redeem'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearLoyaltyCustomer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.removeDiscount, { color: colors.danger }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              {effectiveRedeemPoints > 0 && (
                <Text style={[styles.appliedDiscount, { color: colors.success }]}>
                  Points: -{formatCurrency(pointsDiscount)} ({effectiveRedeemPoints} pts)
                </Text>
              )}
              <CartSummary
                subtotal={subtotal}
                discount={discount}
                total={finalTotal}
                itemCount={itemCount}
                discountLabel={manualDiscount ? (manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : formatCurrency(manualDiscount.value)) : null}
                pointsDiscount={pointsDiscount}
              />
              <GradientButton
                title={`Pay ${formatCurrency(finalTotal)}`}
                onPress={() => setShowPaymentModal(true)}
                loading={processing}
                height={52}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.heldContainer}>
          {items.length > 0 && (
            <View style={styles.holdSaveSection}>
              <Text style={[styles.holdSaveLabel, { color: colors.textSecondary }]}>HOLD CURRENT CART</Text>
              <TextInput
                style={[styles.holdInput, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
                value={holdLabel}
                onChangeText={setHoldLabel}
                placeholder="e.g. Customer Walk-in #1"
                placeholderTextColor={colors.disabled}
              />
              <GradientButton title="Save & Hold" onPress={handleHoldSave} height={42} fontSize={FONT_SIZES.sm} glow={false} />
            </View>
          )}

          <FlatList
            data={holds}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={[styles.heldCard, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
                <View style={styles.heldInfo}>
                  <Text style={[styles.heldLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.heldMeta, { color: colors.textSecondary }]}>
                    {item.item_count} items • {formatCurrency(item.total)}
                  </Text>
                  <Text style={[styles.heldDate, { color: colors.disabled }]}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={styles.heldActions}>
                  <TouchableOpacity
                    style={[styles.resumeBtn, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}
                    onPress={() => handleHoldRestore(item)}
                  >
                    <Text style={[styles.resumeBtnText, { color: colors.primary }]}>Resume</Text>
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
            showsVerticalScrollIndicator={false}
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

  const renderMemberChip = () => {
    if (loyaltyCustomer) {
      return (
        <View style={[styles.memberChip, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
          <Text style={[styles.memberChipText, { color: colors.primary }]} numberOfLines={1}>
            👤 {loyaltyCustomer.name} · {loyaltyCustomer.points_balance} pts
          </Text>
          <TouchableOpacity onPress={clearLoyaltyCustomer} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text style={[styles.memberChipRemove, { color: colors.primary }]}>✕</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.memberChip, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}
        onPress={() => setShowLoyaltyModal(true)}
      >
        <Text style={[styles.memberChipText, { color: colors.textSecondary }]}>＋ Member</Text>
      </TouchableOpacity>
    );
  };

  const renderModals = () => (
    <>
      <QuantityInputModal
        visible={showQuantityModal}
        currentQuantity={quantityTarget?.current ?? 1}
        maxQuantity={quantityTarget?.max ?? 999}
        onApply={handleQuantityApply}
        onClose={() => setShowQuantityModal(false)}
      />

      <PaymentMethodModal
        visible={showPaymentModal}
        total={finalTotal}
        selectedMethod={paymentMethod}
        onSelect={setPaymentMethod}
        onConfirm={handleCheckout}
        onClose={() => setShowPaymentModal(false)}
      />

      <LoyaltyScanModal
        visible={showLoyaltyModal}
        onClose={() => setShowLoyaltyModal(false)}
        onAttach={setLoyaltyCustomer}
      />

      {loyaltyCustomer && (
        <RedeemPointsModal
          visible={showRedeemModal}
          customer={loyaltyCustomer}
          pointValue={loyaltyPointValue}
          maxRedeemable={maxRedeemablePoints}
          currentRedeem={effectiveRedeemPoints}
          onApply={setPointsToRedeem}
          onClose={() => setShowRedeemModal(false)}
        />
      )}

      <ConfirmModal
        visible={pendingRestoreHold !== null}
        title="Restore Cart"
        message={`Restore "${pendingRestoreHold?.label}"?\nCurrent cart will be replaced.`}
        confirmLabel="Restore"
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestoreHold(null)}
      />

      <ConfirmModal
        visible={pendingDeleteHold !== null}
        title="Delete"
        message={`Delete "${pendingDeleteHold?.label}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteHold(null)}
      />

      <Modal visible={showDiscountModal} transparent animationType="fade" onRequestClose={() => setShowDiscountModal(false)} statusBarTranslucent>
        <View style={[styles.centerOverlay, { backgroundColor: colors.overlay }]}>
          <GlassPanel strong radius={RADII.xl} androidRealBlur intensity={60} style={styles.discountModal}>
            <Text style={[styles.discountTitle, { color: colors.text }]}>Apply Discount</Text>

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, { backgroundColor: discountType === 'percentage' ? colors.primarySurface : colors.glassFill, borderColor: discountType === 'percentage' ? colors.primary : colors.glassStroke }]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[styles.typeBtnText, { color: discountType === 'percentage' ? colors.primary : colors.text }]}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, { backgroundColor: discountType === 'fixed' ? colors.primarySurface : colors.glassFill, borderColor: discountType === 'fixed' ? colors.primary : colors.glassStroke }]}
                onPress={() => setDiscountType('fixed')}
              >
                <Text style={[styles.typeBtnText, { color: discountType === 'fixed' ? colors.primary : colors.text }]}>₱</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.discountInput, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
              keyboardType="decimal-pad"
              placeholder={discountType === 'percentage' ? 'Enter percentage (1-100)' : 'Enter amount'}
              placeholderTextColor={colors.disabled}
              value={discountInput}
              onChangeText={setDiscountInput}
            />

            <GradientButton title="Apply" onPress={handleApplyDiscount} height={48} style={{ alignSelf: 'stretch' }} />
            <TouchableOpacity onPress={() => setShowDiscountModal(false)} style={styles.cancelWrap}>
              <Text style={[styles.closeDiscount, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      </Modal>

      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.centerOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <GlassPanel strong radius={RADII.xl} androidRealBlur intensity={60} style={styles.sortModalContent}>
            <Text style={[styles.sortModalTitle, { color: colors.text }]}>Sort By</Text>
            {([['name', 'Name'], ['price_asc', 'Price: Low → High'], ['price_desc', 'Price: High → Low'], ['category', 'Category']] as const).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortOption, sortBy === key && { backgroundColor: colors.primarySurface }]}
                onPress={() => { setSortBy(key); setShowSortModal(false); }}
              >
                <Text style={[styles.sortOptionText, { color: colors.text }, sortBy === key && { color: colors.primary, fontWeight: '700' }]}>
                  {label}
                </Text>
                {sortBy === key && <Text style={{ color: colors.primary, fontWeight: '700', fontSize: FONT_SIZES.md }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </GlassPanel>
        </TouchableOpacity>
      </Modal>
    </>
  );

  if (receiptData) {
    return (
      <View style={{ flex: 1 }}>
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
          customerName={receiptData.customerName}
          pointsEarned={receiptData.pointsEarned}
          pointsRedeemed={receiptData.pointsRedeemed}
          remainingBalance={receiptData.remainingBalance}
          onNewSale={handleNewSale}
        />
        {showConfetti && <CoffeeConfetti />}
      </View>
    );
  }

  if (bp.posSplitView) {
    return (
      <View style={styles.container}>
        <View style={styles.splitRow}>
          <View style={styles.productsCol}>
            <View style={styles.posHeader}>
              <Text style={[styles.posTitle, { color: colors.text }]}>POS Terminal</Text>
              {renderMemberChip()}
              <View style={[styles.todayPill, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
                <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>TODAY</Text>
                <Text style={[styles.todayValue, { color: colors.success }]}>{formatCurrency(todayTotal)}</Text>
              </View>
            </View>
            {renderProductList()}
          </View>

          <GlassPanel
            radius={RADII.xl}
            androidRealBlur
            intensity={GLASS.blurIntensityStrong}
            style={[styles.cartPane, { width: cartPaneWidth, marginBottom: Math.max(bp.height * 0, 96) }]}
          >
            {renderCartContent(true)}
          </GlassPanel>
        </View>

        {renderModals()}
      </View>
    );
  }

  if (showCart) {
    return (
      <View style={[styles.container, { paddingBottom: 92 }]}>
        <View style={styles.cartHeader}>
          <TouchableOpacity onPress={() => setShowCart(false)}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← Products</Text>
          </TouchableOpacity>
          <Text style={[styles.cartTitle, { color: colors.text }]}>Cart ({itemCount})</Text>
          {cartTab === 'cart' ? (
            <TouchableOpacity onPress={() => { clearCart(); }}>
              <Text style={[styles.clearBtn, { color: colors.danger }]}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => { setCartTab('cart'); }}>
              <Text style={[styles.clearBtn, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {renderCartContent(false)}

        {renderModals()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.posHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.posTitle, { color: colors.text }]}>POS Terminal</Text>
          {renderMemberChip()}
        </View>
      </View>

      {renderProductList()}

      <TouchableOpacity
        style={[styles.cartFab, { backgroundColor: colors.primary, bottom: 96, right: SPACING.lg }]}
        onPress={() => setShowCart(true)}
      >
        <Text style={styles.cartFabText}>🛒</Text>
        {itemCount > 0 && (
          <View style={[styles.cartBadge, { backgroundColor: colors.secondaryAccent }]}>
            <Text style={styles.cartBadgeText}>{itemCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {renderModals()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  splitRow: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  productsCol: {
    flex: 1,
  },
  cartPane: {
    flex: 1,
    padding: SPACING.md,
  },
  paneInner: {
    flex: 1,
  },
  cartScreenInner: {
    flex: 1,
  },
  posHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  posTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  todayLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  todayValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pillBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  pillBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  backBtn: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sortModalContent: {
    width: '100%',
    maxWidth: 340,
    padding: SPACING.lg,
  },
  sortModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.sm,
    marginBottom: SPACING.xs,
  },
  sortOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  productList: {
    paddingBottom: 120,
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
    fontWeight: '800',
  },
  clearBtn: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  segWrap: {
    flexDirection: 'row',
    borderRadius: RADII.full,
    borderWidth: 1,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  segBtn: {
    flex: 1,
    paddingVertical: SPACING.sm - 2,
    alignItems: 'center',
    borderRadius: RADII.full,
  },
  segBtnActive: {
    borderWidth: 1,
  },
  segText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  cartList: {
    paddingBottom: SPACING.sm,
  },
  emptyCart: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  checkoutSection: {
    paddingTop: SPACING.sm,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  outlineBtn: {
    height: 34,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderRadius: RADII.full,
    borderWidth: 1.5,
  },
  outlineBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  removeDiscountWrap: {
    marginLeft: 'auto',
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
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.full,
    borderWidth: 1,
    maxWidth: 220,
  },
  memberChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  memberChipRemove: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADII.sm,
    padding: SPACING.sm + 2,
    marginTop: SPACING.xs,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  memberBalance: {
    fontSize: FONT_SIZES.xs,
  },
  redeemBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.full,
    borderWidth: 1.5,
  },
  redeemBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
  },
  attachMemberBtn: {
    marginLeft: 'auto',
  },
  heldContainer: {
    flex: 1,
  },
  holdSaveSection: {
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  holdSaveLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  holdInput: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
  },
  heldList: {
    paddingBottom: 20,
    gap: SPACING.xs,
  },
  heldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
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
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  resumeBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  heldDelete: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    padding: SPACING.xs,
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  discountModal: {
    width: '100%',
    maxWidth: 360,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  discountTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    width: 64,
    height: 46,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  typeBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  discountInput: {
    alignSelf: 'stretch',
    height: 48,
    borderWidth: GLASS.strokeWidth,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  cancelWrap: {
    marginTop: SPACING.sm,
    padding: SPACING.xs,
  },
  closeDiscount: {
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  cartFab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cartFabText: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: RADII.full,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B0B12',
  },
});
