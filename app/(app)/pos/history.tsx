import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { getDatabase } from '../../../src/database/connection';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Sale, SaleItem } from '../../../src/types/database';
import type { CartItem } from '../../../src/types/store';
import { formatCurrency, formatDate } from '../../../src/utils/helpers';
import Card from '../../../src/components/ui/Card';
import ReceiptScreen from '../../../src/components/pos/ReceiptScreen';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function SalesHistoryScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const [sales, setSales] = useState<(Sale & { items?: SaleItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DateFilter>('all');
  const [selectedSale, setSelectedSale] = useState<{
    sale: Sale;
    items: CartItem[];
  } | null>(null);

  useEffect(() => {
    loadSales();
  }, [filter]);

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
          barcode: null,
          description: null,
          image_uri: null,
          stock_unit: 'pcs',
          created_at: '',
          updated_at: '',
        },
        quantity: si.quantity,
      }));
      setSelectedSale({ sale, items: cartItems });
    } catch {}
  };

  if (selectedSale) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/pos')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← POS</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Sales History</Text>
        <View style={{ width: 80 }} />
      </View>
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, filter === f.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleViewReceipt(item)}>
            <Card style={styles.saleCard}>
              <View style={styles.saleHeader}>
                <Text style={[styles.receipt, { color: colors.text }]}>{item.receipt_number}</Text>
                <Text style={[styles.paymentMethod, { color: colors.text, backgroundColor: colors.primarySurface }]}>{item.payment_method.toUpperCase()}</Text>
              </View>
              <View style={styles.saleDetails}>
                <Text style={[styles.detailText, { color: colors.text }]}>Subtotal: {formatCurrency(item.subtotal)}</Text>
                {item.discount_amount > 0 && (
                  <Text style={[styles.discount, { color: colors.success }]}>Discount: -{formatCurrency(item.discount_amount)}</Text>
                )}
                <Text style={[styles.total, { color: colors.text }]}>Total: {formatCurrency(item.total)}</Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(item.sale_date)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        refreshing={loading}
        onRefresh={loadSales}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sales recorded yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  saleCard: {
    marginBottom: SPACING.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  receipt: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  paymentMethod: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
