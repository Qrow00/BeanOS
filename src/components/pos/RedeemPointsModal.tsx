import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from '../ui/Modal';
import GradientButton from '../ui/glass/GradientButton';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';
import type { Customer } from '../../types/database';

interface RedeemPointsModalProps {
  visible: boolean;
  customer: Customer;
  pointValue: number;
  maxRedeemable: number;
  currentRedeem: number;
  onApply: (points: number) => void;
  onClose: () => void;
}

export default function RedeemPointsModal({
  visible,
  customer,
  pointValue,
  maxRedeemable,
  currentRedeem,
  onApply,
  onClose,
}: RedeemPointsModalProps) {
  const colors = useThemeStore(s => s.colors);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (visible) setInput(currentRedeem > 0 ? String(currentRedeem) : '');
  }, [visible]);

  const parsed = parseInt(input, 10) || 0;
  const clamped = Math.min(Math.max(parsed, 0), maxRedeemable);
  const value = clamped * pointValue;
  const remaining = customer.points_balance - clamped;

  const apply = () => {
    onApply(clamped);
    onClose();
  };

  return (
    <Modal visible={visible} title="Redeem Points" onClose={onClose}>
      <View style={[styles.balanceCard, { backgroundColor: colors.primarySurface, borderColor: colors.glassStroke }]}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>AVAILABLE</Text>
        <Text style={[styles.balanceValue, { color: colors.primary }]}>
          {customer.points_balance} pts · {formatCurrency(customer.points_balance * pointValue)}
        </Text>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        placeholder="Points to redeem"
        placeholderTextColor={colors.disabled}
        autoFocus
      />

      <View style={styles.quickRow}>
        {[100, 200, Math.min(500, maxRedeemable), 'MAX' as const].map((q, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.quickBtn, { borderColor: colors.glassStroke, backgroundColor: colors.glassFill }]}
            onPress={() => setInput(String(q === 'MAX' ? maxRedeemable : q))}
          >
            <Text style={[styles.quickText, { color: colors.textSecondary }]}>
              {q === 'MAX' ? `Max (${maxRedeemable})` : q}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary }}>Discount</Text>
          <Text style={[{ color: colors.success }, styles.summaryValue]}>-{formatCurrency(value)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary }}>Balance after</Text>
          <Text style={[{ color: colors.text }, styles.summaryValue]}>{remaining} pts</Text>
        </View>
      </View>

      <GradientButton
        title={clamped > 0 ? `Apply ${clamped} pts (-${formatCurrency(value)})` : 'Apply'}
        onPress={apply}
        disabled={parsed <= 0 || parsed > maxRedeemable}
        height={48}
        style={{ alignSelf: 'stretch' }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: RADII.sm,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  balanceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginTop: 2,
  },
  input: {
    alignSelf: 'stretch',
    height: 52,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  summary: {
    marginBottom: SPACING.lg,
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: FONT_SIZES.sm,
  },
  summaryValue: {
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
  },
});
