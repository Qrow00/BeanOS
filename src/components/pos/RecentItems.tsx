import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';
import type { Product } from '../../types/database';
import { useProductStore } from '../../store/productStore';
import { getDatabase } from '../../database/connection';
import * as salesRepo from '../../database/sales';

interface RecentItemsProps {
  onAddToCart: (product: Product) => void;
}

export default function RecentItems({ onAddToCart }: RecentItemsProps) {
  const colors = useThemeStore(s => s.colors);
  const { products } = useProductStore();
  const [topSellers, setTopSellers] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const db = await getDatabase();
          const rows = await salesRepo.getTopSellersWeekly(db);
          setTopSellers(rows.map(r => r.product_id));
        } catch {
          setTopSellers([]);
        }
      })();
    }, [])
  );

  const filtered = products.filter(p => topSellers.includes(p.id));

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.warning }]}>★ Top Sellers Weekly</Text>
      <FlatList
        data={filtered}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onAddToCart(item)}
            disabled={item.stock_quantity <= 0}
          >
            <Text style={[styles.chipText, { color: colors.text }, item.stock_quantity <= 0 && styles.chipDisabled]}>
              {item.name}
            </Text>
            <Text style={[styles.chipPrice, { color: colors.text }]}>{formatCurrency(item.price)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chip: {
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  chipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  chipPrice: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  chipDisabled: {
    opacity: 0.4,
  },
});
