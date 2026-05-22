import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  const otherProducts = products.filter(p => p.id !== Number(id) && p.stock_quantity > 0);

  useEffect(() => {
    if (!product) router.back();
    else if (isDrink) fetchRecipe(product.id);
  }, [product]);

  if (!product) return null;

  const handleUpdate = async (data: any) => {
    await updateProduct(product.id, data);
    router.back();
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
            router.back();
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
                    router.back();
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
    await addIngredient(product.id, selectedIngredient, qty);
    setSelectedIngredient(null);
    setIngredientQty('1');
    setShowAddIngredient(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProductForm
        initial={product}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
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
            return (
              <View key={item.id} style={styles.ingredientRow}>
                <Text style={[styles.ingredientName, { color: colors.text }]}>
                  {item.ingredient_name}
                </Text>
                <Text style={[styles.ingredientQty, { color: colors.textSecondary }]}>
                  x{item.quantity} {ingProduct?.stock_unit || ''}
                </Text>
                <Text style={[styles.ingredientStock, { color: colors.textSecondary }]}>
                  (stock: {ingProduct?.stock_quantity ?? 0} {ingProduct?.stock_unit || ''})
                </Text>
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
                  <View style={styles.qtyInputRow}>
                    <TouchableOpacity onPress={() => setIngredientQty(q => Math.max(0.5, parseFloat(q) - 0.5).toString())} style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.qtyBtnText, { color: colors.text }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.qtyValue, { color: colors.text }]}>{ingredientQty}</Text>
                    <TouchableOpacity onPress={() => setIngredientQty(q => (parseFloat(q) + 0.5).toString())} style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.qtyBtnText, { color: colors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Button title="Add to Recipe" onPress={handleAddIngredient} style={styles.addBtn} />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {isAdmin() && (
        <Button title="Delete Product" variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
      )}
    </View>
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
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  addBtn: {
    marginTop: SPACING.xs,
  },
  deleteBtn: {
    marginTop: 16,
    marginBottom: 24,
  },
});
