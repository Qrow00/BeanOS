import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES, RADII } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useTransactionStore } from '../../../src/store/transactionStore';
import Input from '../../../src/components/ui/Input';
import GradientButton from '../../../src/components/ui/glass/GradientButton';

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={[styles.header, { borderBottomColor: colors.glassStroke }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/finance')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Finance</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Transaction</Text>
        <View style={{ width: 80 }} />
      </View>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            { backgroundColor: colors.glassFill, borderColor: colors.glassStroke },
            type === 'income' && { backgroundColor: colors.success + '22', borderColor: colors.success },
          ]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.typeBtnText, { color: type === 'income' ? colors.success : colors.text }]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            { backgroundColor: colors.glassFill, borderColor: colors.glassStroke },
            type === 'expense' && { backgroundColor: colors.danger + '22', borderColor: colors.danger },
          ]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.typeBtnText, { color: type === 'expense' ? colors.danger : colors.text }]}>Expense</Text>
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
            style={[styles.categoryChip, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }, category === c && { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}
            onPress={() => setCategory(category === c ? '' : c)}
          >
            <Text style={[styles.categoryChipText, { color: category === c ? colors.primary : colors.text }]}>{c}</Text>
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

      <GradientButton
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
    borderRadius: RADII.full,
    borderWidth: 1,
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
    borderRadius: RADII.sm,
    borderWidth: 1,
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
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
