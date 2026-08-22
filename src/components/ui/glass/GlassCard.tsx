import { ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { FONT_SIZES, RADII, SPACING } from '../../../utils/constants';

interface GlassCardProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}

export default function GlassCard({ children, style, onPress, disabled }: GlassCardProps) {
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);

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
      <TouchableOpacity style={cardStyle} onPress={onPress} disabled={disabled} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
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
