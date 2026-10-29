import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../../store/themeStore';

interface BeanOSSplashProps {
  onFinish?: () => void;
  duration?: number;
  version?: string;
}

const LIGHT = { bg: '#FAF7F2', ink: '#2B1A0F', muted: '#9C8B7C', accent: '#A96024', track: '#EADFD2' };
const DARK = { bg: '#17110C', ink: '#F5EBDD', muted: '#8F7F70', accent: '#C27A38', track: '#2E231A' };

const LOGO = require('../../../assets/intro/bean-logo.png');
const LOGO_WIDTH = 76;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 328) / 254);
const BAR_WIDTH = 44;
const BAR_FILL = Math.round(BAR_WIDTH * 0.4);

export default function BeanOSSplash({ onFinish, duration = 2600, version = 'v1.0' }: BeanOSSplashProps) {
  const mode = useThemeStore(s => s.mode);
  const colors = mode === 'dark' ? DARK : LIGHT;
  const insets = useSafeAreaInsets();

  const glow = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const footer = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const animations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let slideTimer: ReturnType<typeof setTimeout> | undefined;

    const stopAll = () => {
      animations.current.forEach(a => a.stop());
      animations.current = [];
    };

    const start = (reduceMotion: boolean) => {
      if (cancelled) return;

      if (reduceMotion) {
        [glow, logo, word, tagline, footer].forEach(value => value.setValue(1));
        slide.setValue(0.5);
      } else {
        const run = (value: Animated.Value, delay: number, ms: number, easing: (t: number) => number) => {
          const animation = Animated.sequence([
            Animated.delay(delay),
            Animated.timing(value, { toValue: 1, duration: ms, easing, useNativeDriver: true }),
          ]);
          animations.current.push(animation);
          animation.start();
        };

        run(glow, 200, 2400, Easing.out(Easing.ease));
        run(logo, 300, 1000, Easing.bezier(0.2, 0.8, 0.2, 1));
        run(word, 900, 900, Easing.out(Easing.ease));
        run(tagline, 1300, 900, Easing.out(Easing.ease));
        run(footer, 1500, 800, Easing.out(Easing.ease));

        slideTimer = setTimeout(() => {
          if (cancelled) return;
          const loop = Animated.loop(
            Animated.timing(slide, {
              toValue: 1,
              duration: 1300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            })
          );
          animations.current.push(loop);
          loop.start();
        }, 1600);
      }

      if (onFinish) timer = setTimeout(onFinish, duration);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(start)
      .catch(() => start(false));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(slideTimer);
      stopAll();
    };
  }, [onFinish, duration]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12], extrapolate: 'clamp' });
  const logoOpacity = logo;
  const logoTransform = [
    { translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [10, 0], extrapolate: 'clamp' }) },
    { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1], extrapolate: 'clamp' }) },
  ];
  const barTranslate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_FILL, BAR_WIDTH],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} pointerEvents="none">
        <Svg width={260} height={260}>
          <Defs>
            <RadialGradient id="beanGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={1} />
              <Stop offset="70%" stopColor={colors.accent} stopOpacity={0} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={130} cy={130} r={130} fill="url(#beanGlow)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{ opacity: logoOpacity, transform: logoTransform }}>
        <Image source={LOGO} style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={{ opacity: word }}>
        <Text style={[styles.word, { color: colors.ink }]}>
          BEAN<Text style={{ color: colors.accent }}>OS</Text>
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: tagline }}>
        <Text style={[styles.tagline, { color: colors.muted }]}>Brew · Sell · Grow</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { bottom: 44 + insets.bottom, opacity: footer }]}>
        <View style={[styles.bar, { backgroundColor: colors.track }]}>
          <Animated.View
            style={[styles.barFill, { backgroundColor: colors.accent, transform: [{ translateX: barTranslate }] }]}
          />
        </View>
        <Text style={[styles.version, { color: colors.muted }]}>{version}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 260,
    height: 260,
    marginLeft: -130,
    marginTop: -Math.round(260 * 0.62),
  },
  word: {
    marginTop: 26,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 6.16,
    paddingLeft: 6.16,
  },
  tagline: {
    marginTop: 10,
    fontSize: 10.5,
    letterSpacing: 3.36,
    paddingLeft: 3.36,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
  },
  bar: {
    width: BAR_WIDTH,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    width: BAR_FILL,
    borderRadius: 2,
  },
  version: {
    fontSize: 10,
    letterSpacing: 1.4,
  },
});
