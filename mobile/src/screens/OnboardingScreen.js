import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    icon: 'hand-wave',
    title: 'Welcome to Aksum Delivery',
    description: 'Your trusted delivery partner in Ethiopia',
    buttonText: 'Next',
  },
  {
    id: '2',
    icon: 'rocket-launch',
    title: 'Fast & Reliable Delivery',
    description: 'Get your orders delivered quickly to your doorstep',
    buttonText: 'Next',
  },
  {
    id: '3',
    icon: 'shopping',
    title: 'Everything You Need',
    description: 'Food, groceries, medicine, courier & more',
    buttonText: 'Get Started',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      // Mark onboarding as complete and trigger re-render
      await AsyncStorage.setItem('onboardingComplete', 'true');
      // Pass a callback to parent to re-check onboarding status
      navigation.setParams({ onboardingComplete: true });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    navigation.setParams({ onboardingComplete: true });
  };

  const s = styles(colors, typography);

  const renderItem = ({ item }) => (
    <View style={s.slide}>
      <View style={s.iconContainer}>
        <Icon name={item.icon} size={100} color={colors.accent} />
      </View>
      <Text style={s.title}>{String(item.title)}</Text>
      <Text style={s.description}>{String(item.description)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity style={s.skipButton} onPress={handleSkip}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEnabled={false}
      />

      {/* Pagination Dots */}
      <View style={s.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={String(index)}
            style={[
              s.dot,
              currentIndex === index && s.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity style={s.button} onPress={handleNext}>
        <Text style={s.buttonText}>
          {String(onboardingData[currentIndex].buttonText)}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = (colors, typography) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.divider,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: colors.accent,
    width: 30,
  },
  button: {
    backgroundColor: colors.accent,
    marginHorizontal: 40,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
