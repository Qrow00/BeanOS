import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Animated, PanResponder, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZES, RADII } from '../../../src/utils/constants';
import { useThemeStore } from '../../../src/store/themeStore';
import { useCustomerStore } from '../../../src/store/customerStore';

type Customer = ReturnType<typeof useCustomerStore.getState>['customers'][number];

export default function CustomersScreen() {
  const router = useRouter();
  const colors = useThemeStore(s => s.colors);
  const { customers, fetchCustomers, isLoading, deleteCustomer } = useCustomerStore();
  const [query, setQuery] = useState('');
  const { height } = useWindowDimensions();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
    );
  }, [customers, query]);

  const requestDelete = (customer: Customer) => {
    Alert.alert(
      'Delete Member',
      `Delete "${customer.name}" and their points history?\nSales records will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomer(customer.id).catch(() =>
              Alert.alert('Error', 'Could not delete this member.')
            );
          },
        },
      ]
    );
  };

  const SwipeableRow = ({ item, children }: { item: Customer; children: React.ReactNode }) => {
    const itemRef = useRef(item);
    itemRef.current = item;
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteTranslate = translateX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          if (g.dx < 0) translateX.setValue(Math.max(g.dx, -80));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) requestDelete(itemRef.current);
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      })
    ).current;

    return (
      <View style={{ marginBottom: SPACING.xs }}>
        <View style={{ borderRadius: RADII.md, overflow: 'hidden' }}>
          <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
            {children}
          </Animated.View>
          <Animated.View style={[styles.swipeDeleteContainer, { backgroundColor: colors.danger, transform: [{ translateX: deleteTranslate }] }]}>
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Customer }) => (
    <SwipeableRow item={item}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.glassFillStrong, borderColor: item.is_active ? colors.glassStroke : colors.danger + '55' }]}
        onPress={() => router.push(`/(app)/customers/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.name}
            {!item.is_active && <Text style={{ color: colors.danger }}> · inactive</Text>}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {item.code}{item.phone ? ` · ${item.phone}` : ''}
          </Text>
        </View>
        <View style={styles.pointsBox}>
          <Text style={[styles.pointsValue, { color: colors.primary }]}>{item.points_balance}</Text>
          <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>pts</Text>
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}>
        <Text style={{ color: colors.textSecondary }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, code, or phone..."
          placeholderTextColor={colors.disabled}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: height > 500 ? 120 : 80 }]}
        refreshing={isLoading}
        onRefresh={fetchCustomers}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>
              {query ? 'No members match your search' : 'No loyalty members yet'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: 96 }]}
        onPress={() => router.push('/(app)/customers/new')}
      >
        <LinearGradient
          colors={[colors.primaryGradientFrom, colors.primaryGradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.full,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    paddingVertical: 0,
  },
  list: {
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADII.full,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONT_SIZES.lg,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  meta: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  pointsBox: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  pointsLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  swipeDeleteContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  fab: {
    position: 'absolute',
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
