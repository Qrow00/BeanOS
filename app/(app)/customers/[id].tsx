import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Switch,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SPACING, FONT_SIZES, RADII } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { useCustomerStore } from '../../../src/store/customerStore';
import { getDatabase } from '../../../src/database/connection';
import * as customersRepo from '../../../src/database/customers';
import type { LoyaltyLedgerEntry } from '../../../src/types/database';
import GradientButton from '../../../src/components/ui/glass/GradientButton';
import LoyaltyQrCard, { LoyaltyQrCardHandle } from '../../../src/components/customers/LoyaltyQrCard';
import CardDownloadModal from '../../../src/components/customers/CardDownloadModal';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const storeName = useSettingsStore(s => s.storeName);
  const { customers, updateCustomer, adjustPoints } = useCustomerStore();

  const customerId = Number(id);
  const customer = customers.find(c => c.id === customerId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ledger, setLedger] = useState<LoyaltyLedgerEntry[]>([]);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const cardRef = useRef<LoyaltyQrCardHandle>(null);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setPhone(customer.phone ?? '');
    loadLedger();
  }, [customer?.id, customer?.points_balance]);

  const loadLedger = async () => {
    try {
      const db = await getDatabase();
      setLedger(await customersRepo.getLedger(db, customerId, 100));
    } catch {}
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateCustomer(customerId, { name: name.trim(), phone: phone || null });
    Alert.alert('Saved', 'Member details updated');
  };

  const handleToggleActive = (value: boolean) => {
    if (!value) {
      Alert.alert('Deactivate Member', `${customer?.name} will no longer be attachable at POS. History is kept.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => updateCustomer(customerId, { is_active: 0 }) },
      ]);
    } else {
      updateCustomer(customerId, { is_active: 1 });
    }
  };

  const handleAdjust = async () => {
    const delta = Math.trunc(Number(adjustAmount));
    if (!delta) return;
    try {
      await adjustPoints(
        customerId,
        delta,
        adjustNote.trim() || (delta > 0 ? 'Manual add' : 'Manual deduction')
      );
      setShowAdjust(false);
      setAdjustAmount('');
      setAdjustNote('');
      Alert.alert('Done', `Points adjusted by ${delta > 0 ? '+' : ''}${delta}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not adjust points');
    }
  };

  const renderLedgerRow = ({ item }: { item: LoyaltyLedgerEntry }) => (
    <View style={[styles.ledgerRow, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.ledgerDesc, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
        <Text style={[styles.ledgerDate, { color: colors.disabled }]}>
          {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
      </View>
      <Text
        style={[
          styles.ledgerDelta,
          { color: item.points >= 0 ? colors.success : colors.danger },
        ]}
      >
        {item.points >= 0 ? '+' : ''}{item.points}
      </Text>
    </View>
  );

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary }}>Member not found</Text>
        <TouchableOpacity onPress={() => router.replace('/(app)/customers')} style={{ marginTop: SPACING.md }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Back to members</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        data={ledger}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderLedgerRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Points hero */}
            <View style={[styles.hero, { backgroundColor: colors.glassFillStrong, borderColor: colors.primary }]}>
              <View>
                <Text style={[styles.heroName, { color: colors.text }]}>{customer.name}</Text>
                <Text style={[styles.heroMeta, { color: colors.textSecondary }]}>
                  {customer.code}{customer.phone ? ` · ${customer.phone}` : ''}
                </Text>
                <View style={styles.activeRow}>
                  <Text style={[styles.activeLabel, { color: colors.textSecondary }]}>Active</Text>
                  <Switch
                    value={!!customer.is_active}
                    onValueChange={handleToggleActive}
                    trackColor={{ true: colors.primary, false: colors.disabled }}
                  />
                </View>
              </View>
              <View style={styles.heroBalance}>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>{customer.points_balance}</Text>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>POINTS</Text>
                <Text style={[styles.lifetime, { color: colors.disabled }]}>lifetime {customer.lifetime_points}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <GradientButton title="＋ Add / Deduct" onPress={() => setShowAdjust(true)} height={44} style={{ flex: 1 }} />
              <GradientButton title="📱 Scan to Download" onPress={() => setShowDownload(true)} height={44} glow={false} style={{ flex: 1 }} />
            </View>

            {/* QR card */}
            <LoyaltyQrCard ref={cardRef} code={customer.code} nickname={customer.name} storeName={storeName} />

            {/* Edit form */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DETAILS</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
              value={name}
              onChangeText={setName}
              placeholder="Nickname"
              placeholderTextColor={colors.disabled}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.disabled}
              keyboardType="phone-pad"
            />
            <GradientButton title="Save Details" onPress={handleSave} height={44} glow={false} />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HISTORY ({ledger.length})</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyHistory, { color: colors.disabled }]}>No activity yet</Text>
        }
      />

      {/* Scan-to-download modal */}
      <CardDownloadModal
        visible={showDownload}
        onClose={() => setShowDownload(false)}
        code={customer.code}
        nickname={customer.name}
      />

      {/* Adjust points modal */}
      <Modal visible={showAdjust} transparent animationType="fade" onRequestClose={() => setShowAdjust(false)}>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.glassStroke }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Adjust Points</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Use a negative number to deduct (e.g. -50). Balance: {customer.points_balance}
            </Text>
            <TextInput
              style={[styles.input, styles.amountInput, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
              value={adjustAmount}
              onChangeText={(t) => setAdjustAmount(t.replace(/[^-\d]/g, ''))}
              placeholder="+100 or -50"
              placeholderTextColor={colors.disabled}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
              value={adjustNote}
              onChangeText={setAdjustNote}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.disabled}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.glassStroke }]} onPress={() => setShowAdjust(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={handleAdjust}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  heroName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  heroMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  activeLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroBalance: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  lifetime: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  ledgerDesc: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  ledgerDate: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  ledgerDelta: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    marginLeft: SPACING.sm,
  },
  emptyHistory: {
    textAlign: 'center',
    padding: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: FONT_SIZES.xs,
    marginVertical: SPACING.sm,
  },
  amountInput: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADII.full,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
});
