import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useCouponStore } from '../../../src/store/couponStore';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';

export default function NewCouponScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { addCoupon, isLoading } = useCouponStore();

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSubmit = async () => {
    if (!code.trim() || !discountValue) return;
    await addCoupon({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_purchase: parseFloat(minPurchase) || 0,
      max_uses: parseInt(maxUses) || null,
      is_active: 1,
      expiry_date: expiryDate || null,
    });
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Input label="Coupon Code" value={code} onChangeText={setCode} placeholder="e.g. SAVE20" autoCapitalize="characters" />
      <Input label="Discount Value" value={discountValue} onChangeText={setDiscountValue} placeholder="e.g. 20" keyboardType="decimal-pad" />
      <Input label="Min Purchase (optional)" value={minPurchase} onChangeText={setMinPurchase} placeholder="0.00" keyboardType="decimal-pad" />
      <Input label="Max Uses (optional)" value={maxUses} onChangeText={setMaxUses} placeholder="Unlimited" keyboardType="number-pad" />
      <Input label="Expiry Date (optional) YYYY-MM-DD" value={expiryDate} onChangeText={setExpiryDate} placeholder="2026-12-31" />

      <View style={styles.typeRow}>
        <Button
          title="Percentage"
          variant={discountType === 'percentage' ? 'primary' : 'outline'}
          onPress={() => setDiscountType('percentage')}
          style={styles.typeBtn}
        />
        <Button
          title="Fixed Amount"
          variant={discountType === 'fixed' ? 'primary' : 'outline'}
          onPress={() => setDiscountType('fixed')}
          style={styles.typeBtn}
        />
      </View>

      <Button
        title="Add Coupon"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!code.trim() || !discountValue}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    flex: 1,
  },
  submitBtn: {
    marginBottom: 24,
  },
});
