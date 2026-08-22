import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '../../store/themeStore';
import type { User } from '../../types/database';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';

interface UserProfileCardProps {
  user: User;
  onSelect: (user: User) => void;
  colors: ThemeColors;
}

export default function UserProfileCard({ user, onSelect, colors }: UserProfileCardProps) {
  const initial = user.display_name.charAt(0).toUpperCase();
  const accent: [string, string] = user.role === 'admin' ? [colors.primaryGradientFrom, colors.primaryGradientTo] : [colors.success, colors.secondaryAccent];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}
      onPress={() => onSelect(user)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarRing}>
        <LinearGradient colors={accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>
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
    borderRadius: RADII.md,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarRing: {
    padding: 2,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: RADII.full,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
