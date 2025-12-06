import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';

import { HTTP_URL } from '../config/constants';

// Backend URL is configured in src/config/constants.js
// Change BACKEND_IP in that file to match your computer's IP address

// Create cache with offline support
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        availableOrders: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        riderOrders: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// Persist cache to AsyncStorage for offline access
let cacheInitialized = false;
export const initializeCache = async () => {
  if (cacheInitialized) return;
  
  try {
    await persistCache({
      cache,
      storage: new AsyncStorageWrapper(AsyncStorage),
      maxSize: 3145728, // 3MB
      debug: __DEV__,
    });
    cacheInitialized = true;
    console.log('✅ Rider cache persisted');
  } catch (error) {
    console.error('Failed to persist cache:', error);
  }
};

// HTTP link
const httpLink = createHttpLink({
  uri: HTTP_URL,
});

// Retry link for failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error && !error.message.includes('401'),
  },
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, path }) =>
      console.log(`[GraphQL error]: Message: ${message}, Path: ${path}`)
    );
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError.message}`);
  }
});

// Auth link
const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('riderToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Apollo Client with offline support
export const client = new ApolloClient({
  link: errorLink.concat(retryLink).concat(authLink).concat(httpLink),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
