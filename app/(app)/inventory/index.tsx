import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import ProductCard from '../../../src/components/inventory/ProductCard';
import SearchBar from '../../../src/components/inventory/SearchBar';

export default function InventoryScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const {
    fetchProducts,
    getFilteredProducts,
    getCategories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isLoading,
  } = useProductStore();

  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useFocusEffect(useCallback(() => {
    fetchProducts();
  }, []));

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();

  const renderListHeader = () => (
    <View>
      <View style={{ marginTop: 10 }}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <TouchableOpacity
        style={[styles.stocksBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push('/(app)/inventory/stocks')}
      >
        <Ionicons name="cube-outline" size={18} color={colors.primary} />
        <Text style={[styles.stocksBtnText, { color: colors.primary }]}>Recipe Stocks</Text>
      </TouchableOpacity>

      {categories.length > 0 && (
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }, !selectedCategory && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, { color: colors.textSecondary }, !selectedCategory && { color: '#fff' }]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }, selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.categoryText, { color: colors.textSecondary }, selectedCategory === cat && { color: '#fff' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/(app)/inventory/${item.id}`)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: isLandscape ? 56 : 80 }]}
        refreshing={isLoading}
        onRefresh={fetchProducts}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No products match your search' : 'No products yet'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: 12 }]}
        onPress={() => router.push('/(app)/inventory/new')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  list: {
    flexGrow: 1,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  stocksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  stocksBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});
