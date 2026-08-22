import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { SPACING, FONT_SIZES, RADII } from '../../utils/constants';

interface CardDownloadModalProps {
  visible: boolean;
  onClose: () => void;
  code: string;
  nickname: string;
}

function buildCardUrl(base: string, code: string, nickname: string, storeName: string): string | null {
  const clean = base.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(clean)) return null;
  const params = [
    `c=${encodeURIComponent(code)}`,
    `n=${encodeURIComponent(nickname)}`,
  ];
  if (storeName) params.push(`s=${encodeURIComponent(storeName)}`);
  return `${clean}?${params.join('&')}`;
}

export default function CardDownloadModal({ visible, onClose, code, nickname }: CardDownloadModalProps) {
  const colors = useThemeStore(s => s.colors);
  const cardPageUrl = useSettingsStore(s => s.cardPageUrl);
  const storeName = useSettingsStore(s => s.storeName);

  const url = useMemo(
    () => buildCardUrl(cardPageUrl, code, nickname, storeName),
    [cardPageUrl, code, nickname, storeName]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.glassStroke }]}>
          <Text style={[styles.title, { color: colors.text }]}>Scan to Download</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ask {nickname} to scan this with their phone camera
          </Text>

          {url ? (
            <>
              <View style={styles.qrWrap}>
                <QRCode value={url} size={230} color="#1C1917" backgroundColor="#FFFFFF" />
              </View>
              <Text style={[styles.step, { color: colors.textSecondary }]}>
                📱 Their browser opens the loyalty card{'\n'}📸 They screenshot it and show it at checkout
              </Text>
            </>
          ) : (
            <View style={[styles.setupBox, { borderColor: colors.glassStroke }]}>
              <Text style={[styles.setupTitle, { color: colors.text }]}>One-time setup needed</Text>
              <Text style={[styles.setupText, { color: colors.textSecondary }]}>
                Host the file{' '}
                <Text style={{ fontWeight: '700' }}>loyalty-card-page/index.html</Text>
                {' '}from this project on any free static host (Netlify Drop, GitHub Pages, Vercel), then paste the link in{' '}
                <Text style={{ fontWeight: '700' }}>Settings → Loyalty Program → Member card page URL</Text>.
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  qrWrap: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: '#FFFFFF',
  },
  step: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
  setupBox: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  setupTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    marginBottom: 4,
  },
  setupText: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 17,
  },
  doneBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.full,
    marginTop: SPACING.lg,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
  },
});
