import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { ThemeColors } from '../../store/themeStore';
import type { User } from '../../types/database';
import { SPACING, FONT_SIZES } from '../../utils/constants';

interface UserProfileCardProps {
  user: User;
  onSelect: (user: User) => void;
  colors: ThemeColors;
}

export default function UserProfileCard({ user, onSelect, colors }: UserProfileCardProps) {
  const initial = user.display_name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onSelect(user)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: user.role === 'admin' ? colors.primary : colors.success }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={[styles.displayName, { color: colors.text }]}>{user.display_name}</Text>
      <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>
      <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? colors.primarySurface : colors.success + '20' }]}>
        <Text style={[styles.roleText, { color: user.role === 'admin' ? colors.primary : colors.success }]}>
          {user.role === 'admin' ? 'Admin' : 'Cashier'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  displayName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  username: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
