import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import type { CartItem } from '../../types/store';
import GradientButton from '../ui/glass/GradientButton';
import GlassPanel from '../ui/glass/GlassPanel';

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
  customerName?: string | null;
  pointsEarned?: number;
  pointsRedeemed?: number;
  remainingBalance?: number;
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
  customerName,
  pointsEarned = 0,
  pointsRedeemed = 0,
  remainingBalance = 0,
  onNewSale,
}: ReceiptScreenProps) {
  const colors = useThemeStore(s => s.colors);
  const storeName = useSettingsStore(s => s.storeName);

  return (
    <View style={styles.container}>
      <GlassPanel strong radius={RADII.xl} androidRealBlur intensity={55} style={styles.ticket}>
        <Text style={[styles.storeName, { color: colors.text }]}>{storeName}</Text>
        <View style={[styles.titleBadge, { backgroundColor: colors.primarySurface }]}>
          <Text style={[styles.title, { color: colors.primary }]}>RECEIPT</Text>
        </View>
        <Text style={[styles.receiptNo, { color: colors.secondaryAccent }]}>#{receiptNumber}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(new Date().toISOString())}</Text>
        <Text style={[styles.cashier, { color: colors.textSecondary }]}>Cashier: {cashierName}</Text>

        <View style={styles.perfDivider}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
            <View key={i} style={[styles.perfDot, { backgroundColor: colors.glassStroke }]} />
          ))}
        </View>

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

        <View style={styles.summaryBlock}>
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
          <View style={[styles.totalDivider, { backgroundColor: colors.glassStroke }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Payment: {paymentMethod.toUpperCase()}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Amount: {formatCurrency(amountTendered)}</Text>
          {change > 0 && <Text style={[styles.infoText, { color: colors.success }]}>Change: {formatCurrency(change)}</Text>}
          {customerName && (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Member: {customerName}</Text>
          )}
          {pointsRedeemed > 0 && (
            <Text style={[styles.infoText, { color: colors.success }]}>Points redeemed: {pointsRedeemed}</Text>
          )}
          {pointsEarned > 0 && (
            <Text style={[styles.loyaltyEarn, { color: colors.primary }]}>
              ★ +{pointsEarned} pts earned{customerName ? ` · balance ${remainingBalance}` : ''}
            </Text>
          )}
        </View>

        <GradientButton title="New Sale" onPress={onNewSale} height={52} />

        <Text style={[styles.footer, { color: colors.disabled }]}>Thank you!</Text>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  ticket: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    padding: SPACING.lg,
  },
  storeName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  titleBadge: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADII.full,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  receiptNo: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  date: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  cashier: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  perfDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
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
  summaryBlock: {
    marginBottom: SPACING.sm,
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
  totalDivider: {
    height: 1,
    marginVertical: SPACING.xs,
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
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
  },
  loyaltyEarn: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
