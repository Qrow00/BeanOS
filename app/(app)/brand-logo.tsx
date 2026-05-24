import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../src/utils/constants';
import { useThemeStore } from '../../src/store/themeStore';
import Logo from '../../src/components/ui/Logo';
import Card from '../../src/components/ui/Card';

export default function BrandLogoScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)/settings')}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Brand Logo</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Light Theme</Text>
          <View style={styles.logoContainer}>
            <Logo size="large" editable />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dark Theme</Text>
          <View style={styles.logoContainer}>
            <Logo size="large" previewMode="dark" />
          </View>
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
    marginBottom: SPACING.md,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
});
