import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES, APP_NAME } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useProductStore } from '../../src/store/productStore';
import { useThemeStore } from '../../src/store/themeStore';
import Logo from '../../src/components/ui/Logo';

const menuItems = [
  { title: 'POS Terminal', icon: '🛒', route: '/(app)/pos', roles: ['admin', 'user'] },
  { title: 'Sales History', icon: '📋', route: '/(app)/pos/history', roles: ['admin', 'user'] },
  { title: 'Inventory', icon: '📦', route: '/(app)/inventory', roles: ['admin', 'user'] },
  { title: 'Finance', icon: '💸', route: '/(app)/finance', roles: ['admin'] },
  { title: 'Users', icon: '👥', route: '/(app)/users', roles: ['admin'] },
  { title: 'Loyalty Card', icon: '💳', route: '/(app)/loyalty', roles: ['admin', 'user'] },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const colors = useThemeStore(s => s.colors);

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStock = products.filter(p => p.stock_quantity <= 0).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Logo size="small" />
          <View style={styles.headerInfo}>
            <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
            <Text style={[styles.userName, { color: colors.textSecondary }]}>Welcome, {user?.display_name || user?.username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primarySurface }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        {isAdmin() && (
          <TouchableOpacity onPress={() => router.push('/(app)/settings')} style={styles.settingsBtn}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalProducts}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.warning }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{lowStockItems}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Low Stock</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.danger }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{outOfStock}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Out of Stock</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

        <View style={styles.menuGrid}>
          {menuItems
            .filter(item => isAdmin() || item.roles.includes('user'))
            .map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
        </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: SPACING.sm,
  },
  appName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  userName: {
    fontSize: FONT_SIZES.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  menuCard: {
    width: '48%',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  menuTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
