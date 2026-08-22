import { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SPACING, FONT_SIZES, RADII } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { useCustomerStore } from '../../../src/store/customerStore';
import GradientButton from '../../../src/components/ui/glass/GradientButton';
import LoyaltyQrCard, { LoyaltyQrCardHandle } from '../../../src/components/customers/LoyaltyQrCard';
import CardDownloadModal from '../../../src/components/customers/CardDownloadModal';

export default function NewCustomerScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const storeName = useSettingsStore(s => s.storeName);
  const addCustomer = useCustomerStore(s => s.addCustomer);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: number; code: string; name: string } | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const cardRef = useRef<LoyaltyQrCardHandle>(null);

  useFocusEffect(
    useCallback(() => {
      setCreated(null);
      setName('');
      setPhone('');
      setSaving(false);
      setShowDownload(false);
    }, [])
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const customer = await addCustomer(name, phone || null);
      setCreated({ id: customer.id, code: customer.code, name: customer.name });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create member');
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.createdContent}>
        <Text style={[styles.doneTitle, { color: colors.text }]}>Member created 🎉</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tap "Scan to Download" and let {created.name} scan the QR with their phone — they'll get a card page they can screenshot and keep.
        </Text>

        <LoyaltyQrCard ref={cardRef} code={created.code} nickname={created.name} storeName={storeName} />

        <GradientButton
          title="📱 Scan to Download"
          onPress={() => setShowDownload(true)}
          height={50}
          style={styles.actionBtn}
        />
        <GradientButton
          title="Open Member Profile"
          onPress={() => router.replace(`/(app)/customers/${created.id}`)}
          height={50}
          glow={false}
          style={styles.actionBtn}
        />
        <TouchableOpacity onPress={() => router.replace('/(app)/customers')} style={styles.linkWrap}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Back to members</Text>
        </TouchableOpacity>

        <CardDownloadModal
          visible={showDownload}
          onClose={() => setShowDownload(false)}
          code={created.code}
          nickname={created.name}
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Member</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: colors.textSecondary }]}>NICKNAME *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Maria"
          placeholderTextColor={colors.disabled}
          autoFocus
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>PHONE (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.glassFillStrong, color: colors.text, borderColor: colors.glassStroke }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="09XX XXX XXXX"
          placeholderTextColor={colors.disabled}
          keyboardType="phone-pad"
        />

        <Text style={[styles.note, { color: colors.disabled }]}>
          A unique loyalty code and QR card are generated automatically.
        </Text>

        <GradientButton
          title="Create Member"
          onPress={handleCreate}
          loading={saving}
          disabled={!name.trim()}
          height={52}
          style={{ alignSelf: 'stretch', marginTop: SPACING.md }}
        />
        {saving && <ActivityIndicator style={{ marginTop: SPACING.sm }} color={colors.primary} />}
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,160,0.3)',
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  form: {
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.lg,
  },
  note: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  createdContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginVertical: SPACING.md,
    lineHeight: 20,
  },
  actionBtn: {
    alignSelf: 'stretch',
    marginTop: SPACING.md,
  },
  linkWrap: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  backLink: {
    fontWeight: '600',
  },
});
