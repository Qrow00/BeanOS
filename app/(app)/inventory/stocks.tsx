import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../src/store/themeStore';
import { getDatabase } from '../../../src/database/connection';
import { getRecipeIngredientsWithStock, addStock, setStockUnit } from '../../../src/database/stocks';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import type { Product } from '../../../src/types/database';

const STOCK_UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'oz', 'lb', 'cup', 'tbsp', 'tsp'];

export default function RecipeStocksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const [ingredients, setIngredients] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const fetchIngredients = async () => {
    setLoading(true);
    const db = await getDatabase();
    const items = await getRecipeIngredientsWithStock(db);
    setIngredients(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleAddStock = async () => {
    if (!selectedProduct || !addQty) return;
    const qty = parseFloat(addQty);
    if (isNaN(qty) || qty <= 0) return;
    const db = await getDatabase();
    await addStock(db, selectedProduct.id, qty);
    await fetchIngredients();
    setShowAddModal(false);
    setAddQty('');
    setSelectedProduct(null);
  };

  const handleSetUnit = async (unit: string) => {
    if (!selectedProduct) return;
    const db = await getDatabase();
    await setStockUnit(db, selectedProduct.id, unit);
    await fetchIngredients();
    setShowUnitModal(false);
  };

  const openAddStock = (product: Product) => {
    setSelectedProduct(product);
    setAddQty('');
    setShowAddModal(true);
  };

  const openUnitPicker = (product: Product) => {
    setSelectedProduct(product);
    setShowUnitModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Recipe Stocks</Text>
        <View style={{ width: 24 }} />
      </View>

      {ingredients.length === 0 && !loading && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No recipe ingredients found. Add recipes to products first.
          </Text>
        </View>
      )}

      <FlatList
        data={ingredients}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchIngredients}
        renderItem={({ item }) => (
          <View style={[styles.productRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.productCategory, { color: colors.textSecondary }]}>{item.category}</Text>
              <View style={styles.stockRow}>
                <Text style={[styles.stockValue, { color: colors.text }]}>{item.stock_quantity}</Text>
                <TouchableOpacity onPress={() => openUnitPicker(item)}>
                  <Text style={[styles.stockUnit, { color: colors.primary }]}>{item.stock_unit} ▼</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => openAddStock(item)}
            >
              <Text style={styles.addBtnText}>+ Add Stock</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Stock: {selectedProduct?.name}
            </Text>
            <Text style={[styles.currentStock, { color: colors.textSecondary }]}>
              Current: {selectedProduct?.stock_quantity} {selectedProduct?.stock_unit}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={`Quantity in ${selectedProduct?.stock_unit || 'pcs'}`}
              placeholderTextColor={colors.disabled}
              value={addQty}
              onChangeText={setAddQty}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.background }]} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalCancelText, { color: colors.danger }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]} onPress={handleAddStock}>
                <Text style={styles.modalSubmitText}>Add Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showUnitModal} transparent animationType="fade" onRequestClose={() => setShowUnitModal(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowUnitModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Unit</Text>
            <View style={styles.unitGrid}>
              {STOCK_UNITS.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitOption, { borderColor: colors.border, backgroundColor: colors.background }, selectedProduct?.stock_unit === unit && { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                  onPress={() => handleSetUnit(unit)}
                >
                  <Text style={[styles.unitText, { color: selectedProduct?.stock_unit === unit ? colors.primary : colors.text }]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  productInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  productName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  productCategory: {
    fontSize: FONT_SIZES.xs,
    marginTop: 1,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  stockValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  stockUnit: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  addBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  currentStock: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  unitOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  unitText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
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
