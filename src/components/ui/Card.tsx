import { View, StyleSheet } from 'react-native';
import { SPACING, RADII } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface CardProps {
  children: React.ReactNode;
  style?: object;
}

export default function Card({ children, style }: CardProps) {
  const colors = useThemeStore(s => s.colors);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.glassFill, borderColor: colors.glassStroke },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.sm,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
