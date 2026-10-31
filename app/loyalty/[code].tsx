import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import LoyaltyQrCard from '../../src/components/customers/LoyaltyQrCard';
import { getCustomerByCode } from '../../src/database/customers';
import { useThemeStore } from '../../src/store/themeStore';
import AmbientBackground from '../../src/components/ui/glass/AmbientBackground';

export default function LoyaltyCardView() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const colors = useThemeStore(s => s.colors);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const member = await getCustomerByCode(code);
        if (!member) {
          setError('Member not found');
        } else {
          setCustomer(member);
        }
      } catch (e) {
        setError('Failed to load member data');
      } finally {
        setLoading(false);
      }
    }
    if (code) loadCustomer();
  }, [code]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 18, textAlign: 'center' }}>
          {error || 'Member not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AmbientBackground />
      <View style={styles.cardWrapper}>
        <LoyaltyQrCard 
          code={customer.code} 
          nickname={customer.name} 
          storeName="BeanOS Coffee" 
        />
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Show this card at checkout to earn points!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
        width: '100vw' as any,
      },
    }),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
        width: '100vw' as any,
      },
    }),
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 600,
    aspectRatio: 600 / 700, // Matches CARD_W / CARD_H approx
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    zIndex: 1,
  },
  footerText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});
