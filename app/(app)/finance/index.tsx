import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII } from '../../../src/utils/constants';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { useTransactionStore } from '../../../src/store/transactionStore';
import FinanceSummary from '../../../src/components/finance/FinanceSummary';
import TransactionCard from '../../../src/components/finance/TransactionCard';

type TabType = 'income' | 'expense';

export default function FinanceScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { isAdmin } = useAuthStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { transactions, fetchTransactions, deleteTransaction, isLoading } = useTransactionStore();
  const [tab, setTab] = useState<TabType>('income');

  useEffect(() => {
    if (!isAdmin()) router.replace('/(app)/pos');
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netTotal = incomeTotal - expenseTotal;

  const filtered = transactions.filter(t => t.type === tab);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expenses' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.glassStroke }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/pos')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← POS</Text>
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

        <View style={[styles.tabBar, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && { backgroundColor: colors.primarySurface }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.text }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
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
      </View>

      {isAdmin() && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 96 }]}
          onPress={() => router.push('/(app)/finance/new')}
        >
          <LinearGradient
            colors={[colors.primaryGradientFrom, colors.primaryGradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
    borderRadius: RADII.sm,
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
