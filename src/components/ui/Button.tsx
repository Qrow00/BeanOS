import { Animated, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { usePressScale } from '../../hooks/usePressScale';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const { scale, onPressIn, onPressOut } = usePressScale(0.96);

  const isGradient = variant === 'primary';
  const isOutline = variant === 'outline';

  const textColor = isOutline
    ? colors.primary
    : isGradient || variant === 'danger'
    ? '#FFFFFF'
    : colors.text;

  return (
    <AnimatedTouchable
      style={[
        styles.btn,
        {
          backgroundColor: isGradient ? 'transparent' : variant === 'secondary' ? colors.glassFillStrong : variant === 'danger' ? colors.danger : colors.glassFill,
          borderColor: isOutline || isGradient ? colors.primary : colors.glassStroke,
        },
        (disabled || loading) && { opacity: 0.5 },
        { transform: [{ scale }] },
        style,
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      {isGradient && !loading ? (
        <LinearGradient
          colors={[colors.primaryGradientFrom, colors.primaryGradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
