import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal as RNModal, View, ScrollView, Keyboard, useWindowDimensions, Animated } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import GlassPanel from './glass/GlassPanel';
import { springs } from '../../utils/motion';

interface ModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  modalStyle?: Record<string, any>;
}

export default function Modal({ visible, title, children, onClose, modalStyle }: ModalProps) {
  const colors = useThemeStore(s => s.colors);
  const progress = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const available = Math.max(220, height - keyboardHeight);
  const panelMax = Math.round(available * 0.9);
  const bodyMax = Math.max(120, panelMax - 96);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay, paddingBottom: keyboardHeight }]}>
        <Animated.View style={{ width: '100%', maxHeight: panelMax, opacity, transform: [{ translateY }, { scale }] }}>
          <GlassPanel strong radius={RADII.xl} androidRealBlur intensity={60} style={[styles.modal, { maxHeight: panelMax }, modalStyle]}>
            <View style={styles.header}>
              {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
                <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: bodyMax }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </GlassPanel>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  modal: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});
