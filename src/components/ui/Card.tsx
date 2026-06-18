import { View, StyleSheet } from 'react-native';
import { SPACING } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface CardProps {
  children: React.ReactNode;
  style?: object;
}

export default function Card({ children, style }: CardProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
