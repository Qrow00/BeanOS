import { useRef } from 'react';
import { Animated } from 'react-native';
import { springs, SpringMotion } from '../utils/motion';

export function usePressScale(pressedScale = 0.94) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number, config: SpringMotion) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      ...config,
    }).start();
  };

  return {
    scale,
    onPressIn: () => animateTo(pressedScale, springs.press),
    onPressOut: () => animateTo(1, springs.release),
  };
}
