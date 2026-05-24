import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, View, StyleSheet } from 'react-native';

interface ThemeExpandOverlayProps {
  originX: number;
  originY: number;
  overlayBg: string;
  newBg: string;
  onComplete: () => void;
}

const BLUR_LAYERS = [
  { scale: 1, opacity: 1 },
  { scale: 1.02, opacity: 0.8 },
  { scale: 1.05, opacity: 0.5 },
  { scale: 1.09, opacity: 0.25 },
  { scale: 1.14, opacity: 0.1 },
  { scale: 1.2, opacity: 0.04 },
];

export default function ThemeExpandOverlay({ originX, originY, overlayBg, newBg, onComplete }: ThemeExpandOverlayProps) {
  const { width, height } = Dimensions.get('window');
  const startRadius = 20;
  const maxRadius = Math.sqrt(width * width + height * height);
  const fullScale = maxRadius / startRadius;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: fullScale,
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(onComplete);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayBg }]} />
      {BLUR_LAYERS.map((layer, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: startRadius * 2,
            height: startRadius * 2,
            borderRadius: startRadius,
            backgroundColor: newBg,
            opacity: layer.opacity,
            transform: [
              { translateX: originX - startRadius },
              { translateY: originY - startRadius },
              { scale: Animated.multiply(scale, layer.scale) },
            ],
          }}
        />
      ))}
    </View>
  );
}
