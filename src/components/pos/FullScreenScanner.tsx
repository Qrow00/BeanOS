import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface FullScreenScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function FullScreenScanner({ visible, onClose, onScan }: FullScreenScannerProps) {
  const colors = useThemeStore(s => s.colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  if (!visible) return null;

  const handleScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    onScan(result.data);
  };

  return (
    <RNModal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={handleScanned}
            >
              <View style={styles.frameWrap}>
                <View style={[styles.scanFrame, { borderColor: colors.primary }]} />
              </View>
            </CameraView>

            <View style={[styles.topBar, { paddingTop: (StatusBar.currentHeight ?? 0) + SPACING.sm }]}>
              <Text style={[styles.title, { color: '#fff' }]}>Scan Member Card</Text>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.3)' }]}
              >
                <Text style={[styles.closeText, { color: '#fff' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hintWrap} pointerEvents="none">
              <View style={[styles.hintPill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                <Text style={[styles.hintText, { color: '#fff' }]}>Point the camera at the member&apos;s QR card</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.permissionWrap}>
            <Text style={[styles.permissionText, { color: colors.textSecondary }]}>Camera permission required</Text>
          </View>
        )}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderRadius: RADII.lg,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    alignItems: 'center',
  },
  hintPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
  },
  hintText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZES.sm,
  },
});
