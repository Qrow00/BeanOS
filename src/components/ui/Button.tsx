import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
  const colors = useThemeStore(s => s.colors);

  const isOutline = variant === 'outline';
  const bgColor = isOutline
    ? 'transparent'
    : variant === 'primary'
    ? colors.primary
    : variant === 'danger'
    ? colors.danger
    : colors.surface;

  const textColor = isOutline ? colors.primary : (variant === 'primary' || variant === 'danger') ? '#FFFFFF' : colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderColor: isOutline ? colors.primary : 'transparent' },
        isOutline && { borderWidth: 1.5 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
