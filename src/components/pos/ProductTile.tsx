import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';
import type { Product } from '../../types/database';

interface ProductTileProps {
  product: Product;
  tileWidth: number;
  onAddToCart: () => void;
}

export default function ProductTile({ product, tileWidth, onAddToCart }: ProductTileProps) {
  const colors = useThemeStore(s => s.colors);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: colors.surface, width: tileWidth, height: tileWidth }]}
      onPress={onAddToCart}
      disabled={outOfStock}
      activeOpacity={0.7}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
        <Text style={styles.imageEmoji}>📦</Text>
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
      <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(product.price)}</Text>
      {outOfStock && <Text style={[styles.outText, { color: colors.danger }]}>Out of Stock</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: '50%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  imageEmoji: {
    fontSize: 24,
  },
  name: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  price: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  outText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
