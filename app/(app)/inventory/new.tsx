import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import { useRecipeStore } from '../../../src/store/recipeStore';
import ProductForm from '../../../src/components/inventory/ProductForm';
import type { RecipeEntry } from '../../../src/components/inventory/ProductForm';

export default function NewProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const { addProduct } = useProductStore();
  const { addIngredient } = useRecipeStore();
  const recipeRef = useRef<RecipeEntry[]>([]);

  const handleRecipeChange = (items: RecipeEntry[]) => {
    recipeRef.current = items;
  };

  const handleSubmit = async (data: any) => {
    const id = await addProduct(data);
    if (id && recipeRef.current.length > 0) {
      for (const r of recipeRef.current) {
        await addIngredient(id, r.ingredientId, r.quantity);
      }
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ProductForm onSubmit={handleSubmit} onCancel={() => router.back()} onRecipeChange={handleRecipeChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
