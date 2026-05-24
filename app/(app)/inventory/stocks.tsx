import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet, Alert, Animated, PanResponder } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../src/store/themeStore';
import { getDatabase } from '../../../src/database/connection';
import { getRecipeIngredientsWithStock } from '../../../src/database/stocks';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import ConfirmModal from '../../../src/components/ui/ConfirmModal';
import type { ProductWithRecipe } from '../../../src/database/stocks';


export default function RecipeStocksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const [ingredients, setIngredients] = useState<ProductWithRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRecipe | null>(null);
  const [addQty, setAddQty] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductWithRecipe | null>(null);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const items = await getRecipeIngredientsWithStock(db);
      setIngredients(items);
    } catch (e) {
      console.error('Failed to fetch ingredients', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIngredients();
    }, [])
  );

  const handleAddStock = async () => {
    if (!selectedProduct || !addQty) return;
    const multiplier = parseFloat(addQty);
    if (isNaN(multiplier) || multiplier <= 0) return;
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE products SET stock_quantity = stock_quantity + (? * initial_stock), updated_at = datetime(\'now\') WHERE id = ?',
      multiplier, selectedProduct.id
    );
    await fetchIngredients();
    setShowAddModal(false);
    setAddQty('');
    setSelectedProduct(null);
  };

  const openAddStock = (product: ProductWithRecipe) => {
    setSelectedProduct(product);
    setAddQty('');
    setShowAddModal(true);
  };

  const handleDelete = (product: ProductWithRecipe) => {
    setPendingDelete(product);
  };

  const confirmDelete = async () => {
    const product = pendingDelete;
    if (!product) return;
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM product_recipes WHERE ingredient_id = ?', product.id);
      await db.runAsync('DELETE FROM products WHERE id = ?', product.id);
      await fetchIngredients();
    } catch (e) {
      Alert.alert('Error', 'Could not delete ingredient. It may be referenced by existing sales records.');
      console.error('Delete error', e);
    } finally {
      setPendingDelete(null);
    }
  };

  const SwipeableRow = ({ item, children }: { item: ProductWithRecipe; children: React.ReactNode }) => {
    const itemRef = useRef(item);
    itemRef.current = item;
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteTranslate = translateX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          if (g.dx < 0) translateX.setValue(Math.max(g.dx, -80));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) handleDelete(itemRef.current);
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      })
    ).current;

    return (
      <View style={{ marginBottom: SPACING.sm }}>
        <View style={{ borderRadius: 12, overflow: 'hidden' }}>
          <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
            {children}
          </Animated.View>
          <Animated.View style={[styles.swipeDeleteContainer, { backgroundColor: colors.danger, transform: [{ translateX: deleteTranslate }] }]}>
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/inventory')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Inventory</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Recipe Stocks</Text>
        <View style={{ width: 80 }} />
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
        ListFooterComponent={
          <Text style={[styles.swipeHint, { color: colors.textSecondary }]}>Swipe left on an item to delete</Text>
        }
        renderItem={({ item }) => (
          <SwipeableRow item={item}>
            <View style={[styles.productRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Fixed Quantity: </Text>
                  <Text style={[styles.stockValue, { color: colors.text }]}>
                    {item.initial_stock} {item.stock_unit || 'pcs'}
                  </Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Stock: </Text>
                  <Text style={[styles.stockValue, { color: colors.text }]}>
                    {item.stock_quantity} {item.stock_unit || 'pcs'}
                  </Text>
                </View>
              </View>
              <View style={styles.actionCol}>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => openAddStock(item)}
                >
                  <Text style={styles.addBtnText}>+ Add Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SwipeableRow>
        )}
      />

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Stock: {selectedProduct?.name}
            </Text>
            <Text style={[styles.currentStock, { color: colors.textSecondary }]}>
              Current: {selectedProduct?.stock_quantity} {selectedProduct?.stock_unit || 'pcs'}
            </Text>
            <Text style={[styles.multiplierInfo, { color: colors.textSecondary }]}>
              Fixed Quantity: {selectedProduct?.initial_stock} {selectedProduct?.stock_unit || 'pcs'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={`Multiplier`}
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

      <ConfirmModal
        visible={pendingDelete !== null}
        title="Delete Ingredient"
        message={`Delete "${pendingDelete?.name}" from recipe stocks? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(app)/inventory/new?from=stocks')}
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
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
  },
  productInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  productName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  recipeMeasurement: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  stockLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  stockValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
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
  actionCol: {
    gap: SPACING.xs,
  },
  swipeDeleteContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    paddingVertical: SPACING.sm,
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
    marginBottom: SPACING.xs,
  },
  multiplierInfo: {
    fontSize: FONT_SIZES.sm,
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
  fab: {
    position: 'absolute',
    bottom: 100,
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
