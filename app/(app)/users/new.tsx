import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useUserStore } from '../../../src/store/userStore';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';

export default function NewUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const colors = useThemeStore(s => s.colors);
  const { addUser, updateUser, fetchUsers, isLoading } = useUserStore();
  const isEditing = !!params.id;

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    if (!params.id) return;
    fetchUsers().then(() => {
      const user = useUserStore.getState().users.find(u => String(u.id) === params.id);
      if (user) {
        setUsername(user.username);
        setDisplayName(user.display_name);
        setRole(user.role as 'user' | 'admin');
      }
    });
  }, [params.id]);

  const handleSubmit = async () => {
    if (!username.trim()) return;
    if (!isEditing && pin.length !== 4) return;

    if (isEditing && params.id) {
      await updateUser(Number(params.id), {
        username: username.trim(),
        role,
        display_name: displayName.trim() || username.trim(),
        pin_hash: pin || undefined,
      });
    } else {
      await addUser({
        username: username.trim(),
        pin_hash: pin,
        role,
        display_name: displayName.trim() || username.trim(),
      });
    }
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Users</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{isEditing ? 'Edit User' : 'New User'}</Text>
        <View style={{ width: 80 }} />
      </View>
      <Input label="Username" value={username} onChangeText={setUsername} placeholder="Enter username" autoCapitalize="none" />
      <Input
        label={isEditing ? "PIN (leave blank to keep current)" : "PIN (4 digits)"}
        value={pin}
        onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
        placeholder={isEditing ? "Leave blank to keep" : "Enter 4-digit PIN"}
        secureTextEntry
        keyboardType="number-pad"
      />
      <Input label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Optional display name" />

      <View style={styles.roleRow}>
        <Button
          title="Cashier"
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
        title={isEditing ? "Save Changes" : "Add User"}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!username.trim() || (!isEditing && pin.length !== 4)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
