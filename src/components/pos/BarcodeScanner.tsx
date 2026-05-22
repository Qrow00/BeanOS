import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { SPACING, FONT_SIZES } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const colors = useThemeStore(s => s.colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Camera permission required</Text>
      </View>
    );
  }

  const handleScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    onScan(result.data);
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <CameraView
      style={styles.camera}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'upc_a', 'upc_e'] }}
      onBarcodeScanned={handleScanned}
    >
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 200,
    height: 120,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
  },
  placeholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
  },
});
