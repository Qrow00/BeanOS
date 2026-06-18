import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';
import type { PriceMovement } from '../../database/priceHistory';

interface PriceChangeCardProps {
  item: PriceMovement;
}

export default function PriceChangeCard({ item }: PriceChangeCardProps) {
  const colors = useThemeStore(s => s.colors);

  const hasChange = item.old_price !== null && item.new_price !== null;
  const diff = hasChange ? item.new_price! - item.old_price! : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const dateStr = item.changed_at
    ? new Date(item.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Qty: {item.stock_quantity} {item.stock_unit}
          {item.measurement ? ` · ${item.measurement}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(item.price)}</Text>
        {hasChange ? (
          <View style={styles.changeRow}>
            <Text style={[styles.arrow, { color: isUp ? '#22C55E' : '#EF4444' }]}>
              {isUp ? '▲' : '▼'}
            </Text>
            <Text style={[styles.change, { color: isUp ? '#22C55E' : '#EF4444' }]}>
              {isUp ? '+' : ''}{formatCurrency(Math.abs(diff))}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{dateStr}</Text>
          </View>
        ) : (
          <Text style={[styles.noChange, { color: colors.disabled }]}>— No changes</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  left: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  meta: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  arrow: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  change: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  date: {
    fontSize: FONT_SIZES.xs,
    marginLeft: 4,
  },
  noChange: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
});
