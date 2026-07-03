import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../src/utils/constants';
import { useThemeStore } from '../../src/store/themeStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { getBluetoothDeviceList, printReceipt } from '../../src/services/printer';
import type { BluetoothDevice } from '../../src/services/printer';

const CONNECTION_TYPES = [
  { key: 'none' as const, label: 'Disabled' },
  { key: 'bluetooth' as const, label: 'Bluetooth' },
  { key: 'network' as const, label: 'WiFi / Network' },
];

const PAPER_SIZES = [
  { key: 58 as const, label: '58mm' },
  { key: 80 as const, label: '80mm' },
];

export default function PrinterSettingsScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { printerConfig, savePrinterConfig } = useSettingsStore();

  const [connectionType, setConnectionType] = useState(printerConfig.connectionType);
  const [ipAddress, setIpAddress] = useState(printerConfig.ipAddress);
  const [port, setPort] = useState(String(printerConfig.port));
  const [macAddress, setMacAddress] = useState(printerConfig.macAddress);
  const [paperSize, setPaperSize] = useState(printerConfig.paperSize);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const list = await getBluetoothDeviceList();
      setDevices(list);
      if (list.length === 0) {
        Alert.alert('No Devices', 'No Bluetooth devices found. Make sure your printer is paired.');
      }
    } catch {
      Alert.alert('Error', 'Failed to scan for Bluetooth devices');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    await savePrinterConfig({
      connectionType,
      ipAddress: connectionType === 'network' ? ipAddress : '',
      port: connectionType === 'network' ? parseInt(port || '9100', 10) : 9100,
      macAddress: connectionType === 'bluetooth' ? macAddress : '',
      paperSize,
    });
    Alert.alert('Saved', 'Printer configuration saved');
  };

  const handleTestPrint = async () => {
    try {
      const config = {
        connectionType,
        ipAddress: connectionType === 'network' ? ipAddress : '',
        port: connectionType === 'network' ? parseInt(port || '9100', 10) : 9100,
        macAddress: connectionType === 'bluetooth' ? macAddress : '',
        paperSize,
      };
      const storeName = useSettingsStore.getState().storeName;
      await printReceipt(config, {
        storeName,
        receiptNumber: 'TEST-001',
        items: [
          { product: { id: 0, item_id: '', name: 'Test Product', category: '', price: 100, stock_quantity: 0, stock_unit: 'pcs', barcode: null, description: null, image_uri: null, icon_color: null, created_at: '', updated_at: '' }, quantity: 2 },
        ],
        subtotal: 200,
        discount: 0,
        total: 200,
        paymentMethod: 'cash',
        amountTendered: 200,
        change: 0,
        cashierName: 'Admin',
        date: new Date().toISOString(),
      });
      Alert.alert('Success', 'Test print sent');
    } catch (err: any) {
      Alert.alert('Print Failed', err?.message || 'Could not print');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/settings')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Printer</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Connection Type</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>How is your receipt printer connected?</Text>
          <View style={styles.optionRow}>
            {CONNECTION_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.optionChip, { borderColor: colors.border }, connectionType === t.key && { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                onPress={() => setConnectionType(t.key)}
              >
                <Text style={[styles.optionText, { color: colors.text }, connectionType === t.key && { color: colors.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {connectionType === 'bluetooth' && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bluetooth Printer</Text>
            <Button title={scanning ? 'Scanning...' : 'Scan for Devices'} onPress={handleScan} loading={scanning} variant="outline" style={{ marginBottom: SPACING.md }} />
            {devices.length > 0 && (
              <View>
                {devices.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.deviceRow, { borderBottomColor: colors.border }, macAddress === d.macAddress && { backgroundColor: colors.primarySurface }]}
                    onPress={() => setMacAddress(d.macAddress)}
                  >
                    <Text style={[styles.deviceName, { color: colors.text }]}>{d.name}</Text>
                    <Text style={[styles.deviceMac, { color: colors.textSecondary }]}>{d.macAddress}</Text>
                    {macAddress === d.macAddress && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {macAddress ? (
              <Text style={[styles.selectedText, { color: colors.success }]}>Selected: {macAddress}</Text>
            ) : (
              <Text style={[styles.selectedText, { color: colors.disabled }]}>No device selected</Text>
            )}
          </Card>
        )}

        {connectionType === 'network' && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Network Printer</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>IP Address</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="192.168.1.100"
              placeholderTextColor={colors.disabled}
              keyboardType="decimal-pad"
              autoCapitalize="none"
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Port</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={port}
              onChangeText={setPort}
              placeholder="9100"
              placeholderTextColor={colors.disabled}
              keyboardType="number-pad"
            />
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Paper Size</Text>
          <View style={styles.optionRow}>
            {PAPER_SIZES.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.optionChip, { borderColor: colors.border }, paperSize === s.key && { borderColor: colors.primary, backgroundColor: colors.primarySurface }]}
                onPress={() => setPaperSize(s.key)}
              >
                <Text style={[styles.optionText, { color: colors.text }, paperSize === s.key && { color: colors.primary }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button title="Save Configuration" onPress={handleSave} variant="primary" style={{ marginBottom: SPACING.md }} />
        <Button title="Test Print" onPress={handleTestPrint} variant="outline" style={{ marginBottom: SPACING.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
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
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
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
  optionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  deviceName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  deviceMac: {
    fontSize: FONT_SIZES.xs,
    marginRight: SPACING.sm,
  },
  checkmark: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  selectedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
});
