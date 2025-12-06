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

// Ignore specific warnings
LogBox.ignoreLogs([
  'Possible Unhandled Promise Rejection',
  'Unable to activate keep awake',
  'VirtualizedLists should never be nested',
  'An error occurred!',
  'cache.diff',
  'canonizeResults',
  'onCompleted',
]);

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B35',
    secondary: '#2EC4B6',
    accent: '#FF6B35',
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
  console.log('=== App component rendering ===');

  useEffect(() => {
    console.log('=== App component mounted ===');
    
    // Initialize session and clean old data (non-blocking)
    const initializeApp = async () => {
      try {
        // Run cleanup in background (don't await)
        SessionService.cleanOldSessions().catch(err => 
          console.error('Session cleanup error:', err)
        );
        
        const state = store.getState();
        const user = state.auth?.user;
        
        if (user?._id) {
          await SessionService.loadUserSession(user._id);
          console.log('User session loaded for:', user._id);
        } else {
          await SessionService.initializeGuestSession();
          console.log('Guest session initialized');
        }
      } catch (error) {
        console.error('Error initializing app session:', error);
      }
    };
    
    // Run initialization without blocking UI
    initializeApp();
    
    // Global error handler for unhandled promise rejections
    const errorHandler = (error, isFatal) => {
      console.error('=== Global Error Handler ===');
      console.error('Error:', error);
      console.error('Is Fatal:', isFatal);
      if (__DEV__) {
        console.log('Error caught:', error);
      }
    };

    if (typeof global.ErrorUtils !== 'undefined') {
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }

    return () => {
      console.log('=== App component unmounting ===');
    };
  }, []);

  // Error boundary fallback
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Something went wrong
        </Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
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
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
              </View>
            } 
            persistor={persistor}
            onBeforeLift={() => {
              console.log('=== Redux Persist: Before Lift ===');
            }}
          >
            <ApolloProvider client={client}>
              <PaperProvider theme={theme}>
                <SafeAreaProvider>
                  <NavigationContainer
                    onReady={() => console.log('=== Navigation Ready ===')}
                    onStateChange={(state) => console.log('=== Navigation State Changed ===', state?.index)}
                    fallback={
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Loading Navigation...</Text>
                      </View>
                    }
                  >
                    <StatusBar
                      barStyle="dark-content"
                      backgroundColor="#FFFFFF"
                    />
                    <RootNavigator />
                  </NavigationContainer>
                </SafeAreaProvider>
              </PaperProvider>
            </ApolloProvider>
          </PersistGate>
        </ReduxProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error('=== App Render Error ===', error);
    setHasError(true);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Error Loading App
        </Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          {error.message}
        </Text>
      </View>
    );
  }
};

export default App;