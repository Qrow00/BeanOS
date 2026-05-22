import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from '../ui/Modal';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

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
        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        keyboardType="number-pad"
        value={value}
        onChangeText={setValue}
        autoFocus
        selectTextOnFocus
      />
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.background }]} onPress={onClose}>
          <Text style={[styles.cancelText, { color: colors.danger }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={handleApply}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
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
    borderRadius: 10,
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
