import { ReactNode } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../../store/themeStore';
import { GLASS, RADII } from '../../../utils/constants';

interface GlassPanelProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
  radius?: number;
  androidRealBlur?: boolean;
}

export default function GlassPanel({
  children,
  style,
  intensity = GLASS.blurIntensity,
  strong = false,
  radius = RADII.lg,
  androidRealBlur = false,
}: GlassPanelProps) {
  const colors = useThemeStore(s => s.colors);
  const mode = useThemeStore(s => s.mode);

  return (
    <View
      collapsable={false}
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: GLASS.strokeWidth,
          borderColor: colors.glassStroke,
          backgroundColor: strong ? colors.glassFillStrong : colors.glassFill,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={mode === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' && androidRealBlur ? 'dimezisBlurView' : 'none'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'transparent',
    flexGrow: 1,
  },
});
