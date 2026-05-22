import { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useCouponStore } from '../../../src/store/couponStore';
import { useAuthStore } from '../../../src/store/authStore';
import CouponCard from '../../../src/components/coupons/CouponCard';

export default function CouponsScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { coupons, fetchCoupons, deleteCoupon, isLoading } = useCouponStore();
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={coupons}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CouponCard
            coupon={item}
            onDelete={isAdmin() ? () => deleteCoupon(item.id) : undefined}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={fetchCoupons}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No coupons yet</Text>
          </View>
        }
      />

      {isAdmin() && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(app)/coupons/new')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  list: {
    paddingBottom: 80,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
