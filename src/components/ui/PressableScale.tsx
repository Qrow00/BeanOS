import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { usePressScale } from '../../hooks/usePressScale';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type PressableScaleProps = TouchableOpacityProps & {
  scaleTo?: number;
};

export default function PressableScale({
  style,
  scaleTo = 0.96,
  activeOpacity = 0.9,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const { scale, onPressIn: springIn, onPressOut: springOut } = usePressScale(scaleTo);

  return (
    <AnimatedTouchable
      {...props}
      style={[style, { transform: [{ scale }] }]}
      activeOpacity={activeOpacity}
      onPressIn={(event) => {
        springIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        springOut();
        onPressOut?.(event);
      }}
    />
  );
}
