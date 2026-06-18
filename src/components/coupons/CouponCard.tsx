import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Coupon } from '../../types/database';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface CouponCardProps {
  coupon: Coupon;
  onDelete?: () => void;
}

export default function CouponCard({ coupon, onDelete }: CouponCardProps) {
  const colors = useThemeStore(s => s.colors);
  const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
  const isExhausted = coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses;
  const isInactive = !coupon.is_active;
  const disabled = isExpired || isExhausted || isInactive;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, disabled && { opacity: 0.6 }]}>
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <Text style={[styles.code, { color: colors.primary }]}>{coupon.code}</Text>
          {disabled && <Text style={styles.disabledLabel}>Inactive</Text>}
        </View>
        <Text style={[styles.value, { color: colors.success }]}>
          {coupon.discount_type === 'percentage'
            ? `${coupon.discount_value}%`
            : formatCurrency(coupon.discount_value)}
        </Text>
      </View>
      <View style={styles.details}>
        {coupon.min_purchase > 0 && (
          <Text style={[styles.detail, { color: colors.textSecondary }]}>Min: {formatCurrency(coupon.min_purchase)}</Text>
        )}
        {coupon.max_uses && (
          <Text style={[styles.detail, { color: colors.textSecondary }]}>Uses: {coupon.current_uses}/{coupon.max_uses}</Text>
        )}
        {coupon.expiry_date && (
          <Text style={[styles.detail, isExpired && { color: colors.danger }, !isExpired && { color: colors.textSecondary }]}>
            {isExpired ? 'Expired: ' : 'Expires: '}{formatDate(coupon.expiry_date)}
          </Text>
        )}
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  code: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  disabledLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#DC2626',
    fontWeight: '600',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  detail: {
    fontSize: FONT_SIZES.xs,
  },
  deleteBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-end',
  },
  deleteText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
