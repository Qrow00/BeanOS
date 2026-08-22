import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import GradientButton from './glass/GradientButton';
import GlassPanel from './glass/GlassPanel';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ visible, title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', destructive, onConfirm, onCancel }: ConfirmModalProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={onCancel}>
        <GlassPanel strong radius={RADII.xl} androidRealBlur intensity={60} style={styles.dialog}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <View style={styles.confirmWrap}>
              <GradientButton
                title={confirmLabel}
                onPress={onConfirm}
                height={44}
                glow={false}
                gradient={destructive ? [colors.danger, colors.danger] : undefined}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </GlassPanel>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmWrap: {
    flex: 1.2,
  },
  btnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
