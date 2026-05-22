import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES, APP_NAME } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { getDatabase } from '../../src/database/connection';
import * as usersRepo from '../../src/database/users';
import type { User } from '../../src/types/database';
import Logo from '../../src/components/ui/Logo';
import UserProfileCard from '../../src/components/auth/UserProfileCard';
import PinNumpad from '../../src/components/auth/PinNumpad';

export default function LoginScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const router = useRouter();

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

  if (selectedUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.pinWrapper}>
          <PinNumpad
            user={selectedUser}
            onPinComplete={handlePinComplete}
            onBack={handleBack}
            colors={colors}
            isLoading={isLoading}
            error={error}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.selectWrapper}>
        <View style={styles.header}>
          <Logo size={170} />
        </View>

        <Text style={[styles.appName, { color: colors.primary }]}>{APP_NAME}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select User</Text>

        <View style={styles.grid}>
          {users.map(user => (
            <View key={user.id} style={styles.gridCell}>
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
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  gridCell: {
    width: '50%',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
});
