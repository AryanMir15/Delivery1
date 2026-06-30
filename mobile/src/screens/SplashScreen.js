import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function SplashScreen({ onReady }) {
  const [showText, setShowText] = useState(false);

  const drawProgress = useSharedValue(0);
  const ambientGlow = useSharedValue(0.15);

  useEffect(() => {
    // Draw the ring from top, full circle
    drawProgress.value = withDelay(
      300,
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }, () => {
        runOnJS(setShowText)(true);
      })
    );

    // Breathing ambient glow loop
    ambientGlow.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Signal ready after animation completes
    const timer = setTimeout(() => {
      onReady?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const animatedDrawProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - drawProgress.value),
  }));

  const animatedGlowProps = useAnimatedProps(() => ({
    opacity: ambientGlow.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Svg width={260} height={260} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="thinSilver" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#8fa0b0" />
              <Stop offset="30%" stopColor="#ffffff" />
              <Stop offset="50%" stopColor="#4a5560" />
              <Stop offset="70%" stopColor="#ffffff" />
              <Stop offset="100%" stopColor="#303841" />
            </LinearGradient>
          </Defs>

          {/* Ambient glow behind ring */}
          <AnimatedCircle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            animatedProps={animatedGlowProps}
          />

          {/* Outer fine edge */}
          <Circle
            cx="100"
            cy="100"
            r="61"
            fill="none"
            stroke="url(#thinSilver)"
            strokeWidth={0.75}
            strokeOpacity={0.7}
          />

          {/* Animated drawing ring */}
          <AnimatedCircle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="url(#thinSilver)"
            strokeWidth={1.8}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            strokeLinecap="round"
            animatedProps={animatedDrawProps}
          />

          {/* Inner wire (fades in after draw) */}
          <Circle
            cx="100"
            cy="100"
            r="54"
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.5}
            strokeOpacity={showText ? 0.4 : 0}
          />
        </Svg>
      </View>

      <Animated.View style={[styles.textArea, { opacity: showText ? 1 : 0 }]}>
        <Text style={styles.title}>shOk</Text>
        <Text style={styles.subtitle}>delivery</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArea: {
    width: 260,
    height: 260,
  },
  textArea: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#C0C0C0',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#808080',
    letterSpacing: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
