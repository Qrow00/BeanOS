import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES, APP_NAME } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import Logo from '../../src/components/ui/Logo';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const colors = useThemeStore(s => s.colors);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(app)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    await login(username.trim(), password);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Logo size="xlarge" />
        </View>

        <Text style={[styles.appName, { color: colors.primary }]}>{APP_NAME}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>

        <View style={styles.form}>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />

          {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!username.trim() || !password.trim()}
          />
        </View>

        <View style={[styles.credentials, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.credTitle, { color: colors.textSecondary }]}>Demo Credentials</Text>
          <Text style={[styles.credText, { color: colors.textSecondary }]}>Admin: admin / admin123</Text>
          <Text style={[styles.credText, { color: colors.textSecondary }]}>User: user / user123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  error: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  credentials: {
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  credTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  credText: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
  },
});
