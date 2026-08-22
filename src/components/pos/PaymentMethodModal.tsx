import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Keyboard } from 'react-native';
import Modal from '../ui/Modal';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';
import type { PaymentMethod } from '../../types/database';
import QRPaymentModal from './QRPaymentModal';
import GradientButton from '../ui/glass/GradientButton';

interface PaymentMethodModalProps {
  visible: boolean;
  total: number;
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onConfirm: (method: PaymentMethod, amountTendered: number) => void;
  onClose: () => void;
}

const paymentOptions: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: 'Cash', icon: '💵' },
  { key: 'card', label: 'Card', icon: '💳' },
  { key: 'gcash', label: 'GCash', icon: '📱' },
  { key: 'maya', label: 'Maya', icon: '📱' },
];

export default function PaymentMethodModal({
  visible,
  total,
  selectedMethod,
  onSelect,
  onConfirm,
  onClose,
}: PaymentMethodModalProps) {
  const colors = useThemeStore(s => s.colors);
  const [tendered, setTendered] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isCash = selectedMethod === 'cash';
  const isQRMethod = selectedMethod === 'gcash' || selectedMethod === 'maya';
  const change = isCash && tendered ? parseFloat(tendered) - total : 0;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {});
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleConfirm = () => {
    const amount = isCash ? (parseFloat(tendered) || total) : total;
    onConfirm(selectedMethod, amount);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Select Payment">
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.options}>
          {paymentOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.option,
                { backgroundColor: colors.glassFill, borderColor: colors.glassStroke },
                selectedMethod === opt.key && { borderColor: colors.primary, backgroundColor: colors.primarySurface },
              ]}
              onPress={() => onSelect(opt.key)}
            >
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <Text style={[styles.optionLabel, { color: colors.text }, selectedMethod === opt.key && { color: colors.primary }]}>
                {opt.label}
              </Text>
              {selectedMethod === opt.key && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.totalLabel, { color: colors.text }]}>Total: {formatCurrency(total)}</Text>

        {isCash && (
          <View style={styles.tenderedSection}>
            <Text style={[styles.tenderedLabel, { color: colors.textSecondary }]}>Amount Tendered</Text>
            <TextInput
              style={[styles.tenderedInput, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
              value={tendered}
              onChangeText={setTendered}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.disabled}
              autoFocus
            />
            {change > 0 && (
              <Text style={[styles.changeText, { color: colors.success }]}>Change: {formatCurrency(change)}</Text>
            )}
          </View>
        )}

        {isQRMethod ? (
          <GradientButton title="Pay with QR" onPress={() => setShowQRModal(true)} />
        ) : (
          <GradientButton title={`Pay ${formatCurrency(total)}`} onPress={handleConfirm} />
        )}
      </ScrollView>

      <QRPaymentModal
        visible={showQRModal}
        type={selectedMethod as 'gcash' | 'maya'}
        total={total}
        onConfirm={() => {
          setShowQRModal(false);
          handleConfirm();
        }}
        onClose={() => setShowQRModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.sm,
    borderWidth: 1.5,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  optionLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  tenderedSection: {
    marginBottom: SPACING.md,
  },
  tenderedLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  tenderedInput: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  changeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
