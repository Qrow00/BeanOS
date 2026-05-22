import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, View, StyleSheet } from 'react-native';

interface ThemeExpandOverlayProps {
  originX: number;
  originY: number;
  targetBg: string;
  onComplete: () => void;
}

export default function ThemeExpandOverlay({ originX, originY, targetBg, onComplete }: ThemeExpandOverlayProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');
  const startRadius = 20;
  const maxRadius = Math.sqrt(width * width + height * height);
  const maxScale = maxRadius / startRadius;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: maxScale,
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(onComplete);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={{
          position: 'absolute',
          left: originX - startRadius,
          top: originY - startRadius,
          width: startRadius * 2,
          height: startRadius * 2,
          borderRadius: startRadius,
          backgroundColor: targetBg,
          transform: [{ scale }],
        }}
      />
    </View>
  );
}
