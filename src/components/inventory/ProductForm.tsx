import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal, FlatList, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { useProductStore } from '../../store/productStore';
import { formatCurrency, generateItemId } from '../../utils/helpers';
import type { Product, ProductInput } from '../../types/database';

const CATEGORIES = ['General', 'Pastry', 'Drink', 'Coffee', 'Tea', 'Frappe', 'Rice Meal', 'Pasta', 'Snacks', 'Add-on', 'Merchandise'];
const STOCK_UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'oz', 'lb'];

export interface RecipeEntry {
  ingredientId: number;
  name: string;
  quantity: number;
  measurement: string;
}

interface ProductFormProps {
  initial?: Product;
  onSubmit: (data: ProductInput) => void;
  onCancel: () => void;
  onRecipeChange?: (items: RecipeEntry[]) => void;
  showRecipe?: boolean;
  showCategory?: boolean;
  submitLabel?: string;
}

export default function ProductForm({ initial, onSubmit, onCancel, onRecipeChange, showRecipe = true, showCategory = true, submitLabel = 'Save' }: ProductFormProps) {
  const colors = useThemeStore(s => s.colors);
  const { products } = useProductStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [stock, setStock] = useState(initial ? String(initial.stock_quantity) : '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [barcode, setBarcode] = useState(initial?.barcode ?? '');
  const [imageUri, setImageUri] = useState(initial?.image_uri ?? '');
  const [stockUnit, setStockUnit] = useState(initial?.stock_unit ?? 'pcs');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [recipe, setRecipe] = useState<RecipeEntry[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<number | null>(null);
  const [ingredientQty, setIngredientQty] = useState('1');
  const [ingredientUnit, setIngredientUnit] = useState('pcs');
  const [showIngredientUnitModal, setShowIngredientUnitModal] = useState(false);

  const otherProducts = products.filter(p => p.id !== initial?.id);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const updateRecipe = (items: RecipeEntry[]) => {
    setRecipe(items);
    onRecipeChange?.(items);
  };

  const handleSubmit = () => {
    if (!name.trim() || !price) return;
    onSubmit({
      name: name.trim(),
      price: parseFloat(price),
      stock_quantity: parseInt(stock, 10) || 0,
      stock_unit: stockUnit,
      measurement: initial?.measurement || '',
      category: category.trim() || 'General',
      barcode: barcode.trim() || null,
      image_uri: imageUri || null,
      description: null,
      item_id: initial?.item_id || generateItemId(),
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient || !ingredientQty) return;
    const qty = parseFloat(ingredientQty);
    if (isNaN(qty) || qty <= 0) return;
    const prod = products.find(p => p.id === selectedIngredient);
    if (!prod) return;
    const items = [...recipe];
    const existing = items.find(e => e.ingredientId === selectedIngredient);
    if (existing) {
      existing.quantity = qty;
      existing.measurement = ingredientUnit;
    } else {
      items.push({ ingredientId: selectedIngredient, name: prod.name, quantity: qty, measurement: ingredientUnit });
    }
    updateRecipe(items);
    setSelectedIngredient(null);
    setIngredientQty('1');
    setIngredientUnit('pcs');
    setShowAddIngredient(false);
  };

  const removeIngredient = (ingredientId: number) => {
    updateRecipe(recipe.filter(r => r.ingredientId !== ingredientId));
  };

  return (
    <View style={styles.container}>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Product Name" placeholderTextColor={colors.disabled} value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Price" placeholderTextColor={colors.disabled} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => setShowUnitModal(true)}
      >
        <Text style={[{ color: colors.text, fontSize: FONT_SIZES.sm, flex: 1 }]}>
          Unit: <Text style={{ fontWeight: '700' }}>{stockUnit}</Text>
        </Text>
        <Text style={[{ color: colors.primary, fontSize: FONT_SIZES.xs }]}>Change</Text>
      </TouchableOpacity>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Measurement by unit" placeholderTextColor={colors.disabled} value={stock} onChangeText={setStock} keyboardType="number-pad" />
      {showCategory && (
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[!category ? { color: colors.disabled } : { color: colors.text }, { fontSize: FONT_SIZES.sm }]}>
            {category || 'Select category'}
          </Text>
        </TouchableOpacity>
      )}
      {showRecipe && (
        <View style={[styles.recipeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.recipeTitle, { color: colors.text }]}>Recipe Ingredients</Text>
          {recipe.length === 0 ? (
            <Text style={[styles.recipeEmpty, { color: colors.disabled }]}>No ingredients added</Text>
          ) : (
            recipe.map(item => (
              <View key={item.ingredientId} style={[styles.recipeRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.recipeRowText, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.recipeRowQty, { color: colors.textSecondary }]}>{item.quantity} {item.measurement}</Text>
                <TouchableOpacity onPress={() => removeIngredient(item.ingredientId)}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity
            style={[styles.addIngredientBtn, { borderColor: colors.primary }]}
            onPress={() => setShowAddIngredient(true)}
          >
            <Text style={[styles.addIngredientBtnText, { color: colors.primary }]}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Barcode (optional)" placeholderTextColor={colors.disabled} value={barcode} onChangeText={setBarcode} />

      <TouchableOpacity style={[styles.imageBtn, { borderColor: colors.border }]} onPress={pickImage}>
        <Text style={[styles.imageBtnText, { color: colors.primary }]}>
          {imageUri ? 'Change Image' : 'Add Image'}
        </Text>
      </TouchableOpacity>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.background }]} onPress={onCancel}>
          <Text style={[styles.cancelBtnText, { color: colors.danger }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={() => setShowCategoryModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryOption, { borderBottomColor: colors.border }, category === cat && { backgroundColor: colors.primarySurface }]}
                onPress={() => { setCategory(cat); setShowCategoryModal(false); }}
              >
                <Text style={[styles.categoryOptionText, { color: colors.text }, category === cat && { color: colors.primary, fontWeight: '700' }]}>{cat}</Text>
                {category === cat && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showIngredientUnitModal} transparent animationType="fade" onRequestClose={() => setShowIngredientUnitModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowIngredientUnitModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Unit</Text>
            <View style={styles.unitGrid}>
              {STOCK_UNITS.map(unit => (
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

      <Modal visible={showUnitModal} transparent animationType="fade" onRequestClose={() => setShowUnitModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowUnitModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Stock Unit</Text>
            <View style={styles.unitGrid}>
              {STOCK_UNITS.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitOption, { borderColor: colors.border, backgroundColor: colors.background }, stockUnit === unit && { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                  onPress={() => { setStockUnit(unit); setShowUnitModal(false); }}
                >
                  <Text style={[styles.unitOptionText, { color: stockUnit === unit ? colors.primary : colors.text }]}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAddIngredient} transparent animationType="fade" onRequestClose={() => setShowAddIngredient(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowAddIngredient(false)}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} keyboardShouldPersistTaps="handled">
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add Ingredient</Text>
                  {otherProducts.length === 0 ? (
                    <Text style={{ color: colors.disabled, textAlign: 'center', marginVertical: SPACING.md }}>
                      No other products available. Create more products first.
                    </Text>
                  ) : (
                    <>
                      <FlatList
                        data={otherProducts}
                        keyExtractor={item => String(item.id)}
                        style={{ maxHeight: 200 }}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.categoryOption, { borderBottomColor: colors.border }, selectedIngredient === item.id && { backgroundColor: colors.primarySurface }]}
                            onPress={() => setSelectedIngredient(item.id)}
                          >
                            <Text style={[styles.categoryOptionText, { color: colors.text }, selectedIngredient === item.id && { color: colors.primary, fontWeight: '700' }]}>
                              {item.name} ({formatCurrency(item.price)})
                            </Text>
                            {selectedIngredient === item.id && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
                          </TouchableOpacity>
                        )}
                      />
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, marginTop: SPACING.sm }]}
                        placeholder="Quantity" placeholderTextColor={colors.disabled}
                        value={ingredientQty} onChangeText={setIngredientQty}
                        keyboardType="decimal-pad"
                      />
                      <TouchableOpacity
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs }]}
                        onPress={() => setShowIngredientUnitModal(true)}
                      >
                        <Text style={[{ color: colors.text, fontSize: FONT_SIZES.sm, flex: 1 }]}>
                          Unit: <Text style={{ fontWeight: '700' }}>{ingredientUnit}</Text>
                        </Text>
                        <Text style={[{ color: colors.primary, fontSize: FONT_SIZES.xs }]}>Change</Text>
                      </TouchableOpacity>
                      <View style={styles.actions}>
                        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.background }]} onPress={() => setShowAddIngredient(false)}>
                          <Text style={[styles.cancelBtnText, { color: colors.danger }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleAddIngredient}>
                          <Text style={styles.submitBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.sm,
  },
  imageBtn: {
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: 'dashed',
    padding: SPACING.md,
    alignItems: 'center',
  },
  imageBtnText: {
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  recipeSection: {
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.sm,
  },
  recipeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  recipeEmpty: {
    fontSize: FONT_SIZES.sm,
    marginVertical: SPACING.xs,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
  },
  recipeRowText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  recipeRowQty: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.sm,
  },
  addIngredientBtn: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  addIngredientBtnText: {
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
  checkmark: {
    fontSize: FONT_SIZES.md,
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
  unitOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
