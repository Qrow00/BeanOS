import { useEffect } from 'react';
import { View, useWindowDimensions, Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import ThemeExpandOverlay from '../../src/components/ui/ThemeExpandOverlay';

export default function AppLayout() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);
  const themeOverlay = useThemeStore(s => s.themeOverlay);
  const setThemeOverlay = useThemeStore(s => s.setThemeOverlay);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const compact = width < 500;
  const floatingWidth = Math.min(width - 32, 560);
  const barHeight = compact ? 62 : 68;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setButtonStyleAsync(mode === 'dark' ? 'light' : 'dark');
    }
  }, [mode]);

  if (!isAuthenticated) return null;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { paddingTop: insets.top, backgroundColor: 'transparent' },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            position: 'absolute',
            bottom: Math.max(insets.bottom, 10),
            left: (width - floatingWidth) / 2,
            right: (width - floatingWidth) / 2,
            height: barHeight,
            paddingBottom: 6,
            paddingTop: 6,
            borderRadius: 26,
            borderTopWidth: 1,
            borderTopColor: colors.glassStroke,
            backgroundColor: 'transparent',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: mode === 'dark' ? 0.45 : 0.12,
            shadowRadius: 20,
          },
          tabBarBackground: () => (
            <View collapsable={false} style={[styles.tabGlass, { backgroundColor: colors.glassFillStrong }]}>
              <BlurView
                intensity={mode === 'dark' ? 50 : 60}
                tint={mode === 'dark' ? 'dark' : 'light'}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.3,
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
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pos/history"
          options={{
            title: 'Sales History',

            tabBarLabel: 'History',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="brand-logo" options={{ href: null }} />
        <Tabs.Screen name="payment-qr" options={{ href: null }} />
        <Tabs.Screen name="coupons/index" options={{ href: null }} />
        <Tabs.Screen name="coupons/new" options={{ href: null }} />
        <Tabs.Screen name="inventory/new" options={{ href: null }} />
        <Tabs.Screen name="inventory/[id]" options={{ href: null }} />
        <Tabs.Screen name="finance/new" options={{ href: null }} />
        <Tabs.Screen name="users/new" options={{ href: null }} />
        <Tabs.Screen name="customers/new" options={{ href: null }} />
        <Tabs.Screen name="customers/[id]" options={{ href: null }} />
        <Tabs.Screen
          name="customers/index"
          options={{
            title: 'Members',

            tabBarLabel: 'Members',
            href: isAdmin() ? undefined : null,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'card' : 'card-outline'} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory/index"
          options={{
            title: 'Inventory',

            tabBarLabel: 'Inventory',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'cube' : 'cube-outline'} size={26} color={color} />
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
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users/index"
          options={{
            title: 'Users',

            tabBarLabel: 'Users',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',

            tabBarLabel: 'Settings',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={26} color={color} />
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

const styles = StyleSheet.create({
  tabGlass: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
  },
});
