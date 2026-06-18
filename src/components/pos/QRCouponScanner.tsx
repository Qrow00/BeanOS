import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface QRCouponScannerProps {
  onScan: (code: string) => void;
}

export default function QRCouponScanner({ onScan }: QRCouponScannerProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <TouchableOpacity style={[styles.container, { borderColor: colors.primary }]} activeOpacity={0.7}>
      <View style={[styles.qrPlaceholder, { backgroundColor: colors.primarySurface }]}>
        <Text style={[styles.qrIcon, { color: colors.primary }]}>▆▇▆</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.primary }]}>Scan Coupon QR</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Tap to scan a coupon QR code</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  qrPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  qrIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  hint: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
});
