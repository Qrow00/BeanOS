import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, FONT_SIZES, RADII, COLOR_PRESETS, getProductIconColor } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { generateItemId } from '../../utils/helpers';
import type { Product, ProductInput } from '../../types/database';
import GradientButton from '../ui/glass/GradientButton';

const CATEGORIES = ['General', 'Pastry', 'Drink', 'Coffee', 'Tea', 'Frappe', 'Rice Meal', 'Pasta', 'Snacks', 'Add-on', 'Merchandise'];
const STOCK_UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'oz', 'lb'];

interface ProductFormProps {
  initial?: Product;
  onSubmit: (data: ProductInput) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function ProductForm({ initial, onSubmit, onCancel, submitLabel = 'Save' }: ProductFormProps) {
  const colors = useThemeStore(s => s.colors);
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [stock, setStock] = useState(initial ? String(initial.stock_quantity) : '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [barcode, setBarcode] = useState(initial?.barcode ?? '');
  const [imageUri, setImageUri] = useState(initial?.image_uri ?? '');
  const [stockUnit, setStockUnit] = useState(initial?.stock_unit ?? 'pcs');
  const [iconColor, setIconColor] = useState(initial?.icon_color ?? '');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
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
      icon_color: iconColor || null,
      item_id: initial?.item_id || generateItemId(),
      is_ingredient: 0,
      initial_stock: parseInt(stock, 10) || 0,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
        placeholder="Product Name" placeholderTextColor={colors.disabled} value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
        placeholder="Price" placeholderTextColor={colors.disabled} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => setShowUnitModal(true)}
      >
        <Text style={[{ color: colors.text, fontSize: FONT_SIZES.sm, flex: 1 }]}>
          Unit: <Text style={{ fontWeight: '700' }}>{stockUnit}</Text>
        </Text>
        <Text style={[{ color: colors.primary, fontSize: FONT_SIZES.xs }]}>Change</Text>
      </TouchableOpacity>
      <TextInput style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
        placeholder="Measurement by unit" placeholderTextColor={colors.disabled} value={stock} onChangeText={setStock} keyboardType="number-pad" />
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke, justifyContent: 'center' }]}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={[!category ? { color: colors.disabled } : { color: colors.text }, { fontSize: FONT_SIZES.sm }]}>
          {category || 'Select category'}
        </Text>
      </TouchableOpacity>

      <TextInput style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
        placeholder="Barcode (optional)" placeholderTextColor={colors.disabled} value={barcode} onChangeText={setBarcode} />

      <TouchableOpacity style={[styles.imageBtn, { borderColor: colors.glassStroke, backgroundColor: colors.glassFill }]} onPress={pickImage}>
        <Text style={[styles.imageBtnText, { color: colors.primary }]}>
          {imageUri ? 'Change Image' : 'Add Image'}
        </Text>
      </TouchableOpacity>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Icon Color</Text>
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[styles.colorSwatch, { backgroundColor: getProductIconColor(iconColor || null, category), borderColor: colors.glassStroke }]}
          onPress={() => setIconColor('')}
        >
          <View style={[styles.colorSwatchInner, { backgroundColor: getProductIconColor(iconColor || null, category) }]} />
        </TouchableOpacity>
        {COLOR_PRESETS.map(color => (
          <TouchableOpacity
            key={color}
            style={[styles.colorOption, { backgroundColor: color }, iconColor === color && styles.colorOptionSelected]}
            onPress={() => setIconColor(color)}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]} onPress={onCancel}>
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <GradientButton title={submitLabel} onPress={handleSubmit} height={48} style={{ flex: 2 }} />
      </View>

      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={() => setShowCategoryModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryOption, { borderBottomColor: colors.glassStroke }, category === cat && { backgroundColor: colors.primarySurface }]}
                onPress={() => { setCategory(cat); setShowCategoryModal(false); }}
              >
                <Text style={[styles.categoryOptionText, { color: colors.text }, category === cat && { color: colors.primary, fontWeight: '700' }]}>{cat}</Text>
                {category === cat && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showUnitModal} transparent animationType="fade" onRequestClose={() => setShowUnitModal(false)} statusBarTranslucent>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowUnitModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Stock Unit</Text>
            <View style={styles.unitGrid}>
              {STOCK_UNITS.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitOption, { borderColor: colors.glassStroke, backgroundColor: colors.glassFill }, stockUnit === unit && { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                  onPress={() => { setStockUnit(unit); setShowUnitModal(false); }}
                >
                  <Text style={[styles.unitOptionText, { color: stockUnit === unit ? colors.primary : colors.text }]}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
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
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.sm,
  },
  imageBtn: {
    borderWidth: 1,
    borderRadius: RADII.sm,
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
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
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
    borderRadius: RADII.xl,
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
  colorLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  colorSwatchInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
