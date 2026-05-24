import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useRecipeStore } from '../../../src/store/recipeStore';
import { getDatabase } from '../../../src/database/connection';
import ProductForm from '../../../src/components/inventory/ProductForm';
import Button from '../../../src/components/ui/Button';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { formatCurrency } from '../../../src/utils/helpers';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { products, updateProduct, deleteProduct, forceDeleteProduct, isLoading } = useProductStore();
  const { isAdmin } = useAuthStore();
  const { recipes, fetchRecipe, addIngredient, removeIngredient } = useRecipeStore();
  const product = products.find(p => p.id === Number(id));
  const DRINK_CATEGORIES = ['Drink', 'Coffee', 'Tea', 'Frappe'];
  const isDrink = product ? DRINK_CATEGORIES.includes(product.category) : false;
  const recipeItems = recipes[Number(id)] || [];
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<number | null>(null);
  const [ingredientQty, setIngredientQty] = useState('1');
  const [ingredientUnit, setIngredientUnit] = useState('pcs');
  const [showIngredientUnitModal, setShowIngredientUnitModal] = useState(false);
  const otherProducts = products.filter(p => p.id !== Number(id));
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!product) router.replace('/(app)/inventory');
    else if (isDrink) fetchRecipe(product.id);
  }, [product]);

  useEffect(() => {
    if (selectedIngredient) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [selectedIngredient]);

  const missingCount = recipeItems.filter(r => !r.ingredient_name).length;

  useEffect(() => {
    if (missingCount > 0 && !showAddIngredient) {
      Alert.alert(
        'Missing Ingredient',
        missingCount === 1
          ? 'An ingredient used in this recipe has been deleted. Replace it with another ingredient or add a new recipe ingredient.'
          : `${missingCount} ingredients used in this recipe have been deleted. Replace them or add new recipe ingredients.`,
        [
          { text: 'Ignore', style: 'cancel' },
          { text: 'Replace', onPress: () => setShowAddIngredient(true) },
        ]
      );
    }
  }, [missingCount]);

  if (!product) return null;

  const handleUpdate = async (data: any) => {
    await updateProduct(product.id, data);
    router.replace('/(app)/inventory');
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            router.replace('/(app)/inventory');
          } catch {
            const db = await getDatabase();
            const row = await db.getFirstAsync<{ count: number }>(
              'SELECT COUNT(*) AS count FROM sale_items WHERE product_id = ?',
              product.id
            );
            const count = row?.count ?? 0;
            Alert.alert(
              'Cannot Delete Product',
              `This product has ${count} existing sales record(s). Overwrite will remove those line items and delete the product.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: `Overwrite & Delete (${count})`,
                  style: 'destructive',
                  onPress: async () => {
                    await forceDeleteProduct(product.id);
                    router.replace('/(app)/inventory');
                  },
                },
              ]
            );
          }
        },
      },
    ]);
  };

  const handleAddIngredient = async () => {
    if (!selectedIngredient || !ingredientQty) return;
    const qty = parseFloat(ingredientQty);
    if (isNaN(qty) || qty <= 0) return;
    await addIngredient(product.id, selectedIngredient, qty, ingredientUnit);
    setSelectedIngredient(null);
    setIngredientQty('1');
    setIngredientUnit('pcs');
    setShowAddIngredient(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scrollRef} style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <ProductForm
        initial={product}
        onSubmit={handleUpdate}
        onCancel={() => router.replace('/(app)/inventory')}
        showRecipe={false}
      />

      {isDrink && (
        <View style={[styles.recipeSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.recipeTitle, { color: colors.text }]}>📋 Recipe</Text>

          {recipeItems.length > 0 && (
            <View style={[styles.servingsBox, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
              <Text style={[styles.servingsLabel, { color: colors.primary }]}>Produces</Text>
              <Text style={[styles.servingsCount, { color: colors.primary }]}>
                {Math.min(...recipeItems.map(item => {
                  const ing = products.find(p => p.id === item.ingredient_id);
                  if (!ing || ing.stock_quantity <= 0) return 0;
                  return Math.floor(ing.stock_quantity / item.quantity);
                }))} servings
              </Text>
            </View>
          )}
          {recipeItems.length === 0 && (
            <Text style={[styles.noRecipe, { color: colors.textSecondary }]}>No ingredients set</Text>
          )}
          {recipeItems.map(item => {
            const ingProduct = products.find(p => p.id === item.ingredient_id);
            const isMissing = !item.ingredient_name;
            return (
              <View key={item.id} style={[styles.ingredientRow, isMissing && { opacity: 0.6 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ingredientName, { color: isMissing ? colors.danger : colors.text }]}>
                    {isMissing ? `[Deleted] Ingredient #${item.ingredient_id}` : item.ingredient_name}
                  </Text>
                  <Text style={[styles.ingredientQty, { color: colors.textSecondary }]}>
                    {item.quantity} {item.measurement || ingProduct?.stock_unit || ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(product.id, item.ingredient_id)}>
                  <Text style={[styles.removeIngredient, { color: colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity
            style={[styles.addIngredientBtn, { borderColor: colors.border }]}
            onPress={() => setShowAddIngredient(!showAddIngredient)}
          >
            <Text style={[styles.addIngredientText, { color: colors.primary }]}>
              {showAddIngredient ? 'Cancel' : '+ Add Ingredient'}
            </Text>
          </TouchableOpacity>

          {showAddIngredient && (
            <View style={styles.addIngredientForm}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Select Ingredient</Text>
              <FlatList
                data={otherProducts}
                keyExtractor={item => String(item.id)}
                style={styles.ingredientList}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.ingredientOption, { backgroundColor: colors.surface, borderColor: colors.border }, selectedIngredient === item.id && { borderColor: colors.primary }]}
                    onPress={() => setSelectedIngredient(item.id)}
                  >
                    <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.optionPrice, { color: colors.textSecondary }]}>{formatCurrency(item.price)}</Text>
                  </TouchableOpacity>
                )}
              />
              {selectedIngredient && (
                <View style={styles.qtyRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Quantity</Text>
                  <TextInput
                    style={[styles.qtyInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={ingredientQty}
                    onChangeText={setIngredientQty}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.disabled}
                  />
                  <TouchableOpacity
                    style={[styles.unitPickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowIngredientUnitModal(true)}
                  >
                    <Text style={[styles.unitPickerText, { color: colors.text }]}>
                      Unit: <Text style={{ fontWeight: '700' }}>{ingredientUnit}</Text>
                    </Text>
                    <Text style={[styles.unitPickerChevron, { color: colors.primary }]}>▼</Text>
                  </TouchableOpacity>
                  <Button title="Add to Recipe" onPress={handleAddIngredient} style={styles.addBtn} />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <Modal visible={showIngredientUnitModal} transparent animationType="fade" onRequestClose={() => setShowIngredientUnitModal(false)} statusBarTranslucent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowIngredientUnitModal(false)}>
          <View style={[styles.unitModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.unitModalTitle, { color: colors.text }]}>Select Unit</Text>
            <View style={styles.unitGrid}>
              {['pcs', 'kg', 'g', 'L', 'mL', 'oz', 'lb', 'cup', 'tbsp', 'tsp'].map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitOption, { borderColor: colors.border, backgroundColor: colors.background }, ingredientUnit === unit && { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                  onPress={() => { setIngredientUnit(unit); setShowIngredientUnitModal(false); }}
                >
                  <Text style={[styles.unitOptionText, { color: ingredientUnit === unit ? colors.primary : colors.text }]}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {isAdmin() && (
        <Button title="Delete Product" variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recipeSection: {
    borderTopWidth: 1,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  recipeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  noRecipe: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  ingredientName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  ingredientQty: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  removeIngredient: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  ingredientStock: {
    fontSize: FONT_SIZES.xs,
    marginRight: SPACING.sm,
  },
  servingsBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  servingsLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  servingsCount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  addIngredientBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  addIngredientText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  addIngredientForm: {
    marginTop: SPACING.sm,
  },
  formLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  ingredientList: {
    maxHeight: 160,
    marginBottom: SPACING.sm,
  },
  ingredientOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  optionName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: FONT_SIZES.xs,
  },
  qtyRow: {
    marginBottom: SPACING.sm,
  },
  qtyInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  addBtn: {
    marginTop: SPACING.xs,
  },
  unitPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  unitPickerText: {
    fontSize: FONT_SIZES.sm,
  },
  unitPickerChevron: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  unitModalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: SPACING.md,
  },
  unitModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
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
  unitOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  deleteBtn: {
    marginTop: 16,
    marginBottom: 24,
  },
});
