import { StyleSheet, Text, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { FONT_SIZES, RADII, SPACING } from '../../../utils/constants';

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

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primarySurface : colors.glassFill,
          borderColor: active ? accent : colors.glassStroke,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
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
    </TouchableOpacity>
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
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
