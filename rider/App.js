import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { store, persistor } from './src/store';
import { client } from './src/api/apolloClient';
import RootNavigator from './src/navigation/RootNavigator';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Possible Unhandled Promise Rejection',
  'Unable to activate keep awake',
  'An error occurred!',
  'cache.diff',
  'canonizeResults',
  'onCompleted',
  'For more details, see the full error text at',
  'Please remove this option',
]);

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2EC4B6',
    secondary: '#FF6B35',
    accent: '#2EC4B6',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    error: '#E63946',
    text: '#1D3557',
    onSurface: '#1D3557',
    disabled: '#A8DADC',
    placeholder: '#6C757D',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 12,
};

const App = () => {
  useEffect(() => {
    // Removed auto-clear code - uninstall and reinstall app instead

    // Global error handler for unhandled promise rejections
    const errorHandler = (error, isFatal) => {
      if (__DEV__) {
        console.log('Error caught:', error);
      }
    };

    // Handle promise rejections
    const promiseRejectionHandler = (event) => {
      if (__DEV__) {
        console.log('Promise rejection:', event);
      }
    };

    if (typeof global.ErrorUtils !== 'undefined') {
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ApolloProvider client={client}>
            <PaperProvider theme={theme}>
              <SafeAreaProvider>
                <NavigationContainer>
                  <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                  <RootNavigator />
                </NavigationContainer>
              </SafeAreaProvider>
            </PaperProvider>
          </ApolloProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default App;
