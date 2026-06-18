import { useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const COFFEE_COLORS = ['#6F4E37', '#A0522D', '#D2691E', '#F5F5DC', '#3E7A34', '#8B4513', '#4A3728'];
const PARTICLE_COUNT = 35;
const BEAN_COUNT = 12;
const WAVE_DELAYS = [0, 300, 600];

interface BeanVariant {
  body: string;
  line: string;
  size: number;
}

const BEAN_VARIANTS: BeanVariant[] = [
  { body: '#4A3728', line: '#2C1810', size: 14 },
  { body: '#6F4E37', line: '#3E2710', size: 12 },
  { body: '#3E2710', line: '#1A0D06', size: 13 },
  { body: '#8B6040', line: '#4A3020', size: 11 },
  { body: '#5C3A1E', line: '#2C1810', size: 15 },
  { body: '#7A5531', line: '#3E2710', size: 12 },
];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  isBean: boolean;
  beanVariant: BeanVariant;
  xEnd: number;
  yEnd: number;
  rotateEnd: number;
}

export default function CoffeeConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const all: Particle[] = [];

    WAVE_DELAYS.forEach((delay, waveIdx) => {
      const count = waveIdx === 1 ? PARTICLE_COUNT : Math.floor(PARTICLE_COUNT / 2);
      const beanCount = waveIdx === 1 ? BEAN_COUNT : Math.floor(BEAN_COUNT / 2);

      for (let i = 0; i < count + beanCount; i++) {
        const originX = screenWidth * (0.1 + Math.random() * 0.8);
        const originY = -20;

        const rotEnd = Math.random() * 720 - 360;

        const isBean = i >= count;
        const p: Particle = {
          x: new Animated.Value(originX),
          y: new Animated.Value(originY),
          rotate: new Animated.Value(0),
          opacity: new Animated.Value(1),
          color: COFFEE_COLORS[Math.floor(Math.random() * COFFEE_COLORS.length)],
          isBean,
          beanVariant: isBean ? BEAN_VARIANTS[Math.floor(Math.random() * BEAN_VARIANTS.length)] : BEAN_VARIANTS[0],
          xEnd: (Math.random() - 0.5) * screenWidth * 0.8,
          yEnd: screenHeight * (0.6 + Math.random() * 0.35),
          rotateEnd: rotEnd,
        };

        all.push(p);
      }
    });

    setParticles(all);

    all.forEach(p => {
      const delay = WAVE_DELAYS[p.isBean ? 1 : 0];

      Animated.parallel([
        Animated.timing(p.x, {
          toValue: p.xEnd,
          duration: 1500 + Math.random() * 500,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(p.y, {
          toValue: p.yEnd,
          duration: 1500 + Math.random() * 500,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(p.rotate, {
          toValue: p.rotateEnd,
          duration: 1500 + Math.random() * 500,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          delay: delay + 1200 + Math.random() * 500,
        }),
      ]).start();
    });

    return () => {
      all.forEach(p => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.rotate.stopAnimation();
        p.opacity.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: p.rotate.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] }) },
            ],
            opacity: p.opacity,
          }}
        >
          {p.isBean ? (
            <View style={{ width: p.beanVariant.size, height: p.beanVariant.size * 0.72, borderRadius: p.beanVariant.size * 0.5, backgroundColor: p.beanVariant.body, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: p.beanVariant.size * 0.6, height: p.beanVariant.size * 0.18, borderRadius: 1, backgroundColor: p.beanVariant.line }} />
            </View>
          ) : (
            <Animated.View
              style={{
                width: 8 + Math.random() * 8,
                height: 6 + Math.random() * 6,
                borderRadius: Math.random() > 0.5 ? 10 : 0,
                backgroundColor: p.color,
              }}
            />
          )}
        </Animated.View>
      ))}
    </View>
  );
}