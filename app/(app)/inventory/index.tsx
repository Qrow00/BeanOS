import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import { useAuthStore } from '../../../src/store/authStore';
import ProductCard from '../../../src/components/inventory/ProductCard';
import SearchBar from '../../../src/components/inventory/SearchBar';

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const { isAdmin } = useAuthStore();
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

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

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

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/(app)/inventory/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
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

      {isAdmin() && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(app)/inventory/new')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 80,
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
    bottom: 24,
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
});
