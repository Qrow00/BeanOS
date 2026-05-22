import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';

export default function AppLayout() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingTop: insets.top, backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 110,
          paddingBottom: 18,
          paddingTop: 12,
          marginBottom: 20,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="pos/index"
        options={{
          title: 'Point of Sale',
          
          tabBarLabel: 'POS',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pos/history"
        options={{
          title: 'Sales History',
          
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="loyalty" options={{ href: null }} />
      <Tabs.Screen name="brand-logo" options={{ href: null }} />
      <Tabs.Screen name="payment-qr" options={{ href: null }} />
      <Tabs.Screen name="coupons/index" options={{ href: null }} />
      <Tabs.Screen name="coupons/new" options={{ href: null }} />
      <Tabs.Screen name="inventory/new" options={{ href: null }} />
      <Tabs.Screen name="inventory/[id]" options={{ href: null }} />
      <Tabs.Screen name="inventory/stocks" options={{ href: null }} />
      <Tabs.Screen name="finance/new" options={{ href: null }} />
      <Tabs.Screen name="users/new" options={{ href: null }} />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: 'Inventory',
          
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance/index"
        options={{
          title: 'Finance',
          
          tabBarLabel: 'Finance',
          href: isAdmin() ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users/index"
        options={{
          title: 'Users',
          
          tabBarLabel: 'Users',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
