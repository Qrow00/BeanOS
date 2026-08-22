import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII, getCategoryColor } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import ProductCard from '../../../src/components/inventory/ProductCard';
import SearchBar from '../../../src/components/inventory/SearchBar';
import GlassChip from '../../../src/components/ui/glass/GlassChip';

export default function InventoryScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
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

      {categories.length > 0 && (
        <View style={styles.categoryRow}>
          <GlassChip label="All" active={!selectedCategory} onPress={() => setSelectedCategory(null)} />
          {categories.map(cat => (
            <GlassChip
              key={cat}
              label={cat}
              color={getCategoryColor(cat)}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
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
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        refreshing={isLoading}
        onRefresh={fetchProducts}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No products match your search' : 'No products yet'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: 96 }]}
        onPress={() => router.push('/(app)/inventory/new')}
      >
        <LinearGradient
          colors={[colors.primaryGradientFrom, colors.primaryGradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
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
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
