import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, RADII } from '../../src/utils/constants';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from '../../src/i18n';
import FadeInView from '../../src/components/ui/FadeInView';
import PressableScale from '../../src/components/ui/PressableScale';
import { useAnimationSession } from '../../src/hooks/useAnimationSession';
import { elasticScroll } from '../../src/utils/motion';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  title: string;
  subtitle: string;
  icon: IconName;
  route: string;
}

export default function MoreScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { isAdmin } = useAuthStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { t } = useTranslation();
  const animationSession = useAnimationSession();

  const MANAGEMENT_LINKS: NavItem[] = [
    { title: t('more_members_title'), subtitle: t('more_members_sub'), icon: 'card-outline', route: '/(app)/customers' },
    { title: t('more_finance_title'), subtitle: t('more_finance_sub'), icon: 'wallet-outline', route: '/(app)/finance' },
  ];

  const SYSTEM_LINKS: NavItem[] = [
    { title: t('more_users_title'), subtitle: t('more_users_sub'), icon: 'people-outline', route: '/(app)/users' },
    { title: t('more_settings_title'), subtitle: t('more_settings_sub'), icon: 'settings-outline', route: '/(app)/settings' },
  ];

  const renderItem = (item: NavItem, index: number) => (
    <FadeInView key={item.route} index={index} onceKey={`${animationSession}-more-${item.route}`}>
      <PressableScale
        style={[styles.row, { backgroundColor: colors.glassFill, borderColor: colors.glassStroke }]}
        onPress={() => router.push(item.route as any)}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
          <Ionicons name={item.icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </PressableScale>
    </FadeInView>
  );

  return (
    <ScrollView
      {...elasticScroll}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: isLandscape ? 96 : 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.text }]}>{t('more_heading')}</Text>

      {isAdmin() && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('more_management')}</Text>
          {MANAGEMENT_LINKS.map(renderItem)}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('more_system')}</Text>
      {SYSTEM_LINKS.map(renderItem)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md },
  heading: { fontSize: FONT_SIZES.xxl, fontWeight: '700', marginTop: SPACING.sm, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADII.sm, borderWidth: 1, marginBottom: SPACING.sm },
  iconWrap: { width: 40, height: 40, borderRadius: RADII.full, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FONT_SIZES.md, fontWeight: '700' },
  rowSubtitle: { fontSize: FONT_SIZES.sm, marginTop: 2 },
});
