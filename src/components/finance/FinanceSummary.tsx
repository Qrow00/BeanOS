import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/helpers';

interface FinanceSummaryProps {
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
}

export default function FinanceSummary({ incomeTotal, expenseTotal, netTotal }: FinanceSummaryProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Income</Text>
          <Text style={[styles.value, { color: colors.success }]}>{formatCurrency(incomeTotal)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.item}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Expenses</Text>
          <Text style={[styles.value, { color: colors.danger }]}>{formatCurrency(expenseTotal)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.item}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Net</Text>
          <Text style={[styles.value, { color: netTotal >= 0 ? colors.success : colors.danger }]}>
            {formatCurrency(netTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: SPACING.sm,
  },
});
