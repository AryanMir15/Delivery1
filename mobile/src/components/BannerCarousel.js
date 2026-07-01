import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { palette } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH * 0.30);
const AUTO_SCROLL_INTERVAL = 3500;

const PLACEHOLDER_BANNERS = [
  { id: '1', color: '#1a1a1a', accent: palette.silver },
  { id: '2', color: '#1a1a1a', accent: '#C9A96E' },
  { id: '3', color: '#1a1a1a', accent: palette.silver },
];

function PaginationDot({ isActive }) {
  const fillWidth = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isActive ? 28 : 8,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      fillWidth.setValue(0);
      return;
    }
    fillWidth.setValue(0);
    const anim = Animated.timing(fillWidth, {
      toValue: 1,
      duration: AUTO_SCROLL_INTERVAL,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [isActive]);

  if (!isActive) {
    return (
      <Animated.View style={[dotStyles.inactiveDot, { width: widthAnim }]} />
    );
  }

  return (
    <Animated.View style={[dotStyles.track, { width: widthAnim }]}>
      <Animated.View
        style={[
          dotStyles.fill,
          {
            width: fillWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const dotStyles = StyleSheet.create({
  inactiveDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3C',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2C2C2E',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: palette.silver,
  },
});

export default function BannerCarousel({ banners = PLACEHOLDER_BANNERS, onPress }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToOffset({ offset: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [banners.length]);

  const stopAutoScroll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [startAutoScroll, stopAutoScroll]);

  const onScrollBeginDrag = useCallback(() => stopAutoScroll(), [stopAutoScroll]);
  const onScrollEndDrag = useCallback(() => startAutoScroll(), [startAutoScroll]);

  const onMomentumScrollEnd = useCallback((e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
      style={styles.bannerWrapper}
    >
      {item.image ? (
        <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.bannerImage} resizeMode="cover" />
      ) : (
        <View style={[styles.bannerPlaceholder, { backgroundColor: item.color }]}>
          <View style={[styles.placeholderAccent, { backgroundColor: item.accent }]} />
        </View>
      )}
    </TouchableOpacity>
  ), [onPress]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination dots */}
      <View style={styles.dotsContainer}>
        {banners.map((_, i) => (
          <PaginationDot key={String(i)} isActive={i === currentIndex} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  bannerWrapper: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  placeholderAccent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.15,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 3,
  },
});
