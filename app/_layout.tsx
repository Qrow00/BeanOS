import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { getDatabase } from '../src/database/connection';
import { useThemeStore } from '../src/store/themeStore';
import { useSettingsStore } from '../src/store/settingsStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const colors = useThemeStore(s => s.colors);
  const currencySymbol = useSettingsStore(s => s.currencySymbol);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        await useThemeStore.getState().loadThemeFromDb(db);
        await useSettingsStore.getState().loadSettings(db);
      } catch (e) {
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors?.background || '#F8FAFC' }]}>
        <ActivityIndicator size="large" color={colors?.primary || '#2563EB'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#F8FAFC' }]}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors?.background || '#F8FAFC' } }} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
});
