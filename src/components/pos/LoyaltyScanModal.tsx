import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Modal from '../ui/Modal';
import GradientButton from '../ui/glass/GradientButton';
import FullScreenScanner from '../pos/FullScreenScanner';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
import { getDatabase } from '../../database/connection';
import * as customersRepo from '../../database/customers';
import type { Customer } from '../../types/database';

interface LoyaltyScanModalProps {
  visible: boolean;
  onClose: () => void;
  onAttach: (customer: Customer) => void;
}

export default function LoyaltyScanModal({ visible, onClose, onAttach }: LoyaltyScanModalProps) {
  const colors = useThemeStore(s => s.colors);
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'ok'; message: string }>({ type: 'idle', message: '' });
  const [lookingUp, setLookingUp] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [members, setMembers] = useState<Customer[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (visible) {
      setManualCode('');
      setStatus({ type: 'idle', message: '' });
    } else {
      setShowScanner(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const query = manualCode.trim();
    setLoadingMembers(true);
    const timer = setTimeout(async () => {
      try {
        const db = await getDatabase();
        const list = query
          ? await customersRepo.searchCustomers(db, query)
          : await customersRepo.getAllCustomers(db);
        if (!cancelled) setMembers(list);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }, query ? 200 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [manualCode, visible]);

  const lookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLookingUp(true);
    try {
      const db = await getDatabase();
      const customer = await customersRepo.getCustomerByCode(db, trimmed);
      if (!customer) {
        setStatus({ type: 'error', message: `No member found for code "${trimmed}"` });
        return;
      }
      if (!customer.is_active) {
        setStatus({ type: 'error', message: `${customer.name} is inactive` });
        return;
      }
      setStatus({ type: 'ok', message: `${customer.name} · ${customer.points_balance} pts` });
      onAttach(customer);
      onClose();
    } catch {
      setStatus({ type: 'error', message: 'Lookup failed. Try again.' });
    } finally {
      setLookingUp(false);
    }
  };

  const handleScan = (code: string) => {
    setShowScanner(false);
    lookup(code);
  };

  const attach = (customer: Customer) => {
    onAttach(customer);
    onClose();
  };

  return (
    <Modal visible={visible} title="Loyalty Member" onClose={onClose}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Scan the member&apos;s QR card or enter their code.
      </Text>

      <GradientButton
        title="📷 Scan QR Card"
        onPress={() => setShowScanner(true)}
        height={46}
        fontSize={FONT_SIZES.sm}
        glow={false}
      />

      <FullScreenScanner
        visible={showScanner && visible}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      <View style={styles.memberList}>
        {loadingMembers ? (
          <View style={styles.listEmpty}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : members.length === 0 ? (
          <Text style={[styles.listEmptyText, { color: colors.textSecondary }]}>No members found</Text>
        ) : (
          <ScrollView
            style={styles.memberScroll}
            contentContainerStyle={styles.memberScrollContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {members.map(member => {
              const inactive = !member.is_active;
              return (
                <TouchableOpacity
                  key={member.id}
                  disabled={inactive}
                  onPress={() => attach(member)}
                  style={[styles.memberRow, { opacity: inactive ? 0.45 : 1 }]}
                >
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {member.code} · {member.points_balance} pts{inactive ? ' · Inactive' : ''}
                    </Text>
                  </View>
                  {!inactive && <Text style={[styles.memberChevron, { color: colors.primary }]}>›</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.manualRow}>
        <TextInput
          style={[styles.codeInput, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
          value={manualCode}
          onChangeText={text => { setManualCode(text); setStatus({ type: 'idle', message: '' }); }}
          placeholder="Search name or code"
          placeholderTextColor={colors.disabled}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => lookup(manualCode)}
        />
        <TouchableOpacity
          style={[styles.goBtn, { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
          onPress={() => lookup(manualCode)}
          disabled={lookingUp}
        >
          {lookingUp
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.goText, { color: colors.primary }]}>Find</Text>}
        </TouchableOpacity>
      </View>

      {status.type !== 'idle' && (
        <Text
          style={[
            styles.statusText,
            { color: status.type === 'error' ? colors.danger : colors.success },
          ]}
        >
          {status.message}
        </Text>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  memberList: {
    marginTop: SPACING.md,
  },
  memberScroll: {
    maxHeight: 200,
  },
  memberScrollContent: {
    paddingBottom: SPACING.xs,
  },
  listEmpty: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  listEmptyText: {
    paddingVertical: SPACING.md,
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  memberMeta: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  memberChevron: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginLeft: SPACING.sm,
  },
  manualRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    letterSpacing: 1,
  },
  goBtn: {
    paddingHorizontal: SPACING.lg,
    borderRadius: RADII.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: {
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
  },
  statusText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
