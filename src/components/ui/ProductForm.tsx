import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import type { Product, ProductInput } from '../../types/database';

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !price) return;
    onSubmit({
      name: name.trim(),
      price: parseFloat(price),
      stock_quantity: parseInt(stock, 10) || 0,
      stock_unit: initial?.stock_unit || 'pcs',
      category: category.trim() || 'General',
      barcode: barcode.trim() || null,
      image_uri: imageUri || null,
      description: null,
      item_id: '',
    });
  };

  return (
    <View style={styles.container}>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Product Name" placeholderTextColor={colors.disabled} value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Price" placeholderTextColor={colors.disabled} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Stock Quantity" placeholderTextColor={colors.disabled} value={stock} onChangeText={setStock} keyboardType="number-pad" />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Category (optional)" placeholderTextColor={colors.disabled} value={category} onChangeText={setCategory} />
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
});
