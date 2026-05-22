import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, FONT_SIZES } from '../../src/utils/constants';
import { useThemeStore } from '../../src/store/themeStore';
import { getDatabase } from '../../src/database/connection';

export default function LoyaltyCardScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const [loyaltyUri, setLoyaltyUri] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedImages();
  }, []);

  const loadSavedImages = async () => {
    try {
      const db = await getDatabase();
      const card = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'loyalty_card_image'
      );
      if (card?.value) setLoyaltyUri(card.value);
      const qr = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        'loyalty_qr_image'
      );
      if (qr?.value) setQrUri(qr.value);
    } catch {} finally {
      setLoading(false);
    }
  };

  const pickImage = async (key: string, setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setter(uri);
      try {
        const db = await getDatabase();
        await db.runAsync(
          'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
          key,
          uri
        );
      } catch {}
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Loyalty Card</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          onPress={() => pickImage('loyalty_qr_image', setQrUri)}
          activeOpacity={0.7}
          style={[styles.qrBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {qrUri ? (
            <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>▦</Text>
              <Text style={[styles.qrText, { color: colors.textSecondary }]}>Tap to upload QR code</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          onPress={() => pickImage('loyalty_card_image', setLoyaltyUri)}
          activeOpacity={0.7}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {loyaltyUri ? (
            <Image
              source={{ uri: loyaltyUri }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>💳</Text>
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>Your Loyalty Card</Text>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                Tap to upload your loyalty card image
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    paddingVertical: 0,
  },
  backBtn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  qrBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 240,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 240,
    height: 240,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  qrIcon: {
    fontSize: 48,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  qrText: {
    fontSize: FONT_SIZES.sm,
  },
  divider: {
    height: 1,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 250,
  },
  cardImage: {
    width: '100%',
    height: 250,
    borderRadius: 18,
  },
  placeholder: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
