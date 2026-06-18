import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
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

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.product.name}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={[styles.removeBtn, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={onQuantityPress} style={[styles.qtyBtn, { borderColor: colors.border }]}>
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
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
    borderRadius: 8,
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
    fontWeight: '700',
  },
});
