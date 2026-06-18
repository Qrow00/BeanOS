import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useWindowDimensions, Easing } from 'react-native';
import Svg, { Circle, Rect, Mask, Defs, RadialGradient, Stop, Path, Line, Polygon } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTourStore } from '../../store/tourStore';
import { useThemeStore } from '../../store/themeStore';
import { SPACING, FONT_SIZES } from '../../utils/constants';

function getSpot(step: number, w: number, h: number, top: number) {
  const configs = [
    { x: 0.5, y: top + 0.32 * h, r: 130, dir: 'none' },
    { x: 0.5, y: top + 16, r: 95, dir: 'up' },
    { x: 0.5, y: top + 80, r: 90, dir: 'up' },
    { x: 0.5, y: top + 0.28 * h, r: 130, dir: 'none' },
    { x: 0.3, y: top + 0.16 * h, r: 120, dir: 'up' },
  ];
  return configs[step] || configs[0];
}

export default function TourOverlay() {
  const { active, step, steps, next, prev, end } = useTourStore();
  const colors = useThemeStore(s => s.colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const lastStepRef = useRef(-1);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const drawLineAnim = useRef(new Animated.Value(0)).current;
  const lineGlowAnim = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;

  const currentStep = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const spot = getSpot(step, width, height, insets.top);
  const cx = spot.x * width;
  const cy = Math.max(spot.y, insets.top + 20);
  const cr = spot.r + 60;
  const dir = spot.dir as string;

  const tooltipTop = height - insets.bottom - 90;
  const lineStartY = Math.min(cy + cr + 4, height - 120);
  const lineEndY = tooltipTop - 4;

  useEffect(() => {
    if (active && currentStep && lastStepRef.current !== step) {
      lastStepRef.current = step;
      const timer = setTimeout(() => {
        router.navigate(currentStep.route as any);
      }, 200);
      return () => clearTimeout(timer);
    }
    if (!active) {
      lastStepRef.current = -1;
    }
  }, [active, step, currentStep?.route]);

  useEffect(() => {
    if (active) {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
      drawLineAnim.setValue(0);
      lineGlowAnim.setValue(0);
      ripple2.setValue(0);
      bounceAnim.setValue(0);
      arrowBounce.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 45, useNativeDriver: true }),
        Animated.timing(drawLineAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(lineGlowAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(lineGlowAnim, { toValue: 0, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(ripple2, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(ripple2, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowBounce, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(arrowBounce, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
      pulseAnim.setValue(1);
      drawLineAnim.setValue(0);
      lineGlowAnim.setValue(0);
      ripple2.setValue(0);
      bounceAnim.setValue(0);
      arrowBounce.setValue(0);
    }
  }, [active, step]);

  if (!active || !currentStep) return null;

  const dashOffset = drawLineAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const arrowY = cy - cr + 10;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none" opacity={fadeAnim}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id={`b-${step}`} cx="50%" cy="50%" r="50%">
              <Stop offset="35%" stopColor="black" stopOpacity="1" />
              <Stop offset="50%" stopColor="black" stopOpacity="1" />
              <Stop offset="70%" stopColor="#555" stopOpacity="1" />
              <Stop offset="85%" stopColor="#aaa" stopOpacity="1" />
              <Stop offset="100%" stopColor="white" stopOpacity="1" />
            </RadialGradient>
            <Mask id={`h-${step}`}>
              <Rect width="100%" height="100%" fill="white" />
              <Circle cx={cx} cy={cy} r={cr} fill={`url(#b-${step})`} />
            </Mask>
          </Defs>
          <Rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask={`url(#h-${step})`} />

          <Line
            x1={cx}
            y1={lineStartY}
            x2={cx}
            y2={lineEndY}
            stroke={colors.primary}
            strokeWidth={2}
            strokeDasharray="6,5"
            strokeDashoffset={dashOffset}
            fill="none"
            opacity={0.7}
          />

          <Circle cx={cx} cy={lineStartY} r={4} fill={colors.primary} opacity={0.7} />
          <Circle cx={cx} cy={lineEndY} r={4} fill={colors.primary} opacity={0.7} />

          {dir === 'up' && (
            <Polygon
              points={`${cx - 8},${arrowY + 14} ${cx + 8},${arrowY + 14} ${cx},${arrowY}`}
              fill={colors.primary}
              opacity={0.85}
            />
          )}
        </Svg>
      </Animated.View>

      {dir === 'up' && (
        <Animated.View
          style={[
            styles.pointer,
            {
              left: cx - 10,
              top: arrowY - 14,
              opacity: fadeAnim,
              transform: [{ translateY: arrowBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.pointerHead, { borderBottomColor: colors.primary }]} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.ripple,
          {
            left: cx - 70,
            top: cy - 70,
            width: 140,
            height: 140,
            borderRadius: 70,
            borderColor: colors.primary,
            opacity: ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
            transform: [{ scale: ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }) }],
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.ripple,
          {
            left: cx - 50,
            top: cy - 50,
            width: 100,
            height: 100,
            borderRadius: 50,
            borderColor: colors.primary,
            opacity: 1,
            transform: [{ scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] }) }],
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.ripple,
          {
            left: cx - 40,
            top: cy - 40,
            width: 80,
            height: 80,
            borderRadius: 40,
            borderColor: colors.primary,
            opacity: 1,
            transform: [{ scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [1.05, 0.9] }) }],
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.spot,
          {
            left: cx - 18,
            top: cy - 18,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.glow,
          {
            left: cx - 28,
            top: cy - 28,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            opacity: lineGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.25] }),
            transform: [{ scale: pulseAnim }],
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: colors.surface,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            bottom: insets.bottom + 90,
            marginHorizontal: SPACING.md,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{step + 1}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{currentStep.title}</Text>
          <TouchableOpacity onPress={end} style={styles.closeBtn}>
            <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {currentStep.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: i === step ? colors.primary : colors.disabled }]}
              />
            ))}
          </View>
          <View style={styles.buttons}>
            {!isFirst && (
              <TouchableOpacity style={[styles.btn, { borderColor: colors.border }]} onPress={prev}>
                <Text style={[styles.btnText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary }]}
              onPress={isLast ? end : next}
            >
              <Text style={[styles.btnText, styles.btnPrimaryText]}>{isLast ? 'Done' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pointer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 12,
  },
  pointerHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: 10,
  },
  spot: {
    position: 'absolute',
    zIndex: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    zIndex: 11,
  },
  tooltip: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  closeBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  closeIcon: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  desc: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  footer: {
    gap: SPACING.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  btnPrimaryText: {
    color: '#fff',
  },
});
