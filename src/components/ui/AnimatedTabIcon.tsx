import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { springs } from '../../utils/motion';

interface AnimatedTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
}

export default function AnimatedTabIcon({ name, outlineName, focused, color, size = 26 }: AnimatedTabIconProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      ...springs.bouncy,
    }).start();
  }, [focused]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Ionicons name={focused ? name : outlineName} size={size} color={color} />
    </Animated.View>
  );
}
