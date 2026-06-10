import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { useTransactionStore } from '../../../src/store/transactionStore';
import { usePriceHistoryStore } from '../../../src/store/priceHistoryStore';
import { formatCurrency } from '../../../src/utils/helpers';
import FinanceSummary from '../../../src/components/finance/FinanceSummary';
import TransactionCard from '../../../src/components/finance/TransactionCard';
import PriceChangeCard from '../../../src/components/finance/PriceChangeCard';

type TabType = 'income' | 'expense' | 'prices';

const SORT_OPTIONS = [
  { key: 'name' as const, label: 'Name' },
  { key: 'price' as const, label: 'Price' },
  { key: 'quantity' as const, label: 'Qty' },
  { key: 'date' as const, label: 'Date' },
];

export default function FinanceScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { isAdmin } = useAuthStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { transactions, fetchTransactions, deleteTransaction, isLoading } = useTransactionStore();
  const { fetchMovements, sortedMovements, sortBy, setSortBy, isLoading: priceLoading } = usePriceHistoryStore();
  const [tab, setTab] = useState<TabType>('income');

  useEffect(() => {
    if (!isAdmin()) router.replace('/(app)/pos');
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (tab === 'prices') fetchMovements();
  }, [tab]);

  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netTotal = incomeTotal - expenseTotal;

  const filtered = transactions.filter(t => t.type === (tab === 'prices' ? 'income' : tab));
  const priceMovements = sortedMovements();

  const tabs: { key: TabType; label: string }[] = [
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expenses' },
    { key: 'prices', label: 'Prices' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/pos')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← POS</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Finance</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.content}>
        {tab !== 'prices' && (
          <FinanceSummary
            incomeTotal={incomeTotal}
            expenseTotal={expenseTotal}
            netTotal={netTotal}
          />
        )}

        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && { backgroundColor: colors.primary }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, { color: tab === t.key ? '#fff' : colors.text }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'prices' ? (
          <>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortChip, { backgroundColor: colors.surface, borderColor: colors.border }, sortBy === opt.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Text style={[styles.sortChipText, { color: colors.textSecondary }, sortBy === opt.key && { color: '#fff' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FlatList
              data={priceMovements}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => <PriceChangeCard item={item} />}
              contentContainerStyle={[styles.list, { paddingBottom: isLandscape ? 56 : 80 }]}
              refreshing={priceLoading}
              onRefresh={fetchMovements}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No ingredient products found
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TransactionCard
                transaction={item}
                onDelete={isAdmin() ? () => deleteTransaction(item.id) : undefined}
              />
            )}
            contentContainerStyle={[styles.list, { paddingBottom: isLandscape ? 56 : 80 }]}
            refreshing={isLoading}
            onRefresh={fetchTransactions}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No {tab} entries yet
                </Text>
              </View>
            }
          />
        )}
      </View>

      {isAdmin() && tab !== 'prices' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, bottom: 12 }]}
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
  sortRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sortChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  list: {
    flexGrow: 1,
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
