import { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import Modal from '../ui/Modal';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../utils/helpers';

let ExpoBrightness: any;
try {
  ExpoBrightness = requireNativeModule('ExpoBrightness');
} catch {
  ExpoBrightness = null;
}

interface QRPaymentModalProps {
  visible: boolean;
  type: 'gcash' | 'maya';
  total: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function QRPaymentModal({
  visible,
  type,
  total,
  onConfirm,
  onClose,
}: QRPaymentModalProps) {
  const colors = useThemeStore(s => s.colors);
  const { gcashQrUri, gcashCompanyName, mayaQrUri, mayaCompanyName } = useSettingsStore();
  const prevBrightness = useRef<number | null>(null);

  useEffect(() => {
    if (!ExpoBrightness) return;
    let cancelled = false;

    const restore = async (val: number) => {
      try {
        if (ExpoBrightness.restoreSystemBrightnessAsync) {
          await ExpoBrightness.restoreSystemBrightnessAsync();
        } else {
          await ExpoBrightness.setBrightnessAsync(val);
        }
      } catch (e) {
        console.warn('Brightness restore failed:', e);
      }
    };

    if (visible) {
      (async () => {
        try {
          const current = await ExpoBrightness.getBrightnessAsync();
          if (!cancelled) {
            prevBrightness.current = current;
            await ExpoBrightness.setBrightnessAsync(1);
          }
        } catch (e) {
          console.warn('Brightness get/set failed:', e);
        }
      })();
    } else if (prevBrightness.current != null) {
      restore(prevBrightness.current);
      prevBrightness.current = null;
    }

    return () => {
      cancelled = true;
      if (prevBrightness.current != null) {
        restore(prevBrightness.current);
        prevBrightness.current = null;
      }
    };
  }, [visible]);

  const label = type === 'gcash' ? 'GCash' : 'Maya';
  const qrUri = type === 'gcash' ? gcashQrUri : mayaQrUri;
  const companyName = type === 'gcash' ? gcashCompanyName : mayaCompanyName;

  return (
    <Modal visible={visible} onClose={onClose} title={`Pay via ${label}`} modalStyle={{ maxHeight: '120%' }}>
      <View style={styles.scrollContent}>
        {qrUri ? (
          <Image
            source={{ uri: qrUri }}
            style={[styles.qrImage, { borderColor: colors.border }]}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.qrPlaceholder, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={styles.qrPlaceholderIcon}>📱</Text>
            <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>QR Code not set</Text>
            <Text style={[styles.qrPlaceholderSub, { color: colors.disabled }]}>Configure in Settings</Text>
          </View>
        )}

        <Text style={[styles.companyName, { color: colors.text }]}>
          {label}{companyName ? ` - ${companyName}` : ''}
        </Text>

        <Text style={[styles.totalText, { color: colors.primary }]}>
          {formatCurrency(total)}
        </Text>

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          onPress={onConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmBtnText}>Confirm Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  qrImage: {
    width: 260,
    height: 260,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  qrPlaceholder: {
    width: 260,
    height: 260,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  qrPlaceholderIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  qrPlaceholderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  qrPlaceholderSub: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  companyName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  totalText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  confirmBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  cancelBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
