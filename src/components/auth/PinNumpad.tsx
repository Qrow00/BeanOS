import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ThemeColors } from '../../store/themeStore';
import type { User } from '../../types/database';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';

interface PinNumpadProps {
  user: User;
  onPinComplete: (pin: string) => void;
  onBack: () => void;
  colors: ThemeColors;
  isLoading: boolean;
  error: string | null;
  onBiometric?: () => void;
}

export default function PinNumpad({ user, onPinComplete, onBack, colors, isLoading, error, onBiometric }: PinNumpadProps) {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    setPin('');
  }, [shakeAnim]);

  useEffect(() => {
    if (error) {
      shake();
    }
  }, [error, shake]);

  const handlePress = (key: string) => {
    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => onPinComplete(next), 100);
    }
  };

  const initial = user.display_name.charAt(0).toUpperCase();

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'],
  ];

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Change User</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: user.role === 'admin' ? colors.primary : colors.success,
                shadowColor: user.role === 'admin' ? colors.glowPrimary : 'transparent',
                shadowOpacity: user.role === 'admin' ? 0.5 : 0,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>{initial}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.text }]}>{user.display_name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? colors.primarySurface : colors.success + '20' }]}>
            <Text style={[styles.roleText, { color: user.role === 'admin' ? colors.primary : colors.success }]}>
              {user.role === 'admin' ? 'Admin' : 'Cashier'}
            </Text>
          </View>
        </View>

        <Text style={[styles.prompt, { color: colors.textSecondary }]}>Enter PIN</Text>

        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke },
                i < pin.length && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            />
          ))}
        </Animated.View>

        {error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        )}

        <View style={styles.numpad}>
          {keys.map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map((key, ki) => (
                key === '' ? (
                  onBiometric ? (
                    <TouchableOpacity
                      key={ki}
                      style={[styles.numpadKey, styles.biometricKey]}
                      onPress={onBiometric}
                      activeOpacity={0.6}
                      disabled={isLoading}
                    >
                      <MaterialIcons name="fingerprint" size={52} color={colors.primary} />
                    </TouchableOpacity>
                  ) : (
                    <View key={ki} style={styles.numpadKey} />
                  )
                ) : (
                  <TouchableOpacity
                    key={ki}
                    style={[styles.numpadKey, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}
                    onPress={() => handlePress(key)}
                    activeOpacity={0.6}
                    disabled={isLoading}
                  >
                    {key === 'backspace' ? (
                      <Text style={[styles.numpadKeyText, { color: colors.secondaryAccent, fontSize: 24 }]}>⌫</Text>
                    ) : (
                      <Text style={[styles.numpadKeyText, { color: colors.text }]}>{key}</Text>
                    )}
                  </TouchableOpacity>
                )
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: SPACING.lg,
    paddingVertical: SPACING.sm,
    zIndex: 1,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  displayName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: RADII.full,
  },
  roleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  prompt: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: RADII.full,
    borderWidth: 2,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.md,
    minHeight: 20,
  },
  numpad: {
    width: '100%',
    maxWidth: 340,
    gap: SPACING.sm,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  numpadKey: {
    flex: 1,
    height: 96,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyText: {
    fontSize: 38,
    fontWeight: '600',
  },
  biometricKey: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
