import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Switch, TouchableOpacity, Modal, FlatList, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, FONT_SIZES, APP_NAME } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useProductStore } from '../../src/store/productStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getDatabase } from '../../src/database/connection';
import { exportToExcel, importFromExcel } from '../../src/services/importExport';
import Logo from '../../src/components/ui/Logo';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';

const currencies = [
  { symbol: '₱', code: 'PHP', label: 'Philippine Peso' },
  { symbol: '$', code: 'USD', label: 'US Dollar' },
  { symbol: '€', code: 'EUR', label: 'Euro' },
  { symbol: '£', code: 'GBP', label: 'British Pound' },
  { symbol: '¥', code: 'JPY', label: 'Japanese Yen' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { fetchProducts } = useProductStore();
  const { colors, mode, toggleTheme } = useThemeStore();
  const { currencySymbol, currencyCode, setCurrency, gcashQrUri, gcashCompanyName, mayaQrUri, mayaCompanyName, saveGcashQr, saveGcashCompanyName, saveMayaQr, saveMayaCompanyName } = useSettingsStore();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Brand Logo</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Tap to change your brand logo — previewed in both themes</Text>
        <View style={styles.logoRow}>
          <View style={styles.logoCol}>
            <Text style={[styles.logoLabel, { color: colors.textSecondary }]}>☀️ Light</Text>
            <Logo size="large" editable />
          </View>
          <View style={styles.logoCol}>
            <Text style={[styles.logoLabel, { color: colors.textSecondary }]}>🌙 Dark</Text>
            <Logo size="large" previewMode="dark" />
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.themeRow}>
          <View style={styles.themeInfo}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dark Mode</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Toggle between light and dark appearance</Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.disabled, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select the currency used throughout the app</Text>
        <Text style={[styles.currentCurrency, { color: colors.primary }]}>
          Current: {currencySymbol} ({currencyCode})
        </Text>
        <Button title="Change Currency" onPress={() => setShowCurrencyModal(true)} variant="outline" />
      </Card>

      <Modal visible={showCurrencyModal} transparent animationType="slide" onRequestClose={() => setShowCurrencyModal(false)}>
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment QR Codes</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Set QR code images and company names for GCash and Maya payments</Text>

        <Text style={[styles.qrSectionLabel, { color: colors.text }]}>GCash</Text>
        <TouchableOpacity
          style={[styles.qrPicker, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission Required', 'Camera roll access is needed to set the QR code.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
              aspect: [1, 1],
            });
            if (!result.canceled && result.assets[0]) {
              await saveGcashQr(result.assets[0].uri);
            }
          }}
        >
          {gcashQrUri ? (
            <Image source={{ uri: gcashQrUri }} style={styles.qrPreview} resizeMode="contain" />
          ) : (
            <View style={styles.qrPickerPlaceholder}>
              <Text style={[styles.qrPickerIcon, { color: colors.textSecondary }]}>📱</Text>
              <Text style={[styles.qrPickerText, { color: colors.textSecondary }]}>Tap to set QR</Text>
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.qrNameInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={gcashCompanyName}
          onChangeText={saveGcashCompanyName}
          placeholder="e.g. My Store GCash"
          placeholderTextColor={colors.disabled}
        />

        <Text style={[styles.qrSectionLabel, { color: colors.text, marginTop: SPACING.md }]}>Maya</Text>
        <TouchableOpacity
          style={[styles.qrPicker, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission Required', 'Camera roll access is needed to set the QR code.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
              aspect: [1, 1],
            });
            if (!result.canceled && result.assets[0]) {
              await saveMayaQr(result.assets[0].uri);
            }
          }}
        >
          {mayaQrUri ? (
            <Image source={{ uri: mayaQrUri }} style={styles.qrPreview} resizeMode="contain" />
          ) : (
            <View style={styles.qrPickerPlaceholder}>
              <Text style={[styles.qrPickerIcon, { color: colors.textSecondary }]}>📱</Text>
              <Text style={[styles.qrPickerText, { color: colors.textSecondary }]}>Tap to set QR</Text>
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.qrNameInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={mayaCompanyName}
          onChangeText={saveMayaCompanyName}
          placeholder="e.g. My Store Maya"
          placeholderTextColor={colors.disabled}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Store Information</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Store Name</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{APP_NAME}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Logged in as</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username} ({user?.role})</Text>
        </View>
      </Card>

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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>{APP_NAME} v1.0.0</Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>Offline-First Mobile POS System</Text>
      </Card>

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: '#FF3B30' }]}
        onPress={() => {
          logout();
          router.replace('/(auth)/login');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  sectionDesc: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: SPACING.md,
  },
  logoCol: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
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
  qrSectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  qrPicker: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  qrPreview: {
    width: '100%',
    height: '100%',
  },
  qrPickerPlaceholder: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  qrPickerIcon: {
    fontSize: 32,
  },
  qrPickerText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  qrNameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.sm,
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
