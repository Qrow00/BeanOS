import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useUserStore } from '../../../src/store/userStore';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';

export default function UsersScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { users, fetchUsers, deleteUser, isLoading } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (id: number, username: string) => {
    if (username === 'admin') {
      Alert.alert('Cannot Delete', 'The default admin account cannot be deleted');
      return;
    }
    Alert.alert('Delete User', `Delete user "${username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteUser(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
              <Text style={[styles.displayName, { color: colors.textSecondary }]}>{item.display_name}</Text>
              <View style={[styles.roleBadge, item.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
                <Text style={[styles.roleText, { color: item.role === 'admin' ? colors.primary : colors.success }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
            </View>
            {item.username !== 'admin' && (
              <TouchableOpacity onPress={() => handleDelete(item.id, item.username)}>
                <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={fetchUsers}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(app)/users/new')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  list: {
    paddingBottom: 80,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  displayName: {
    fontSize: FONT_SIZES.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: '#EEF2FF',
  },
  userBadge: {
    backgroundColor: '#F0FDF4',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteText: {
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
