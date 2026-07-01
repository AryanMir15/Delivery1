import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ShokLogo from './ShokLogo';
import { palette } from '../theme/colors';
import { finishRoleTransition } from '../store/authSlice';

export default function RoleSwitchOverlay() {
  const dispatch = useDispatch();
  const { isTransitioning } = useSelector((state) => state.auth);
  const opacity = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isTransitioning) return;

    opacity.setValue(0);
    spin.setValue(0);

    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(spin, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(150),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);

    anim.start(() => {
      dispatch(finishRoleTransition());
    });

    return () => anim.stop();
  }, [isTransitioning]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[styles.overlay, { opacity, pointerEvents: isTransitioning ? 'auto' : 'none' }]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <ShokLogo size={80} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.black,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
});
