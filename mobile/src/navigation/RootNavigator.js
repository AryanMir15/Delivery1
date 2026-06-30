import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import RiderNavigator from './RiderNavigator';
import VendorNavigator from './VendorNavigator';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useTheme } from '../theme';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      setShowOnboarding(onboardingComplete !== 'true');
    };

    checkOnboarding();
  }, []);

  if (isLoading) {
    return <SplashScreen onReady={() => setIsLoading(false)} />;
  }

  const getMainNavigator = () => {
    const role = user?.role;
    switch (role) {
      case 'rider':
        return RiderNavigator;
      case 'vendor':
      case 'owner':
      case 'admin':
        return VendorNavigator;
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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>{`Error loading app: ${error.message}`}</Text>
      </View>
    );
  }
};

export default RootNavigator;
