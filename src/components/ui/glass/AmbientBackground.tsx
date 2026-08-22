import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../../store/themeStore';

function GlowBlob({ size, style, color, opacity }: { size: number; style: any; color: string; opacity: number }) {
  return (
    <View style={[style, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }]}>
      <View style={{ flex: 1, margin: size * 0.12, borderRadius: size / 2, backgroundColor: color, opacity: 0.55 }} />
    </View>
  );
}

export default function AmbientBackground() {
  const colors = useThemeStore(s => s.colors);
  const isLight = useThemeStore(s => s.mode === 'light');
  const blobOpacity = isLight ? 0.38 : 0.26;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GlowBlob size={420} color={colors.blobA} style={styles.blobA} opacity={blobOpacity} />
      <GlowBlob size={360} color={colors.blobB} style={styles.blobB} opacity={blobOpacity} />
      <GlowBlob size={300} color={colors.blobC} style={styles.blobC} opacity={blobOpacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  blobA: {
    position: 'absolute',
    top: -140,
    left: -120,
  },
  blobB: {
    position: 'absolute',
    bottom: -100,
    right: -110,
  },
  blobC: {
    position: 'absolute',
    top: '38%',
    right: '22%',
  },
});
