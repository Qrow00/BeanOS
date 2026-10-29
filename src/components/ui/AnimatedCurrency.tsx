import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';
import { formatCurrency } from '../../utils/helpers';

interface AnimatedCurrencyProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

export default function AnimatedCurrency({ value, style, duration = 360 }: AnimatedCurrencyProps) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, duration, anim]);

  useEffect(() => {
    const id = anim.addListener(({ value: current }) => setDisplay(current));
    return () => anim.removeListener(id);
  }, [anim]);

  return <Text style={style}>{formatCurrency(display)}</Text>;
}
