import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistCache } from 'apollo3-cache-persist';

// API URL Configuration
// For Android Emulator: http://10.0.2.2:4000/graphql
// For iOS Simulator: http://localhost:4000/graphql
// For Physical Device: http://YOUR_IP:4000/graphql

// Change this based on your setup:
const HTTP_URL = 'http://10.0.2.2:4000/graphql';  // Android Emulator
const WS_URL = 'ws://10.0.2.2:4000/graphql';      // Android Emulator

console.log('🔵 Apollo Client Configuration:');
console.log('   HTTP URL:', HTTP_URL);
console.log('   WS URL:', WS_URL);

// For iOS Simulator, use:
// const HTTP_URL = 'http://localhost:4000/graphql';
// const WS_URL = 'ws://localhost:4000/graphql';

// For Physical Device, use your computer's IP:
// const HTTP_URL = 'http://192.168.1.XXX:4000/graphql';
// const WS_URL = 'ws://192.168.1.XXX:4000/graphql';

// Create HTTP link with error logging
const httpLink = createHttpLink({
  uri: HTTP_URL,
  fetch: (uri, options) => {
    console.log('🔵 GraphQL Request to:', uri);
    return fetch(uri, options)
      .then(response => {
        console.log('✅ GraphQL Response status:', response.status);
        return response;
      })
      .catch(error => {
        console.error('❌ GraphQL Network Error:', error.message);
        throw error;
      });
  },
});

// Create WebSocket link for subscriptions
const wsLink = new WebSocketLink({
  uri: WS_URL,
  options: {
    reconnect: true,
    connectionParams: async () => {
      const token = await AsyncStorage.getItem('vendorToken');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  },
});

// Auth link to add token to headers
const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('vendorToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Split link based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Create cache
const cache = new InMemoryCache();

// Persist cache
persistCache({
  cache,
  storage: AsyncStorage,
});

// Create Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default client;
