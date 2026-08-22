import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SPACING, FONT_SIZES, RADII } from '../../../src/utils/constants';
import { getDatabase } from '../../../src/database/connection';
import { useThemeStore } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useBreakpoint } from '../../../src/hooks/useBreakpoint';
import type { Sale, SaleItem } from '../../../src/types/database';
import type { CartItem } from '../../../src/types/store';
import { formatCurrency, formatDate } from '../../../src/utils/helpers';
import ConfirmModal from '../../../src/components/ui/ConfirmModal';
import ReceiptScreen from '../../../src/components/pos/ReceiptScreen';
import GlassCard from '../../../src/components/ui/glass/GlassCard';
import GlassChip from '../../../src/components/ui/glass/GlassChip';
import GlassPanel from '../../../src/components/ui/glass/GlassPanel';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function SalesHistoryScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { isAdmin } = useAuthStore();
  const bp = useBreakpoint();
  const [sales, setSales] = useState<(Sale & { items?: SaleItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DateFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null);
  const [selectedSale, setSelectedSale] = useState<{
    sale: Sale;
    items: CartItem[];
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [filter])
  );

  const loadSales = async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      let sql = 'SELECT * FROM sales ORDER BY sale_date DESC';
      const params: any[] = [];

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        sql = 'SELECT * FROM sales WHERE sale_date >= ? ORDER BY sale_date DESC';
        params.push(`${today} 00:00:00`);
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        sql = 'SELECT * FROM sales WHERE sale_date >= ? ORDER BY sale_date DESC';
        params.push(weekAgo.toISOString());
      } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        sql = 'SELECT * FROM sales WHERE sale_date >= ? ORDER BY sale_date DESC';
        params.push(monthAgo.toISOString());
      }

      const allSales = await db.getAllAsync<Sale>(sql, ...params);
      setSales(allSales);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleDelete = (sale: Sale) => {
    setPendingDelete(sale);
  };

  const confirmDelete = async () => {
    const sale = pendingDelete;
    if (!sale) return;
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM sales WHERE id = ?', sale.id);
      setSales(prev => prev.filter(s => s.id !== sale.id));
      if (selectedSale?.sale.id === sale.id) setSelectedSale(null);
    } catch (e) {
      Alert.alert('Error', 'Could not delete the sale record.');
    } finally {
      setPendingDelete(null);
    }
  };

  const SwipeableRow = ({ item, children }: { item: Sale; children: React.ReactNode }) => {
    const itemRef = useRef(item);
    itemRef.current = item;
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteTranslate = translateX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          if (g.dx < 0) translateX.setValue(Math.max(g.dx, -80));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) handleDelete(itemRef.current);
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      })
    ).current;

    return (
      <View style={{ marginBottom: SPACING.sm }}>
        <View style={{ borderRadius: RADII.md, overflow: 'hidden' }}>
          <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
            {children}
          </Animated.View>
          <Animated.View style={[styles.swipeDeleteContainer, { backgroundColor: colors.danger, transform: [{ translateX: deleteTranslate }] }]}>
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  const handleViewReceipt = async (sale: Sale) => {
    try {
      const db = await getDatabase();
      const saleItems = await db.getAllAsync<SaleItem>(
        'SELECT si.*, p.name FROM sale_items si LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?',
        sale.id
      );
      const cartItems: CartItem[] = saleItems.map(si => ({
        product: {
          id: si.product_id,
          item_id: '',
          name: (si as any).name || '(deleted)',
          category: '',
          price: si.unit_price,
          stock_quantity: 0,
          stock_unit: 'pcs',
          measurement: null,
          is_ingredient: 0,
          initial_stock: 0,
          icon_color: null,
          barcode: null,
          description: null,
          image_uri: null,
          created_at: '',
          updated_at: '',
        },
        quantity: si.quantity,
      }));
      setSelectedSale({ sale, items: cartItems });
    } catch {}
  };

  if (!bp.twoPane && selectedSale) {
    const { sale, items } = selectedSale;
    return (
      <ReceiptScreen
        receiptNumber={sale.receipt_number}
        items={items}
        subtotal={sale.subtotal}
        discount={sale.discount_amount}
        total={sale.total}
        paymentMethod={sale.payment_method as any}
        amountTendered={sale.total + (sale.payment_method === 'cash' ? 0 : sale.total)}
        change={sale.payment_method === 'cash' ? 0 : 0}
        cashierName=""
        onNewSale={() => setSelectedSale(null)}
      />
    );
  }

  const filters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  const renderSaleItem = ({ item }: { item: Sale }) => {
    const card = (
      <TouchableOpacity onPress={() => handleViewReceipt(item)}>
        <GlassCard
          style={[styles.saleCard, selectedSale?.sale.id === item.id && { borderColor: colors.primary }]}
        >
          <View style={styles.saleHeader}>
            <Text style={[styles.receipt, { color: colors.secondaryAccent }]}>{item.receipt_number}</Text>
            <Text style={[styles.paymentMethod, { color: colors.primary, backgroundColor: colors.primarySurface }]}>{item.payment_method.toUpperCase()}</Text>
          </View>
          <View style={styles.saleDetails}>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Subtotal: {formatCurrency(item.subtotal)}</Text>
            {item.discount_amount > 0 && (
              <Text style={[styles.discount, { color: colors.success }]}>Discount: -{formatCurrency(item.discount_amount)}</Text>
            )}
            <Text style={[styles.total, { color: colors.text }]}>Total: {formatCurrency(item.total)}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(item.sale_date)}</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
    return isAdmin() ? <SwipeableRow item={item}>{card}</SwipeableRow> : card;
  };

  const listContent = (
    <>
      <View style={styles.filterRow}>
        {filters.map(f => (
          <GlassChip
            key={f.key}
            label={f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSaleItem}
        refreshing={loading}
        onRefresh={loadSales}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListFooterComponent={
          isAdmin() ? <Text style={[styles.swipeHint, { color: colors.textSecondary }]}>Swipe left on a sale to delete</Text> : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sales recorded yet</Text>
          </View>
        }
      />
    </>
  );

  if (bp.twoPane) {
    return (
      <View style={[styles.container, styles.twoPaneRow]}>
        <View style={styles.listCol}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/(app)/pos')}>
              <Text style={[styles.backBtn, { color: colors.primary }]}>← POS</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Sales History</Text>
            <View style={{ width: 80 }} />
          </View>
          {listContent}
        </View>

        <GlassPanel radius={RADII.xl} androidRealBlur intensity={50} style={styles.detailPane}>
          {selectedSale ? (
            <ReceiptScreen
              receiptNumber={selectedSale.sale.receipt_number}
              items={selectedSale.items}
              subtotal={selectedSale.sale.subtotal}
              discount={selectedSale.sale.discount_amount}
              total={selectedSale.sale.total}
              paymentMethod={selectedSale.sale.payment_method as any}
              amountTendered={selectedSale.sale.total + (selectedSale.sale.payment_method === 'cash' ? 0 : selectedSale.sale.total)}
              change={selectedSale.sale.payment_method === 'cash' ? 0 : 0}
              cashierName=""
              onNewSale={() => setSelectedSale(null)}
            />
          ) : (
            <View style={styles.emptyDetail}>
              <Text style={[styles.emptyDetailIcon, { color: colors.disabled }]}>🧾</Text>
              <Text style={[styles.emptyDetailText, { color: colors.textSecondary }]}>Select a sale to view its receipt</Text>
            </View>
          )}
        </GlassPanel>

        <ConfirmModal
          visible={pendingDelete !== null}
          title="Delete Sale"
          message={`Delete sale "${pendingDelete?.receipt_number}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(app)/pos')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← POS</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Sales History</Text>
        <View style={{ width: 80 }} />
      </View>

      {listContent}

      <ConfirmModal
        visible={pendingDelete !== null}
        title="Delete Sale"
        message={`Delete sale "${pendingDelete?.receipt_number}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  twoPaneRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  listCol: {
    flex: 1,
    minWidth: 320,
  },
  detailPane: {
    width: 460,
    maxWidth: '45%',
  },
  emptyDetail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyDetailIcon: {
    fontSize: 44,
    marginBottom: SPACING.sm,
  },
  emptyDetailText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  saleCard: {
    marginBottom: 0,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  receipt: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
  paymentMethod: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.full,
    overflow: 'hidden',
  },
  saleDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
  },
  discount: {
    fontSize: FONT_SIZES.sm,
  },
  total: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  date: {
    fontSize: FONT_SIZES.xs,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
  },
  swipeDeleteContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    paddingVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
