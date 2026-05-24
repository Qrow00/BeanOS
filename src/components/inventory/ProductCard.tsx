import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';
import type { Product } from '../../types/database';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const colors = useThemeStore(s => s.colors);
  const outOfStock = product.stock_quantity <= 0;
  const isDrink = product.category.toLowerCase() === 'drink';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={outOfStock && !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
          {outOfStock && <Text style={[styles.outBadge, { color: colors.danger }]}>Out</Text>}
          {isDrink && <Text style={[styles.recipeBadge, { color: colors.primary }]}>📋</Text>}
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {product.category} • {product.item_id}
        </Text>
        {!outOfStock && (
          <Text style={[styles.stock, { color: colors.textSecondary }]}>
            Initial Stock: {product.initial_stock}
          </Text>
        )}
        {!outOfStock && (
          <Text style={[styles.stock, { color: colors.textSecondary }]}>
            Current Stock: {product.stock_quantity}
          </Text>
        )}
      </View>
      <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(product.price)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  outBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  recipeBadge: {
    fontSize: 12,
  },
  meta: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  stock: {
    fontSize: FONT_SIZES.xs,
    marginTop: 1,
  },
  price: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
