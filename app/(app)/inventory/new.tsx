import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../src/store/themeStore';
import { useProductStore } from '../../../src/store/productStore';
import ProductForm from '../../../src/components/inventory/ProductForm';

export default function NewProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const { addProduct, isLoading } = useProductStore();

  const handleSubmit = async (data: any) => {
    await addProduct(data);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ProductForm onSubmit={handleSubmit} onCancel={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
