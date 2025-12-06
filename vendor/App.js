import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ApolloProvider } from '@apollo/client';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { store, persistor } from './src/store';
import client from './src/api/apolloClient';
import RootNavigator from './src/navigation/RootNavigator';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };
    requestPermissions();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        }
        persistor={persistor}
      >
        <ApolloProvider client={client}>
          <PaperProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </PaperProvider>
        </ApolloProvider>
      </PersistGate>
    </Provider>
  );
}
