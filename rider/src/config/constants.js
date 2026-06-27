// Rider App Configuration Constants

// Backend IP - change this to your computer's IP for physical device testing
// Android emulator: '10.0.2.2' (maps to host localhost)
// iOS simulator: 'localhost'
// Physical device: your WiFi IP (e.g., '192.168.100.10')
export const BACKEND_IP = '10.0.2.2';
export const BACKEND_PORT = '4000';

// Derived URLs
export const HTTP_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/graphql`;
export const SOCKET_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;

// App Configuration
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'shOk Rider';

// Location Tracking Settings
export const LOCATION_UPDATE_INTERVAL = 3000; // 3 seconds
export const LOCATION_DISTANCE_FILTER = 10; // 10 meters
export const LOCATION_ACCURACY = 'high';

// Cache Settings
export const CACHE_MAX_SIZE = 3145728; // 3MB

// Polling Intervals
export const ORDER_POLL_INTERVAL = 10000; // 10 seconds

// Colors
export const COLORS = {
  primary: '#2EC4B6',
  secondary: '#FF6B35',
  success: '#28A745',
  danger: '#E63946',
  warning: '#FFC107',
  info: '#17A2B8',
  light: '#F8F9FA',
  dark: '#1D3557',
  gray: '#6C757D',
  white: '#FFFFFF',
  black: '#000000',
};

// Status Colors
export const STATUS_COLORS = {
  pending: COLORS.warning,
  accepted: COLORS.primary,
  preparing: COLORS.primary,
  ready: COLORS.info,
  picked: COLORS.info,
  delivered: COLORS.success,
  cancelled: COLORS.danger,
};

// Order Status Icons
export const STATUS_ICONS = {
  pending: 'clock-outline',
  accepted: 'check-circle',
  preparing: 'chef-hat',
  ready: 'package-variant',
  picked: 'bike-fast',
  delivered: 'check-all',
  cancelled: 'close-circle',
};

// Support Contact
export const SUPPORT_EMAIL = 'support@shok.app';
export const SUPPORT_PHONE = '+923001234567';

// Map Configuration - Tando Allahyar, Sindh, Pakistan
export const MAP_INITIAL_REGION = {
  latitude: 25.7721,
  longitude: 68.7156,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Routing Service
export const ROUTING_SERVICE = 'osrm'; // osrm (free) or google (requires API key)
export const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export default {
  BACKEND_IP,
  BACKEND_PORT,
  HTTP_URL,
  SOCKET_URL,
  APP_VERSION,
  APP_NAME,
  LOCATION_UPDATE_INTERVAL,
  LOCATION_DISTANCE_FILTER,
  LOCATION_ACCURACY,
  CACHE_MAX_SIZE,
  ORDER_POLL_INTERVAL,
  COLORS,
  STATUS_COLORS,
  STATUS_ICONS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  MAP_INITIAL_REGION,
  ROUTING_SERVICE,
  OSRM_URL,
};
