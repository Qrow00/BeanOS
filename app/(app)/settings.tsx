import { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Switch, TouchableOpacity, Modal, FlatList, TextInput, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES, APP_NAME } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useProductStore } from '../../src/store/productStore';
import { useThemeStore, lightTheme, darkTheme } from '../../src/store/themeStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getDatabase } from '../../src/database/connection';
import { exportToExcel, importFromExcel } from '../../src/services/importExport';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

const currencies = [
  { symbol: '₱', code: 'PHP', label: 'Philippine Peso' },
  { symbol: '$', code: 'USD', label: 'US Dollar' },
  { symbol: '€', code: 'EUR', label: 'Euro' },
  { symbol: '£', code: 'GBP', label: 'British Pound' },
  { symbol: '¥', code: 'JPY', label: 'Japanese Yen' },
];

const STAFF_NAV_LINKS = [
  { title: 'Sales History', icon: '📋', route: '/(app)/pos/history' },
] as const;

const ADMIN_NAV_LINKS = [
  { title: 'Sales History', icon: '📋', route: '/(app)/pos/history' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAdmin, logout } = useAuthStore();
  const { fetchProducts } = useProductStore();
  const { colors, mode, toggleTheme, setThemeOverlay } = useThemeStore();
  const { storeName, saveStoreName, currencySymbol, currencyCode, setCurrency } = useSettingsStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const switchRef = useRef<View>(null);

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
                  await Updates.reloadAsync();
                } catch {
                  Alert.alert('Error', 'Failed to download update');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You are running the latest version');
      }
    } catch (err: any) {
      if (String(err?.message ?? '').includes('ERR_UPDATES_DISABLED')) {
        Alert.alert('Not Available', 'Updates are only available in release builds');
      } else {
        Alert.alert('Error', 'Failed to check for updates');
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: isLandscape ? 76 : 100 }}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Store Information</Text>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Store Name</Text>
          <TextInput
            style={[styles.storeNameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={storeName}
            onChangeText={saveStoreName}
            placeholder="Store name"
            placeholderTextColor={colors.disabled}
          />
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Logged in as</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username} ({user?.role})</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.themeRow}>
            <View style={styles.themeInfo}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Toggle between light and dark appearance</Text>
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

        {isAdmin() && (
          <>
            {ADMIN_NAV_LINKS.map((action, i) => (
              <TouchableOpacity
                key={`nav-${i}`}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {!isAdmin() && (
          <>
            {STAFF_NAV_LINKS.map((action, i) => (
              <TouchableOpacity
                key={`staff-${i}`}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(app)/brand-logo')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>🏷️</Text>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Brand Logo</Text>
          <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(app)/payment-qr')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>📱</Text>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Payment QR Codes</Text>
          <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select the currency used throughout the app</Text>
          <Text style={[styles.currentCurrency, { color: colors.primary }]}>
            Current: {currencySymbol} ({currencyCode})
          </Text>
          <Button title="Change Currency" onPress={() => setShowCurrencyModal(true)} variant="outline" />
        </Card>

        <Modal visible={showCurrencyModal} transparent animationType="slide" onRequestClose={() => setShowCurrencyModal(false)} statusBarTranslucent>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <FlatList
                data={currencies}
                keyExtractor={c => c.code}
                renderItem={({ item: c }) => (
                  <TouchableOpacity
                    style={[styles.currencyRow, { borderBottomColor: colors.border }, currencyCode === c.code && { backgroundColor: colors.primarySurface }]}
                    onPress={() => {
                      setCurrency(c.symbol, c.code);
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={[styles.currencySymbol, { color: colors.text }]}>{c.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencyLabel, { color: colors.text }]}>{c.code}</Text>
                      <Text style={[styles.currencyDesc, { color: colors.textSecondary }]}>{c.label}</Text>
                    </View>
                    {currencyCode === c.code && (
                      <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
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

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Export your inventory to Excel or bulk import from a file</Text>
          <View style={styles.exportImportRow}>
            <Button
              title="Export to Excel"
              onPress={handleExport}
              variant="primary"
              loading={exporting}
              style={styles.actionBtn}
            />
            <Button
              title="Import from File"
              onPress={handleImport}
              variant="outline"
              loading={importing}
              style={styles.actionBtn}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Updates</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Check for new updates to the app</Text>
          <Button
            title="Check for Updates"
            onPress={handleCheckUpdate}
            variant="outline"
            loading={checkingUpdate}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>{APP_NAME} v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>Offline-First Mobile POS System</Text>
        </Card>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: '#FF3B30' }]}
          onPress={() => { logout(); router.replace('/(auth)/login'); }}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  actionIcon: {
    width: 28,
    fontSize: 20,
    textAlign: 'center',
    marginRight: SPACING.md,
  },
  actionTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  actionArrow: {
    width: 20,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'transparent',
    marginVertical: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  sectionDesc: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  currentCurrency: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.xs,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  currencyInfo: {
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
  checkmark: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  storeNameInput: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  exportImportRow: {
    gap: SPACING.sm,
  },
  actionBtn: {
    marginBottom: SPACING.xs,
  },
  aboutText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl + 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 22,
    marginRight: SPACING.sm,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
});
