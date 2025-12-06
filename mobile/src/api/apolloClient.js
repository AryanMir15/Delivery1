import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';

// Use your computer's IP address for physical device
// Change this to your computer's IP address from ipconfig
const API_URL = 'http://10.0.26.24:4000/graphql';

// Create cache with offline support
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        orders: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        foods: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        restaurants: {
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
      maxSize: 5242880, // 5MB
      debug: __DEV__,
    });
    cacheInitialized = true;
    console.log('✅ Apollo cache persisted');
  } catch (error) {
    console.error('Failed to persist cache:', error);
  }
};

// Create HTTP link
const httpLink = createHttpLink({
  uri: API_URL,
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
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.log(`❌ [GraphQL error]: Message: ${message}, Path: ${path}`);
      console.log(`   Operation: ${operation.operationName}`);
    });
  }
  if (networkError) {
    console.log(`❌ [Network error]: ${networkError.message}`);
    console.log(`   Operation: ${operation.operationName}`);
    console.log(`   API URL: http://10.0.26.24:4000/graphql`);
    // Store failed operation for retry when online
  }
});

// Create auth link to add token to requests
const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from AsyncStorage
  const token = await AsyncStorage.getItem('authToken');

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Create Apollo Client with offline support
export const client = new ApolloClient({
  link: errorLink.concat(retryLink).concat(authLink).concat(httpLink),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always fetch fresh data to avoid cache issues
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only', // Always fetch fresh data to avoid cache issues
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Export function to clear cache
export const clearApolloCache = async () => {
  try {
    await client.clearStore();
    console.log('✅ Apollo cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export default client;