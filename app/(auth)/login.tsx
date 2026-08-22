import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES, APP_NAME, RADII, BREAKPOINTS } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { getDatabase } from '../../src/database/connection';
import * as usersRepo from '../../src/database/users';
import { canUserUseBiometric, getAuthMethodLabel, promptBiometric } from '../../src/services/biometrics';
import type { User } from '../../src/types/database';
import Logo from '../../src/components/ui/Logo';
import UserProfileCard from '../../src/components/auth/UserProfileCard';
import PinNumpad from '../../src/components/auth/PinNumpad';
import GlassPanel from '../../src/components/ui/glass/GlassPanel';

export default function LoginScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometrics');
  const { login, loginWithBiometric, isLoading, error, isAuthenticated } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const padding = SPACING.lg * 2;
  const gap = SPACING.xs * 2;
  const gridColumns = width > 800 ? 4 : width > 500 ? 3 : 2;
  const cellWidth = Math.floor((Math.min(width, BREAKPOINTS.wide) - padding - gap * (gridColumns - 1)) / gridColumns);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(app)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        const all = await usersRepo.getAllUsers(db);
        setUsers(all);
      } catch {}
    })();
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handlePinComplete = (pin: string) => {
    if (!selectedUser) return;
    login(selectedUser.id, pin);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  useEffect(() => {
    if (!selectedUser) return;
    let cancelled = false;
    (async () => {
      const label = await getAuthMethodLabel();
      const ok = await canUserUseBiometric(selectedUser.id);
      if (!cancelled) {
        setBiometricLabel(label);
        setBiometricReady(ok);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedUser]);

  const handleBiometric = async () => {
    if (!selectedUser || isLoading) return;
    const ok = await promptBiometric(`Log in as ${selectedUser.display_name}`);
    if (ok) loginWithBiometric(selectedUser.id);
  };

  if (selectedUser) {
    return (
      <View style={styles.container}>
        <View style={styles.pinWrapper}>
          <PinNumpad
            user={selectedUser}
            onPinComplete={handlePinComplete}
            onBack={handleBack}
            colors={colors}
            isLoading={isLoading}
            error={error}
            onBiometric={biometricReady ? handleBiometric : undefined}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.selectWrapper}>
        <View style={styles.header}>
          <Logo size={170} />
        </View>

        <Text style={[styles.appName, { color: colors.primary }]}>{APP_NAME}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select User</Text>

        <GlassPanel radius={RADII.xl} style={styles.gridPanel}>
          <View style={styles.grid}>
            {users.map(user => (
              <View key={user.id} style={[styles.gridCell, { width: cellWidth }]}>
                <UserProfileCard
                  user={user}
                  onSelect={handleSelectUser}
                  colors={colors}
                />
              </View>
            ))}
          </View>

          {users.length === 0 && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: SPACING.xl }} />
          )}
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  pinWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontWeight: '600',
  },
  gridPanel: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: BREAKPOINTS.wide - 48,
    padding: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  gridCell: {
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
});
