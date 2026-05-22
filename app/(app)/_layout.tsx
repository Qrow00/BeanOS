import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';

export default function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
      <Stack.Screen name="inventory/index" options={{ title: 'Inventory' }} />
      <Stack.Screen name="inventory/new" options={{ title: 'Add Product' }} />
      <Stack.Screen name="inventory/[id]" options={{ title: 'Edit Product' }} />
      <Stack.Screen name="pos/index" options={{ title: 'Point of Sale', headerShown: false }} />
      <Stack.Screen name="pos/history" options={{ title: 'Sales History' }} />
      <Stack.Screen name="coupons/index" options={{ title: 'Coupons' }} />
      <Stack.Screen name="coupons/new" options={{ title: 'Add Coupon' }} />
      <Stack.Screen name="users/index" options={{ title: 'User Management' }} />
      <Stack.Screen name="users/new" options={{ title: 'Add User' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="finance/index" options={{ title: 'Finance', headerShown: false }} />
      <Stack.Screen name="finance/new" options={{ title: 'New Transaction', headerShown: false }} />
      <Stack.Screen name="loyalty" options={{ title: 'Loyalty Card', headerShown: false }} />
    </Stack>
  );
}
