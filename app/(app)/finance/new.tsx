import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useTransactionStore } from '../../../src/store/transactionStore';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';

export default function NewTransactionScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { user } = useAuthStore();
  const { addTransaction, isLoading } = useTransactionStore();

  const [type, setType] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [categoryCustom, setCategoryCustom] = useState('');
  const [entryDate, setEntryDate] = useState('');

  const handleSubmit = async () => {
    if (!description.trim() || !amount) return;
    await addTransaction({
      description: description.trim(),
      amount: parseFloat(amount),
      category: category === 'Custom' ? (categoryCustom.trim() || 'Custom') : category.trim() || 'General',
      type,
      entry_date: entryDate || new Date().toISOString().split('T')[0],
      created_by: user!.id,
    });
    router.replace('/(app)/finance');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/finance')}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Transaction</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, { borderColor: colors.border }, type === 'income' && { backgroundColor: '#059669', borderColor: '#059669' }]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.typeBtnText, { color: type === 'income' ? '#fff' : colors.text }]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, { borderColor: colors.border }, type === 'expense' && { backgroundColor: '#DC2626', borderColor: '#DC2626' }]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.typeBtnText, { color: type === 'expense' ? '#fff' : colors.text }]}>Expense</Text>
        </TouchableOpacity>
      </View>

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Coffee bean purchase"
      />

      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <Text style={[styles.label, { color: colors.text }]}>Category</Text>
      <View style={styles.categoryRow}>
        {['Profit', 'Salary', 'Rental', 'Refund', 'Commission', 'Fee', 'Loan', 'Miscellaneous', 'Custom'].map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.categoryChip, { borderColor: colors.border }, category === c && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setCategory(category === c ? '' : c)}
          >
            <Text style={[styles.categoryChipText, { color: category === c ? '#fff' : colors.text }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {category === 'Custom' && (
        <Input
          label="Custom Category"
          value={categoryCustom}
          onChangeText={setCategoryCustom}
          placeholder="Enter custom category"
        />
      )}

      <Input
        label="Date (optional, YYYY-MM-DD)"
        value={entryDate}
        onChangeText={setEntryDate}
        placeholder={new Date().toISOString().split('T')[0]}
      />

      <Button
        title={type === 'income' ? 'Add Income' : 'Add Expense'}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!description.trim() || !amount}
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
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: SPACING.sm,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
});
