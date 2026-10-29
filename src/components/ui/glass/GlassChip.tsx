import { StyleSheet, Text, View, StyleProp, ViewStyle, Animated } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { FONT_SIZES, RADII, SPACING } from '../../../utils/constants';
import { usePressScale } from '../../../hooks/usePressScale';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GlassChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export default function GlassChip({ label, active = false, onPress, style, color }: GlassChipProps) {
  const colors = useThemeStore(s => s.colors);
  const accent = color || colors.primary;
  const { scale, onPressIn, onPressOut } = usePressScale(0.94);
  const clampedScale = scale.interpolate({
    inputRange: [0.94, 1],
    outputRange: [0.94, 1],
    extrapolate: 'clamp',
  });

  return (
    <AnimatedTouchable
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primarySurface : colors.glassFill,
        },
        { transform: [{ scale: clampedScale }] },
        style,
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.9}
    >
      {color ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : null}
      <Text
        style={{
          color: active ? accent : colors.textSecondary,
          fontSize: FONT_SIZES.xs,
          fontWeight: '700',
          letterSpacing: 0.4,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    height: 34,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
