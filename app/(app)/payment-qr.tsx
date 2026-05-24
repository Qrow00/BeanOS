import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, FONT_SIZES } from '../../src/utils/constants';
import { useThemeStore } from '../../src/store/themeStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import Card from '../../src/components/ui/Card';

export default function PaymentQRScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { gcashQrUri, gcashCompanyName, mayaQrUri, mayaCompanyName, saveGcashQr, saveGcashCompanyName, saveMayaQr, saveMayaCompanyName } = useSettingsStore();

  const pickImage = async (saveFn: (uri: string) => Promise<void>) => {
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
      await saveFn(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/settings')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Payment QR Codes</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>GCash</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Set QR code image and company name for GCash payments</Text>
          <TouchableOpacity
            style={[styles.qrPicker, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => pickImage(saveGcashQr)}
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
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Maya</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Set QR code image and company name for Maya payments</Text>
          <TouchableOpacity
            style={[styles.qrPicker, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => pickImage(saveMayaQr)}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
    gap: SPACING.md,
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
});
