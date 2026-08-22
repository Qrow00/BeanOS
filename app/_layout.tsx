import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import { getDatabase } from '../src/database/connection';
import { useThemeStore } from '../src/store/themeStore';
import { useSettingsStore } from '../src/store/settingsStore';
import AmbientBackground from '../src/components/ui/glass/AmbientBackground';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const colors = useThemeStore(s => s.colors);
  const currencySymbol = useSettingsStore(s => s.currencySymbol);

  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

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
      <View style={styles.loading}>
        <AmbientBackground />
        <ActivityIndicator size="large" color={colors?.primary || '#8B5CF6'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
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
