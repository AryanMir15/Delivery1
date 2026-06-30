import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ShokLogo({ size = 300 }) {
  const ambientGlow = useSharedValue(0.15);

  useEffect(() => {
    ambientGlow.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedGlowProps = useAnimatedProps(() => ({
    opacity: ambientGlow.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="thinSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8fa0b0" />
            <Stop offset="30%" stopColor="#ffffff" />
            <Stop offset="50%" stopColor="#4a5560" />
            <Stop offset="70%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#303841" />
          </LinearGradient>
        </Defs>

        <AnimatedCircle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          animatedProps={animatedGlowProps}
        />

        <Circle
          cx="100"
          cy="100"
          r="61"
          fill="none"
          stroke="url(#thinSilver)"
          strokeWidth="0.75"
          strokeOpacity="0.7"
        />

        <Circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="url(#thinSilver)"
          strokeWidth="1.8"
        />

        <Circle
          cx="100"
          cy="100"
          r="54"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
      </Svg>
    </View>
  );
}
