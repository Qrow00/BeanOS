import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProductStore } from '../../../src/store/productStore';
import ProductForm from '../../../src/components/inventory/ProductForm';

export default function NewProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addProduct } = useProductStore();

  const handleSubmit = async (data: any) => {
    await addProduct({ ...data, is_ingredient: 0 });
    router.replace('/(app)/inventory');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProductForm onSubmit={handleSubmit} onCancel={() => router.replace('/(app)/inventory')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
