import { ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle, Animated } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { FONT_SIZES, RADII, SPACING } from '../../../utils/constants';
import { usePressScale } from '../../../hooks/usePressScale';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GlassCardProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}

export default function GlassCard({ children, style, onPress, disabled }: GlassCardProps) {
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);
  const { scale, onPressIn, onPressOut } = usePressScale(0.97);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.glassFill,
      borderColor: colors.glassStroke,
      shadowColor: '#000',
      shadowOpacity: mode === 'dark' ? 0.35 : 0.08,
    },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedTouchable
        style={[...cardStyle, { transform: [{ scale }] }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.9}
      >
        {children}
      </AnimatedTouchable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: SPACING.md,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
});
