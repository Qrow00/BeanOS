import { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { springs } from '../../utils/motion';

interface FadeInViewProps {
  children: React.ReactNode;
  index?: number;
  onceKey?: string;
  delay?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

const animatedKeys = new Set<string>();

export default function FadeInView({
  children,
  index = 0,
  onceKey,
  delay,
  offset = 18,
  style,
}: FadeInViewProps) {
  const progress = useRef(
    new Animated.Value(onceKey && animatedKeys.has(onceKey) ? 1 : 0)
  ).current;

  useEffect(() => {
    if (onceKey && animatedKeys.has(onceKey)) {
      progress.setValue(1);
      return;
    }
    if (onceKey) {
      if (animatedKeys.size > 2000) animatedKeys.clear();
      animatedKeys.add(onceKey);
    }

    const stagger = delay ?? Math.min(index, 8) * 45;
    progress.setValue(0);

    Animated.sequence([
      Animated.delay(stagger),
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        ...springs.bouncy,
      }),
    ]).start();
  }, [onceKey]);

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
    extrapolate: 'clamp',
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
