import { memo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII, getProductIconColor } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/helpers';
import type { Product } from '../../types/database';
import { usePressScale } from '../../hooks/usePressScale';
import { springs } from '../../utils/motion';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ProductTileProps {
  product: Product;
  tileWidth: number;
  onAddToCart: () => void;
}

function ProductTile({ product, tileWidth, onAddToCart }: ProductTileProps) {
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);
  const quantity = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0);
  const outOfStock = product.stock_quantity <= 0;
  const inCart = quantity > 0;
  const accent = getProductIconColor(product.icon_color, product.category);
  const { scale, onPressIn, onPressOut } = usePressScale(0.95);
  const badgeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (quantity > 0) {
      badgeScale.setValue(1.4);
      Animated.spring(badgeScale, {
        toValue: 1,
        useNativeDriver: true,
        ...springs.bouncy,
      }).start();
    }
  }, [quantity]);

  return (
    <AnimatedTouchable
      style={[
        styles.tile,
        {
          backgroundColor: colors.glassFill,
          borderColor: inCart ? colors.primary : colors.glassStroke,
          shadowColor: mode === 'dark' ? '#000' : accent,
          shadowOpacity: mode === 'dark' ? 0.3 : 0.16,
          width: tileWidth,
          height: tileWidth,
        },
        { transform: [{ scale }] },
      ]}
      onPress={onAddToCart}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={outOfStock}
      activeOpacity={0.9}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          mode === 'dark'
            ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.05)']
            : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.35)']
        }
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sheen}
      />
      {inCart && (
        <Animated.View style={[styles.badge, { backgroundColor: colors.primary, transform: [{ scale: badgeScale }] }]}>
          <Text style={styles.badgeText}>{quantity}</Text>
        </Animated.View>
      )}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarGlow, { backgroundColor: accent }]} />
        <View style={[styles.avatarRing, { borderColor: accent + '55' }]}>
          {product.image_uri ? (
            <Image source={{ uri: product.image_uri }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[accent, accent + '99']}
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
    </AnimatedTouchable>
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
  avatarGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    marginLeft: -42,
    marginTop: -42,
    top: '50%',
    left: '50%',
    borderRadius: RADII.full,
    opacity: 0.16,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
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
