import { View, Text, Image, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface QRCouponScannerProps {
  couponCode?: string;
  scanned: boolean;
}

export default function QRCouponScanner({ couponCode, scanned }: QRCouponScannerProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.qrPlaceholder, { backgroundColor: colors.background }]}>
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
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
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
