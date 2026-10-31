import { useEffect } from 'react';
import { View, useWindowDimensions, Platform, StyleSheet, Easing } from 'react-native';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useTranslation } from '../../src/i18n';
import ThemeExpandOverlay from '../../src/components/ui/ThemeExpandOverlay';
import AnimatedTabIcon from '../../src/components/ui/AnimatedTabIcon';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);
  const themeOverlay = useThemeStore(s => s.themeOverlay);
  const setThemeOverlay = useThemeStore(s => s.setThemeOverlay);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

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
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          transitionSpec: {
            animation: 'timing',
            config: { duration: 320, easing: Easing.bezier(0.2, 0, 0, 1) },
          },
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
                experimentalBlurMethod={Platform.OS === 'android' ? 'none' : undefined}
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
            title: t('pos_title'),

            tabBarLabel: t('tab_pos'),
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="cart" outlineName="cart-outline" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pos/history"
          options={{
            title: t('history_title'),

            tabBarLabel: t('tab_history'),
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="receipt" outlineName="receipt-outline" focused={focused} color={color} />
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
            title: t('customers_title'),

            tabBarLabel: t('tab_members'),
            href: null,
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="card" outlineName="card-outline" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory/index"
          options={{
            title: t('inventory_title'),

            tabBarLabel: t('tab_inventory'),
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="cube" outlineName="cube-outline" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="finance/index"
          options={{
            title: t('finance_title'),

            tabBarLabel: t('tab_finance'),
            href: null,
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="wallet" outlineName="wallet-outline" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users/index"
          options={{
            title: t('users_title'),

            tabBarLabel: t('tab_users'),
            href: null,
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="people" outlineName="people-outline" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('settings_title'),

            tabBarLabel: t('tab_settings'),
            href: null,
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="settings" outlineName="settings-outline" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t('more_heading'),

            tabBarLabel: t('tab_more'),
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="ellipsis-horizontal" outlineName="ellipsis-horizontal-outline" focused={focused} color={color} />
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

