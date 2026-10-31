import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '../../store/themeStore';

const THUMB_SIZE = 26;
const TRACK_HEIGHT = 8;
const HIT_HEIGHT = 44;

interface UiScaleSliderProps {
  value: number;
  onChange: (value: number) => void;
  onRelease?: (value: number) => void;
  colors: ThemeColors;
  min?: number;
  max?: number;
  step?: number;
  marks?: number[];
}

export default function UiScaleSlider({
  value,
  onChange,
  onRelease,
  colors,
  min = 0.8,
  max = 1.5,
  step = 0.05,
  marks = [0.8, 1, 1.2, 1.5],
}: UiScaleSliderProps) {
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onReleaseRef = useRef(onRelease);
  const gestureStart = useRef({ offsetX: 0, pageX: 0 });

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);

  const quantize = useCallback((raw: number) => {
    const clamped = Math.min(max, Math.max(min, raw));
    const steps = Math.round((clamped - min) / step);
    return Number((min + steps * step).toFixed(2));
  }, [min, max, step]);

  const commit = useCallback((offsetX: number) => {
    const width = widthRef.current;
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, offsetX / width));
    const next = quantize(min + ratio * (max - min));
    if (next === valueRef.current) return;
    valueRef.current = next;
    onChangeRef.current(next);
  }, [min, max, quantize]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      const { locationX, pageX } = evt.nativeEvent;
      gestureStart.current = { offsetX: locationX ?? 0, pageX: pageX ?? 0 };
      commit(gestureStart.current.offsetX);
    },
    onPanResponderMove: (evt) => {
      const { pageX, locationX } = evt.nativeEvent;
      const start = gestureStart.current;
      const delta = typeof pageX === 'number' ? pageX - start.pageX : 0;
      commit(typeof pageX === 'number' ? start.offsetX + delta : (locationX ?? start.offsetX));
    },
    onPanResponderRelease: () => onReleaseRef.current?.(valueRef.current),
    onPanResponderTerminate: () => onReleaseRef.current?.(valueRef.current),
  }), [commit]);

  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));

  return (
    <View
      style={styles.hitArea}
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="UI size"
      accessibilityValue={{ min: Math.round(min * 100), max: Math.round(max * 100), now: Math.round(value * 100) }}
      {...panResponder.panHandlers}
    >
      <View
        pointerEvents="none"
        style={[styles.track, { backgroundColor: colors.glassFillStrong, borderColor: colors.glassStroke }]}
      >
        <View style={[styles.trackFill, { width: `${ratio * 100}%` }]}>
          <LinearGradient
            colors={[colors.primaryGradientFrom, colors.primaryGradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>

      {marks.map((mark) => {
        const markRatio = Math.min(1, Math.max(0, (mark - min) / (max - min)));
        const active = markRatio <= ratio + 0.0001;
        return (
          <View
            key={mark}
            pointerEvents="none"
            style={[
              styles.mark,
              { left: `${markRatio * 100}%`, backgroundColor: active ? colors.primary : colors.glassStroke },
            ]}
          />
        );
      })}

      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            left: `${ratio * 100}%`,
            backgroundColor: '#FFFFFF',
            borderColor: colors.primary,
            shadowColor: colors.glowPrimary,
          },
        ]}
      >
        <View style={[styles.thumbCore, { backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    height: HIT_HEIGHT,
    justifyContent: 'center',
    marginHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  mark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    top: (HIT_HEIGHT - 4) / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    marginLeft: -THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thumbCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
