import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { getDatabase } from '../src/database/connection';
import { useThemeStore, hydrateThemeFromCache } from '../src/store/themeStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { applyLocale } from '../src/i18n';
import AmbientBackground from '../src/components/ui/glass/AmbientBackground';
import BeanOSSplash from '../src/components/intro/BeanOSSplash';

const introFlag = globalThis as typeof globalThis & { __beanIntroPlayed?: boolean };
const wasIntroPlayed = () => introFlag.__beanIntroPlayed === true;

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(wasIntroPlayed);
  const [overlayGone, setOverlayGone] = useState(wasIntroPlayed);
  const { colors, mode } = useThemeStore();
  const uiScale = useSettingsStore(s => s.uiScale);
  const currencySymbol = useSettingsStore(s => s.currencySymbol);
  const locale = useSettingsStore(s => s.locale);
  const splashFade = useRef(new Animated.Value(1)).current;
  const navigationTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: 'transparent', card: 'transparent' },
    };
  }, [mode]);
  const finishIntro = useCallback(() => {
    introFlag.__beanIntroPlayed = true;
    setIntroDone(true);
  }, []);

  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        html, body, #root, .root {
          background-color: ${mode === 'dark' ? '#17110C' : '#F2EDE4'} !important;
          margin: 0 !important;
          padding: 0 !important;
          height: 100vh !important;
          width: 100vw !important;
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, [mode]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.zoom = `${uiScale}`;
    }
  }, [uiScale]);


  useEffect(() => {
    (async () => {
      await hydrateThemeFromCache();
      setReady(true);
      try {
        const db = await getDatabase();
        await useThemeStore.getState().loadThemeFromDb(db);
        await useSettingsStore.getState().loadSettings(db);
        applyLocale(useSettingsStore.getState().locale);
      } catch (e) {
      }
    })();
  }, []);

  useEffect(() => {
    if (!introDone || overlayGone) return;
    Animated.timing(splashFade, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setOverlayGone(true);
    });
  }, [introDone, overlayGone, splashFade]);

  return (
    <View
      style={[styles.container, { backgroundColor: '#17110C' }]}
    >
      <AmbientBackground />
      {ready && (
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 220,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </ThemeProvider>
      )}
      {!overlayGone && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: splashFade }]}>
          <BeanOSSplash
            onFinish={finishIntro}
            version={`v${Constants.expoConfig?.version ?? '1.0'}`}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Force web root to fill the viewport
    ...Platform.select({
      web: {
        height: '100vh' as any,
        width: '100vw' as any,
      },
    }),
  },
});
