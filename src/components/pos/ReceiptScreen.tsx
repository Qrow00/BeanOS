import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import type { CartItem } from '../../types/store';

interface ReceiptScreenProps {
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  change: number;
  cashierName: string;
  onNewSale: () => void;
}

export default function ReceiptScreen({
  receiptNumber,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  amountTendered,
  change,
  cashierName,
  onNewSale,
}: ReceiptScreenProps) {
  const colors = useThemeStore(s => s.colors);
  const storeName = useSettingsStore(s => s.storeName);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.storeName, { color: colors.text }]}>{storeName}</Text>
      <Text style={[styles.title, { color: colors.text }]}>Receipt</Text>
      <Text style={[styles.receiptNo, { color: colors.textSecondary }]}>#{receiptNumber}</Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(new Date().toISOString())}</Text>
      <Text style={[styles.cashier, { color: colors.textSecondary }]}>Cashier: {cashierName}</Text>

      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        style={styles.itemList}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.product.name} x{item.quantity}</Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>{formatCurrency(item.product.price * item.quantity)}</Text>
          </View>
        )}
      />

      <View style={[styles.divider, { borderBottomColor: colors.border }]} />
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(subtotal)}</Text>
      </View>
      {discount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Discount</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>-{formatCurrency(discount)}</Text>
        </View>
      )}
      <View style={styles.summaryRow}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Payment: {paymentMethod}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Amount: {formatCurrency(amountTendered)}</Text>
        {change > 0 && <Text style={[styles.infoText, { color: colors.textSecondary }]}>Change: {formatCurrency(change)}</Text>}
      </View>

      <TouchableOpacity style={[styles.newSaleBtn, { backgroundColor: colors.primary }]} onPress={onNewSale}>
        <Text style={styles.newSaleBtnText}>New Sale</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: colors.disabled }]}>Thank you!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  storeName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  receiptNo: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  date: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  cashier: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  itemList: {
    flexGrow: 0,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  itemName: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  itemPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  infoSection: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
  },
  newSaleBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  newSaleBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
