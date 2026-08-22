import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    if (visible) {
      setManualCode('');
      setStatus({ type: 'idle', message: '' });
    } else {
      setShowScanner(false);
    }
  }, [visible]);

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

      <View style={styles.manualRow}>
        <TextInput
          style={[styles.codeInput, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
          value={manualCode}
          onChangeText={text => { setManualCode(text.toUpperCase()); setStatus({ type: 'idle', message: '' }); }}
          placeholder="LC-XXXXXX"
          placeholderTextColor={colors.disabled}
          autoCapitalize="characters"
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
