import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import GradientButton from './glass/GradientButton';
import GlassPanel from './glass/GlassPanel';
import { springs } from '../../utils/motion';

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
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        ...springs.expressive,
      }).start();
    }
  }, [visible]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={onCancel}>
        <Animated.View style={{ width: '100%', alignItems: 'center', opacity, transform: [{ translateY }, { scale }] }}>
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
        </Animated.View>
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
