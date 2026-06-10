import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, getProductIconColor } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/helpers';
import type { Product } from '../../types/database';

interface ProductTileProps {
  product: Product;
  tileWidth: number;
  onAddToCart: () => void;
}

function ProductTile({ product, tileWidth, onAddToCart }: ProductTileProps) {
  const colors = useThemeStore(s => s.colors);
  const quantity = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0);
  const outOfStock = product.stock_quantity <= 0;
  const inCart = quantity > 0;

  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: colors.surface, width: tileWidth, height: tileWidth }]}
      onPress={onAddToCart}
      disabled={outOfStock}
      activeOpacity={0.7}
    >
      {inCart && (
        <View style={[styles.tint, { backgroundColor: colors.primary }]} />
      )}
      {inCart && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{quantity}</Text>
        </View>
      )}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatar, { backgroundColor: getProductIconColor(product.icon_color, product.category) }]}>
          <Text style={styles.avatarText}>{product.name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.textGroup}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(product.price)}</Text>
        {outOfStock && <Text style={[styles.outText, { color: colors.danger }]}>Out of Stock</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default memo(ProductTile, (prev, next) => prev.product.id === next.product.id && prev.tileWidth === next.tileWidth);

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
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
  avatarWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGroup: {
    alignItems: 'center',
  },
  outText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
