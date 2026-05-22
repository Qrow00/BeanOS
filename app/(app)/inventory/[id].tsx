import { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import { useAuthStore } from '../../../src/store/authStore';
import { getDatabase } from '../../../src/database/connection';
import ProductForm from '../../../src/components/inventory/ProductForm';
import Button from '../../../src/components/ui/Button';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const { products, updateProduct, deleteProduct, forceDeleteProduct, isLoading } = useProductStore();
  const { isAdmin } = useAuthStore();
  const product = products.find(p => p.id === Number(id));

  useEffect(() => {
    if (!product) router.back();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ProductForm
        initial={product}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
      />
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
  deleteBtn: {
    marginTop: 16,
    marginBottom: 24,
  },
});
