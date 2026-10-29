import { useCallback, useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { getDatabase } from '../src/database/connection';
import { useThemeStore } from '../src/store/themeStore';
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
  const mode = useThemeStore(s => s.mode);
  const currencySymbol = useSettingsStore(s => s.currencySymbol);
  const locale = useSettingsStore(s => s.locale);
  const splashFade = useRef(new Animated.Value(1)).current;
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
    applyLocale(locale);
  }, [locale]);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        await useThemeStore.getState().loadThemeFromDb(db);
        await useSettingsStore.getState().loadSettings(db);
        applyLocale(useSettingsStore.getState().locale);
      } catch (e) {
      } finally {
        setReady(true);
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
      style={[styles.container, { backgroundColor: mode === 'dark' ? '#17110C' : '#FAF7F2' }]}
    >
      {ready && (
        <>
          <AmbientBackground />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 220,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </>
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
  },
});
