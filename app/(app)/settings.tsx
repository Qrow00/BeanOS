import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Switch, TouchableOpacity, Modal, FlatList, TextInput, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, RADII, APP_NAME } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useProductStore } from '../../src/store/productStore';
import { useThemeStore, lightTheme, darkTheme } from '../../src/store/themeStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getDatabase } from '../../src/database/connection';
import { formatDate } from '../../src/utils/helpers';
import { exportToExcel, importFromExcel } from '../../src/services/importExport';
import {
  isDeviceCapable,
  isEnabledGlobally,
  setEnabledGlobally,
  isEnrolledForUser,
  setEnrolledForUser,
  getAuthMethodLabel,
  promptBiometric,
} from '../../src/services/biometrics';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { elasticScroll } from '../../src/utils/motion';

const currencies = [
  { symbol: '₱', code: 'PHP', label: 'Philippine Peso' },
  { symbol: '$', code: 'USD', label: 'US Dollar' },
  { symbol: '€', code: 'EUR', label: 'Euro' },
  { symbol: '£', code: 'GBP', label: 'British Pound' },
  { symbol: '¥', code: 'JPY', label: 'Japanese Yen' },
];

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-PH', label: 'English (Philippines)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fil-PH', label: 'Filipino' },
  { value: 'es-ES', label: 'Español' },
  { value: 'id-ID', label: 'Bahasa Indonesia' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
  { value: 'zh-CN', label: '中文 (简体)' },
  { value: 'ar-SA', label: 'العربية' },
];

const TIMEZONES = [
  { value: '', label: 'Device default' },
  { value: 'Asia/Manila', label: 'Manila' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Taipei', label: 'Taipei' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Bangkok', label: 'Bangkok' },
  { value: 'Asia/Jakarta', label: 'Jakarta' },
  { value: 'Asia/Kolkata', label: 'Kolkata' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Riyadh', label: 'Riyadh' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Africa/Cairo', label: 'Cairo' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'America/Chicago', label: 'Chicago' },
  { value: 'America/Denver', label: 'Denver' },
  { value: 'America/Los_Angeles', label: 'Los Angeles' },
  { value: 'Pacific/Honolulu', label: 'Honolulu' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
  { value: 'UTC', label: 'UTC' },
];

type IconName = keyof typeof Ionicons.glyphMap;

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  const colors = useThemeStore(s => s.colors);
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {hint ? <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

function IconBadge({ name }: { name: IconName }) {
  const colors = useThemeStore(s => s.colors);
  return (
    <View style={[styles.iconBadge, { backgroundColor: colors.primarySurface }]}>
      <Ionicons name={name} size={18} color={colors.primary} />
    </View>
  );
}

function SettingRow({
  icon,
  title,
  value,
  onPress,
  last,
}: {
  icon: IconName;
  title: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const colors = useThemeStore(s => s.colors);
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowDivider, { borderBottomColor: colors.glassStroke }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconBadge name={icon} />
      <Text style={[styles.rowTitle, styles.rowTitleFlex, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {value ? (
        <Text style={[styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuthStore();
  const { fetchProducts } = useProductStore();
  const { colors, mode, toggleTheme, setThemeOverlay } = useThemeStore();
  const { storeName, saveStoreName, currencySymbol, currencyCode, setCurrency } = useSettingsStore();
  const locale = useSettingsStore(s => s.locale);
  const timeZone = useSettingsStore(s => s.timeZone);
  const saveLocale = useSettingsStore(s => s.saveLocale);
  const saveTimeZone = useSettingsStore(s => s.saveTimeZone);
  const loyaltyEarnRate = useSettingsStore(s => s.loyaltyEarnRate);
  const loyaltyPointValue = useSettingsStore(s => s.loyaltyPointValue);
  const saveLoyaltyRates = useSettingsStore(s => s.saveLoyaltyRates);
  const cardPageUrl = useSettingsStore(s => s.cardPageUrl);
  const saveCardPageUrl = useSettingsStore(s => s.saveCardPageUrl);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [earnRateInput, setEarnRateInput] = useState(String(loyaltyEarnRate));
  const [pointValueInput, setPointValueInput] = useState(String(loyaltyPointValue));
  const [cardUrlInput, setCardUrlInput] = useState(cardPageUrl);
  const [bioCapable, setBioCapable] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometrics');
  const [globalBio, setGlobalBio] = useState(false);
  const [userBio, setUserBio] = useState(false);
  const switchRef = useRef<View>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const capable = await isDeviceCapable();
        const label = await getAuthMethodLabel();
        const global = capable && (await isEnabledGlobally());
        const enrolled = user && global ? await isEnrolledForUser(user.id) : false;
        if (!cancelled) {
          setBioCapable(capable);
          setBioLabel(label);
          setGlobalBio(global);
          setUserBio(enrolled);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const db = await getDatabase();
      await exportToExcel(db);
      Alert.alert('Success', 'Inventory exported successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to export inventory');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const db = await getDatabase();
      const result = await importFromExcel(db);
      if (result.added > 0 || result.updated > 0) {
        Alert.alert('Import Complete', `Added: ${result.added}\nUpdated: ${result.updated}`);
        fetchProducts();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to import inventory');
    } finally {
      setImporting(false);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const diagnostic = [
        `Channel: ${Updates.channel || 'none'}`,
        `Runtime: ${Updates.runtimeVersion || 'unknown'}`,
        `Update ID: ${Updates.updateId ? Updates.updateId.slice(0, 8) : 'embedded'}`,
      ].join('\n');

      if (!Updates.isEnabled) {
        Alert.alert(
          'Updates Not Enabled',
          `This build cannot receive over-the-air updates.\n\n${diagnostic}\n\nRebuild with an EAS profile that has a channel (preview or production).`
        );
        return;
      }

      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new update is available. Download and restart now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert('Update Ready', 'Restarting to apply the update...', [
                    { text: 'OK', onPress: () => Updates.reloadAsync() },
                  ]);
                } catch (e: any) {
                  Alert.alert(
                    'Download Failed',
                    `Could not download the update.\n\n${e?.message ?? String(e)}`
                  );
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to Date', `You are running the latest version.\n\n${diagnostic}`);
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? 'Unknown error');
      if (msg.includes('ERR_UPDATES_DISABLED')) {
        Alert.alert('Not Available', 'Updates are only available in release builds.');
      } else {
        Alert.alert('Update Check Failed', msg);
      }
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleThemeToggle = () => {
    switchRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const oldBg = mode === 'dark' ? darkTheme.background : lightTheme.background;
      const newBg = mode === 'dark' ? lightTheme.background : darkTheme.background;
      toggleTheme();
      setThemeOverlay({ originX: pageX + width / 2, originY: pageY + height / 2, overlayBg: oldBg, newBg });
    });
  };

  const handleToggleGlobalBiometric = async (v: boolean) => {
    setGlobalBio(v);
    if (!v) setUserBio(false);
    await setEnabledGlobally(v);
  };

  const handleToggleUserBiometric = async (v: boolean) => {
    if (!user) return;
    if (v && !(await promptBiometric(`Confirm ${bioLabel} for ${user.display_name}`))) return;
    setUserBio(v);
    await setEnrolledForUser(user.id, v);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        {...elasticScroll}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: isLandscape ? 80 : 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.section}>
          <SectionHeader title="Store Information" />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Store name</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.glassStroke, backgroundColor: colors.glassFillStrong }]}
            value={storeName}
            onChangeText={saveStoreName}
            placeholder="Store name"
            placeholderTextColor={colors.disabled}
          />
          <View style={styles.row}>
            <IconBadge name="person-outline" />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{user?.username}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                {user?.role === 'admin' ? 'Administrator' : 'Staff'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <SectionHeader title="Language & Region" hint="Applies to dates, times and amounts" />
          <SettingRow
            icon="globe-outline"
            title="Language"
            value={LANGUAGES.find(l => l.value === locale)?.label ?? locale}
            onPress={() => setShowLanguageModal(true)}
          />
          <SettingRow
            icon="time-outline"
            title="Time zone"
            value={TIMEZONES.find(t => t.value === timeZone)?.label ?? timeZone}
            onPress={() => setShowTimeZoneModal(true)}
          />
          <SettingRow
            icon="cash-outline"
            title="Currency"
            value={`${currencySymbol} (${currencyCode})`}
            onPress={() => setShowCurrencyModal(true)}
            last
          />
          <View style={[styles.preview, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview · current date & time</Text>
            <Text style={[styles.previewValue, { color: colors.primary }]}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <SectionHeader title="Appearance" />
          <View style={styles.toggleRow}>
            <IconBadge name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Dark mode</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Switch between light and dark</Text>
            </View>
            <View ref={switchRef} collapsable={false}>
              <Switch
                value={mode === 'dark'}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <SectionHeader title="Security" hint="Biometric sign-in on this device" />
          {isAdmin() && (
            <View style={[styles.toggleRow, styles.rowDivider, { borderBottomColor: colors.glassStroke }]}>
              <IconBadge name="shield-checkmark-outline" />
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Allow on this device</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  {bioCapable ? `${bioLabel} detected` : 'No biometric hardware found'}
                </Text>
              </View>
              <Switch
                value={globalBio}
                disabled={!bioCapable}
                onValueChange={handleToggleGlobalBiometric}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          )}
          <View style={styles.toggleRow}>
            <IconBadge name="finger-print-outline" />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Sign in with {bioLabel.toLowerCase()}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                {!bioCapable
                  ? `${bioLabel} not available on this device`
                  : !globalBio
                    ? 'Currently unavailable'
                    : userBio
                      ? `You can sign in with ${bioLabel}`
                      : 'Enable to skip your PIN'}
              </Text>
            </View>
            <Switch
              value={userBio && globalBio && bioCapable}
              disabled={!globalBio || !bioCapable}
              onValueChange={handleToggleUserBiometric}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <SectionHeader title="Manage" />
          <SettingRow icon="receipt-outline" title="Sales History" onPress={() => router.push('/(app)/pos/history')} />
          <SettingRow icon="pricetags-outline" title="Brand Logo" onPress={() => router.push('/(app)/brand-logo')} />
          <SettingRow icon="qr-code-outline" title="Payment QR Codes" onPress={() => router.push('/(app)/payment-qr')} last />
        </Card>

        {isAdmin() && (
          <Card style={styles.section}>
            <SectionHeader title="Loyalty Program" hint="Members earn points on every purchase" />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Pesos spent per point earned</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.glassStroke, backgroundColor: colors.glassFillStrong }]}
              value={earnRateInput}
              onChangeText={(t) => setEarnRateInput(t.replace(/[^.\d]/g, ''))}
              onEndEditing={() => {
                const v = Math.max(0.01, Number(earnRateInput) || 50);
                setEarnRateInput(String(v));
                saveLoyaltyRates(v, Number(pointValueInput) || loyaltyPointValue);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Discount value of 1 point ({currencySymbol})</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.glassStroke, backgroundColor: colors.glassFillStrong }]}
              value={pointValueInput}
              onChangeText={(t) => setPointValueInput(t.replace(/[^.\d]/g, ''))}
              onEndEditing={() => {
                const v = Math.max(0.01, Number(pointValueInput) || 1);
                setPointValueInput(String(v));
                saveLoyaltyRates(Number(earnRateInput) || loyaltyEarnRate, v);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Member card page URL</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.glassStroke, backgroundColor: colors.glassFillStrong }]}
              value={cardUrlInput}
              onChangeText={setCardUrlInput}
              onEndEditing={() => saveCardPageUrl(cardUrlInput)}
              placeholder="https://your-card-page.netlify.app"
              placeholderTextColor={colors.disabled}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={[styles.sectionDesc, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
              Host loyalty-card-page/index.html online, paste the link so members can scan to download their card.
            </Text>
          </Card>
        )}

        <Card style={styles.section}>
          <SectionHeader title="Data Management" hint="Export inventory to Excel or bulk import from a file" />
          <View style={styles.buttonRow}>
            <Button title="Export" onPress={handleExport} variant="primary" loading={exporting} style={styles.flexBtn} />
            <Button title="Import" onPress={handleImport} variant="outline" loading={importing} style={styles.flexBtn} />
          </View>
        </Card>

        <Card style={styles.section}>
          <SectionHeader title="About" />
          <View style={styles.row}>
            <IconBadge name="information-circle-outline" />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{APP_NAME}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                Offline-first mobile POS · v{Constants.expoConfig?.version ?? '1.0.0'}
              </Text>
            </View>
          </View>
          <Button
            title="Check for Updates"
            onPress={handleCheckUpdate}
            variant="outline"
            loading={checkingUpdate}
            style={{ marginTop: SPACING.sm }}
          />
        </Card>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.danger }]}
          onPress={() => { logout(); router.replace('/(auth)/login'); }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)} statusBarTranslucent>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
              <FlatList
                {...elasticScroll}
                data={LANGUAGES}
                keyExtractor={l => l.value}
                renderItem={({ item: l }) => (
                  <TouchableOpacity
                    style={[styles.modalRow, { borderBottomColor: colors.glassStroke }, locale === l.value && { backgroundColor: colors.primarySurface }]}
                    onPress={() => { saveLocale(l.value); setShowLanguageModal(false); }}
                  >
                    <View style={styles.modalRowInfo}>
                      <Text style={[styles.currencyLabel, { color: colors.text }]}>{l.label}</Text>
                      <Text style={[styles.currencyDesc, { color: colors.textSecondary }]}>{l.value}</Text>
                    </View>
                    {locale === l.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowLanguageModal(false)}>
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showTimeZoneModal} transparent animationType="slide" onRequestClose={() => setShowTimeZoneModal(false)} statusBarTranslucent>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time Zone</Text>
              <FlatList
                {...elasticScroll}
                data={TIMEZONES}
                keyExtractor={t => t.value || 'device'}
                renderItem={({ item: t }) => (
                  <TouchableOpacity
                    style={[styles.modalRow, { borderBottomColor: colors.glassStroke }, timeZone === t.value && { backgroundColor: colors.primarySurface }]}
                    onPress={() => { saveTimeZone(t.value); setShowTimeZoneModal(false); }}
                  >
                    <View style={styles.modalRowInfo}>
                      <Text style={[styles.currencyLabel, { color: colors.text }]}>{t.label}</Text>
                      {t.value ? (
                        <Text style={[styles.currencyDesc, { color: colors.textSecondary }]}>{t.value}</Text>
                      ) : null}
                    </View>
                    {timeZone === t.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTimeZoneModal(false)}>
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showCurrencyModal} transparent animationType="slide" onRequestClose={() => setShowCurrencyModal(false)} statusBarTranslucent>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <FlatList
                {...elasticScroll}
                data={currencies}
                keyExtractor={c => c.code}
                renderItem={({ item: c }) => (
                  <TouchableOpacity
                    style={[styles.modalRow, { borderBottomColor: colors.glassStroke }, currencyCode === c.code && { backgroundColor: colors.primarySurface }]}
                    onPress={() => {
                      setCurrency(c.symbol, c.code);
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={[styles.modalSymbol, { color: colors.text }]}>{c.symbol}</Text>
                    <View style={styles.modalRowInfo}>
                      <Text style={[styles.currencyLabel, { color: colors.text }]}>{c.code}</Text>
                      <Text style={[styles.currencyDesc, { color: colors.textSecondary }]}>{c.label}</Text>
                    </View>
                    {currencyCode === c.code && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCurrencyModal(false)}>
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionDesc: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: SPACING.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: SPACING.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  rowTitleFlex: {
    flex: 1,
  },
  rowSubtitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: 1,
  },
  rowValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    maxWidth: 160,
    textAlign: 'right',
  },
  preview: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  flexBtn: {
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.sm,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl + 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: SPACING.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.sm,
    marginBottom: SPACING.xs,
  },
  modalSymbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  modalRowInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  currencyDesc: {
    fontSize: FONT_SIZES.xs,
    marginTop: 1,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalCloseText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
