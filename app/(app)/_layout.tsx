import { useEffect } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import ThemeExpandOverlay from '../../src/components/ui/ThemeExpandOverlay';

export default function AppLayout() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const themeMode = useThemeStore(s => s.mode);
  const themeOverlay = useThemeStore(s => s.themeOverlay);
  const setThemeOverlay = useThemeStore(s => s.setThemeOverlay);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setButtonStyleAsync(themeMode === 'dark' ? 'light' : 'dark');
    }
  }, [themeMode]);

  if (!isAuthenticated) return null;

  return (
    <View style={{ flex: 1 }}>
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
            height: isLandscape ? 64 : 80,
            paddingBottom: isLandscape ? 4 : 8,
            paddingTop: isLandscape ? 6 : 12,
            elevation: isLandscape ? 4 : 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: isLandscape ? 11 : 14,
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
      {themeOverlay && (
        <ThemeExpandOverlay
          originX={themeOverlay.originX}
          originY={themeOverlay.originY}
          overlayBg={themeOverlay.overlayBg}
          newBg={themeOverlay.newBg}
          onComplete={() => setThemeOverlay(null)}
        />
      )}
    </View>
  );
}
