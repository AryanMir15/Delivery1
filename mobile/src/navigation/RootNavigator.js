import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import RiderNavigator from './RiderNavigator';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      console.log('RootNavigator checking onboarding status');
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      console.log('Onboarding complete:', onboardingComplete);
      
      setTimeout(() => {
        setShowOnboarding(onboardingComplete !== 'true');
        setIsLoading(false);
        console.log('isAuthenticated:', isAuthenticated);
      }, 500);
    };

    checkOnboarding();
    
    // Re-check every second to catch onboarding completion
    const interval = setInterval(async () => {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true' && showOnboarding) {
        setShowOnboarding(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showOnboarding]);

  console.log('RootNavigator render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'role:', user?.role);

  if (isLoading) {
    return <SplashScreen />;
  }

  const getMainNavigator = () => {
    const role = user?.role;
    switch (role) {
      case 'rider':
        return RiderNavigator;
      case 'vendor':
      case 'admin':
      case 'owner':
        return MainNavigator;
      default:
        return MainNavigator;
    }
  };

  try {
    const MainNav = getMainNavigator();
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNav} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    );
  } catch (error) {
    console.error('RootNavigator error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{`Error loading app: ${error.message}`}</Text>
      </View>
    );
  }
};

export default RootNavigator;