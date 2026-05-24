import { View, Text, TouchableOpacity, StyleSheet, Modal as RNModal } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { SPACING, FONT_SIZES } from '../../utils/constants';

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
    <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface }, modalStyle]}>
          <View style={styles.header}>
            {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeBtn, { color: colors.danger }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
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
    borderRadius: 16,
    padding: SPACING.md,
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
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    padding: SPACING.xs,
  },
});