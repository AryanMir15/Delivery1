import React, { useEffect } from 'react';
import { StatusBar, LogBox, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store, persistor } from './src/store';
import { client } from './src/api/apolloClient';
import RootNavigator from './src/navigation/RootNavigator';
import SessionService from './src/services/SessionService';
import { ThemeProvider, useTheme } from './src/theme';

LogBox.ignoreLogs([
  'Possible Unhandled Promise Rejection',
  'Unable to activate keep awake',
  'VirtualizedLists should never be nested',
  'An error occurred!',
  'cache.diff',
  'canonizeResults',
  'onCompleted',
]);

const AppContent = () => {
  const { colors, isDark } = useTheme();

  const paperTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.background,
      surface: colors.surface,
      text: colors.textPrimary,
      onSurface: colors.textPrimary,
      disabled: colors.buttonDisabled,
      placeholder: colors.inputPlaceholder,
      backdrop: colors.overlay,
      error: colors.error,
    },
    roundness: 12,
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        SessionService.cleanOldSessions().catch(err =>
          console.error('Session cleanup error:', err)
        );

        const state = store.getState();
        const user = state.auth?.user;

        if (user?._id) {
          await SessionService.loadUserSession(user._id);
        } else {
          await SessionService.initializeGuestSession();
        }
      } catch (error) {
        console.error('Error initializing app session:', error);
      }
    };

    initializeApp();

    const errorHandler = (error, isFatal) => {
      console.error('=== Global Error Handler ===');
      console.error('Error:', error);
      console.error('Is Fatal:', isFatal);
    };

    if (typeof global.ErrorUtils !== 'undefined') {
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <NavigationContainer
          onReady={() => console.log('=== Navigation Ready ===')}
          onStateChange={(state) => console.log('=== Navigation State Changed ===', state?.index)}
          fallback={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
              <Text style={{ color: colors.textPrimary }}>Loading Navigation...</Text>
            </View>
          }
        >
          <StatusBar
            barStyle={colors.statusBarStyle}
            backgroundColor={colors.statusBar}
          />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

const App = () => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#FFF' }}>
          Something went wrong
        </Text>
        <Text style={{ textAlign: 'center', color: '#8E8E93' }}>
          Please restart the app
        </Text>
      </View>
    );
  }

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <PersistGate
            loading={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <Text style={{ color: '#FFF' }}>Loading...</Text>
              </View>
            }
            persistor={persistor}
            onBeforeLift={() => {
              console.log('=== Redux Persist: Before Lift ===');
            }}
          >
            <ApolloProvider client={client}>
              <ThemeProvider initialMode="dark">
                <AppContent />
              </ThemeProvider>
            </ApolloProvider>
          </PersistGate>
        </ReduxProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error('=== App Render Error ===', error);
    setHasError(true);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#FFF' }}>
          Error Loading App
        </Text>
        <Text style={{ textAlign: 'center', color: '#8E8E93' }}>
          {error.message}
        </Text>
      </View>
    );
  }
};

export default App;
