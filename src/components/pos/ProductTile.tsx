import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII, getProductIconColor } from '../../utils/constants';
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
      style={[
        styles.tile,
        { backgroundColor: colors.glassFill, borderColor: inCart ? colors.primary : colors.glassStroke, width: tileWidth, height: tileWidth },
      ]}
      onPress={onAddToCart}
      disabled={outOfStock}
      activeOpacity={0.7}
    >
      {inCart && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{quantity}</Text>
        </View>
      )}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarRing, { borderColor: getProductIconColor(product.icon_color, product.category) + '55' }]}>
          {product.image_uri ? (
            <Image source={{ uri: product.image_uri }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[getProductIconColor(product.icon_color, product.category), getProductIconColor(product.icon_color, product.category) + '99']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{product.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
      <View style={styles.textGroup}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.price, { color: colors.textSecondary }]}>{formatCurrency(product.price)}</Text>
        {outOfStock && <Text style={[styles.outText, { color: colors.danger }]}>Out of Stock</Text>}
      </View>
      {outOfStock && <View style={styles.disabledTint} />}
    </TouchableOpacity>
  );
}

export default memo(ProductTile, (prev, next) => prev.product === next.product && prev.tileWidth === next.tileWidth);

const styles = StyleSheet.create({
  tile: {
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarRing: {
    padding: 2,
    borderRadius: RADII.full,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: FONT_SIZES.sm,
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
  disabledTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    borderRadius: RADII.full,
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
