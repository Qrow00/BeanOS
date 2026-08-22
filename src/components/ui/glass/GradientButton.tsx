import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../../store/themeStore';
import { FONT_SIZES, RADII, SPACING } from '../../../utils/constants';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  height?: number;
  fontSize?: number;
  gradient?: [string, string];
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  height = 52,
  fontSize = FONT_SIZES.md,
  gradient,
  glow = true,
  style,
}: GradientButtonProps) {
  const colors = useThemeStore(s => s.colors);
  const scale = useRef(new Animated.Value(1)).current;

  const [from, to] = gradient || [colors.primaryGradientFrom, colors.primaryGradientTo];
  const inactive = disabled || loading;

  const animate = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      onPressIn={() => animate(0.96)}
      onPressOut={() => animate(1)}
      style={[style, { opacity: inactive ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[
          styles.inner,
          { height, transform: [{ scale }] },
          glow && !inactive && { shadowColor: colors.glowPrimary, shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
        ]}
      >
        <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={[styles.text, { fontSize }]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
