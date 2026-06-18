import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Transaction } from '../../types/database';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: () => void;
}

export default function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
  const colors = useThemeStore(s => s.colors);
  const isIncome = transaction.type === 'income';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: isIncome ? colors.success : colors.danger }]}>
      <View style={styles.topRow}>
        <View style={styles.categoryRow}>
          <View style={[styles.typeBadge, { backgroundColor: isIncome ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.typeBadgeText, { color: isIncome ? '#065F46' : '#991B1B' }]}>
              {isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
          <Text style={[styles.category, { color: colors.textSecondary }]}>{transaction.category}</Text>
        </View>
        <Text style={[styles.amount, { color: isIncome ? colors.success : colors.danger }]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
      <Text style={[styles.description, { color: colors.text }]}>{transaction.description}</Text>
      <View style={styles.bottomRow}>
        <Text style={[styles.date, { color: colors.disabled }]}>{formatDate(transaction.entry_date)}</Text>
        {onDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  category: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: FONT_SIZES.xs,
  },
  deleteText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
