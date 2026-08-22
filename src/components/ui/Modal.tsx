import { Text, TouchableOpacity, StyleSheet, Modal as RNModal, View, KeyboardAvoidingView } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import GlassPanel from './glass/GlassPanel';

interface ModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  modalStyle?: Record<string, any>;
}

export default function Modal({ visible, title, children, onClose, modalStyle }: ModalProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.kav} behavior="padding">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <GlassPanel strong radius={RADII.xl} androidRealBlur intensity={60} style={[styles.modal, modalStyle]}>
            <View style={styles.header}>
              {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
                <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {children}
          </GlassPanel>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  kav: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  modal: {
    padding: SPACING.lg,
    maxHeight: '80%',
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
