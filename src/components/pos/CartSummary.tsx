import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  discountLabel?: string | null;
}

export default function CartSummary({ subtotal, discount, total, itemCount, discountLabel }: CartSummaryProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Subtotal</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatCurrency(subtotal)}</Text>
      </View>
      {discount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Discount {discountLabel ? `(${discountLabel})` : ''}
          </Text>
          <Text style={[styles.value, { color: colors.success }]}>-{formatCurrency(discount)}</Text>
        </View>
      )}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.row}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total ({itemCount} items)</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: FONT_SIZES.sm,
  },
  value: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.xs,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
