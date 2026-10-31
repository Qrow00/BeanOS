import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import { useThemeStore } from '../../store/themeStore';
import type { CartItem } from '../../types/store';

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onQuantityPress: () => void;
}

export default function CartItemComponent({ item, onUpdateQuantity, onRemove, onQuantityPress }: CartItemComponentProps) {
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.glassFill,
          borderColor: colors.glassStroke,
          shadowColor: mode === 'dark' ? '#000' : '#8B5E34',
          shadowOpacity: mode === 'dark' ? 0.35 : 0.12,
        },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          mode === 'dark'
            ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.04)']
            : ['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.28)']
        }
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sheen}
      />
      <View style={styles.topRow}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.product.name}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Text style={[styles.removeBtn, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomRow}>
        <TouchableOpacity
          onPress={onQuantityPress}
          style={[styles.qtyBtn, { borderColor: colors.primary + '66', backgroundColor: colors.glassFillStrong }]}
        >
          <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
          <Text style={[styles.qtyArrow, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatCurrency(item.product.price * item.quantity)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  removeBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    padding: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 4,
  },
  qtyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  qtyArrow: {
    fontSize: 8,
  },
  price: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
