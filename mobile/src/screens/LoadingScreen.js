import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for outer circle
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FFB84D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />
      <View style={styles.circleMiddle} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Rotating outer circle */}
        <Animated.View
          style={[
            styles.outerCircle,
            { transform: [{ rotate }] },
          ]}
        >
          <View style={styles.outerCircleDot} />
          <View style={[styles.outerCircleDot, styles.outerCircleDot2]} />
          <View style={[styles.outerCircleDot, styles.outerCircleDot3]} />
        </Animated.View>

        {/* Pulsing logo circle */}
        <Animated.View
          style={[
            styles.logoCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.logoInnerCircle}>
            <Icon name="shopping" size={70} color="#FF6B35" />
          </View>
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>Aksum Delivery</Text>
        <Text style={styles.tagline}>Your everything store</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Decorative circles
  circleTop: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circleBottom: {
    position: 'absolute',
    bottom: -200,
    left: -150,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleMiddle: {
    position: 'absolute',
    top: height * 0.3,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    alignItems: 'center',
  },
  // Rotating outer circle
  outerCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  outerCircleDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    top: -6,
    left: '50%',
    marginLeft: -6,
  },
  outerCircleDot2: {
    top: '50%',
    left: -6,
    marginTop: -6,
    marginLeft: 0,
  },
  outerCircleDot3: {
    bottom: -6,
    top: 'auto',
    left: '50%',
    marginLeft: -6,
  },
  // Logo circles
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoInnerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  // Text
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
    fontWeight: '500',
  },
  // Loading dots
  loadingContainer: {
    marginTop: 60,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});

export default LoadingScreen;
