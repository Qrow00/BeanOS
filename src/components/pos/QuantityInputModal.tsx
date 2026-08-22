import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from '../ui/Modal';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import GradientButton from '../ui/glass/GradientButton';

interface QuantityInputModalProps {
  visible: boolean;
  currentQuantity: number;
  maxQuantity: number;
  onApply: (quantity: number) => void;
  onClose: () => void;
}

export default function QuantityInputModal({
  visible,
  currentQuantity,
  maxQuantity,
  onApply,
  onClose,
}: QuantityInputModalProps) {
  const colors = useThemeStore(s => s.colors);
  const [value, setValue] = useState(String(currentQuantity));

  const handleApply = () => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 1) return;
    onApply(Math.min(qty, maxQuantity));
    setValue('');
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Set Quantity">
      <Text style={[styles.hint, { color: colors.textSecondary }]}>Enter quantity (1-{maxQuantity})</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
        keyboardType="number-pad"
        value={value}
        onChangeText={setValue}
        autoFocus
        selectTextOnFocus
      />
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <GradientButton title="Apply" onPress={handleApply} height={48} glow={false} style={{ flex: 2 }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    padding: SPACING.md,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },
});
