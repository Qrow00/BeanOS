import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useUserStore } from '../../../src/store/userStore';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';

export default function NewUserScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { addUser, isLoading } = useUserStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    await addUser({
      username: username.trim(),
      password_hash: password,
      role,
      display_name: displayName.trim() || username.trim(),
    });
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Input label="Username" value={username} onChangeText={setUsername} placeholder="Enter username" autoCapitalize="none" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
      <Input label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Optional display name" />

      <View style={styles.roleRow}>
        <Button
          title="User"
          variant={role === 'user' ? 'primary' : 'outline'}
          onPress={() => setRole('user')}
          style={styles.roleBtn}
        />
        <Button
          title="Admin"
          variant={role === 'admin' ? 'primary' : 'outline'}
          onPress={() => setRole('admin')}
          style={styles.roleBtn}
        />
      </View>

      <Button
        title="Add User"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!username.trim() || !password.trim()}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  roleBtn: {
    flex: 1,
  },
  submitBtn: {
    marginBottom: 24,
  },
});
