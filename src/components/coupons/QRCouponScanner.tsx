import { View, Text, Image, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface QRCouponScannerProps {
  couponCode?: string;
  scanned: boolean;
}

export default function QRCouponScanner({ couponCode, scanned }: QRCouponScannerProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
      <View style={[styles.qrPlaceholder, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
        <Text style={styles.qrEmoji}>📱</Text>
        <Text style={[styles.qrText, { color: colors.textSecondary }]}>
          {scanned && couponCode ? couponCode : 'QR Scanner Placeholder'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.sm,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEmoji: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  qrText: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
});
