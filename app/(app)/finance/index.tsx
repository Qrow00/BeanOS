import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { useTransactionStore } from '../../../src/store/transactionStore';
import { formatCurrency } from '../../../src/utils/helpers';
import FinanceSummary from '../../../src/components/finance/FinanceSummary';
import TransactionCard from '../../../src/components/finance/TransactionCard';

type TabType = 'income' | 'expense';

export default function FinanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore(s => s.colors);
  const { isAdmin } = useAuthStore();
  const { transactions, fetchTransactions, deleteTransaction, isLoading } = useTransactionStore();
  const [tab, setTab] = useState<TabType>('income');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netTotal = incomeTotal - expenseTotal;

  const filtered = transactions.filter(t => t.type === tab);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Finance</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.content}>
        <FinanceSummary
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          netTotal={netTotal}
        />

        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'income' && { backgroundColor: colors.primary }]}
            onPress={() => setTab('income')}
          >
            <Text style={[styles.tabText, { color: tab === 'income' ? '#fff' : colors.text }]}>
              Income ({transactions.filter(t => t.type === 'income').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'expense' && { backgroundColor: colors.primary }]}
            onPress={() => setTab('expense')}
          >
            <Text style={[styles.tabText, { color: tab === 'expense' ? '#fff' : colors.text }]}>
              Expenses ({transactions.filter(t => t.type === 'expense').length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onDelete={isAdmin() ? () => deleteTransaction(item.id) : undefined}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={fetchTransactions}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {tab === 'income' ? 'income' : 'expense'} entries yet
              </Text>
            </View>
          }
        />
      </View>

      {isAdmin() && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(app)/finance/new')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 80,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
