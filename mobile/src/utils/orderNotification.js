// Order Notification Utility with Sound
import { Alert, Platform } from 'react-native';
// TEMPORARILY DISABLED: expo-notifications not supported in Expo Go SDK 51+
// import * as Notifications from 'expo-notifications';

// Configure notification handler
// TEMPORARILY DISABLED
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// Order status messages
const ORDER_STATUS_MESSAGES = {
  PENDING: {
    title: '🔍 Order Placed',
    body: 'Your order has been placed and is being processed',
    sound: 'default',
  },
  ACCEPTED: {
    title: '✅ Order Accepted',
    body: 'Restaurant has accepted your order and is preparing it',
    sound: 'default',
  },
  PICKED: {
    title: '🏍️ Out for Delivery',
    body: 'Your order is on the way! Rider is heading to you',
    sound: 'default',
  },
  DELIVERED: {
    title: '🎉 Order Delivered',
    body: 'Your order has been delivered. Enjoy your meal!',
    sound: 'default',
  },
  CANCELLED: {
    title: '❌ Order Cancelled',
    body: 'Your order has been cancelled',
    sound: 'default',
  },
};

// Request notification permissions
// TEMPORARILY DISABLED: expo-notifications not supported in Expo Go SDK 51+
export const requestNotificationPermissions = async () => {
  console.log('Notifications temporarily disabled - use development build for push notifications');
  return false;
  // try {
  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //   let finalStatus = existingStatus;
  //   
  //   if (existingStatus !== 'granted') {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }
  //   
  //   if (finalStatus !== 'granted') {
  //     console.log('Notification permissions not granted');
  //     return false;
  //   }
  //   
  //   return true;
  // } catch (error) {
  //   console.error('Error requesting notification permissions:', error);
  //   return false;
  // }
};

// Show local notification for order status
// TEMPORARILY DISABLED: expo-notifications not supported in Expo Go SDK 51+
export const showOrderNotification = async (orderStatus, orderNumber) => {
  console.log('📢 Notification (disabled):', orderStatus, orderNumber);
  // Fallback to alert
  showOrderStatusAlert(orderStatus, orderNumber);
  // try {
  //   const hasPermission = await requestNotificationPermissions();
  //   if (!hasPermission) {
  //     console.log('No notification permission');
  //     return;
  //   }

  //   const statusInfo = ORDER_STATUS_MESSAGES[orderStatus.toUpperCase()] || {
  //     title: 'Order Update',
  //     body: `Order #${orderNumber} status: ${orderStatus}`,
  //     sound: 'default',
  //   };

  //   await Notifications.scheduleNotificationAsync({
  //     content: {
  //       title: statusInfo.title,
  //       body: `Order #${orderNumber}: ${statusInfo.body}`,
  //       sound: statusInfo.sound,
  //       data: { orderNumber, status: orderStatus },
  //     },
  //     trigger: null, // Show immediately
  //   });

  //   console.log('📢 Notification sent:', statusInfo.title);
  // } catch (error) {
  //   console.error('Error showing notification:', error);
  // }
};

// Show alert with sound for order status change
export const showOrderStatusAlert = (orderStatus, orderNumber) => {
  const statusInfo = ORDER_STATUS_MESSAGES[orderStatus.toUpperCase()] || {
    title: 'Order Update',
    body: `Order #${orderNumber} status: ${orderStatus}`,
  };

  Alert.alert(
    statusInfo.title,
    `Order #${orderNumber}\n${statusInfo.body}`,
    [{ text: 'OK', style: 'default' }]
  );
};

// Format order date/time safely
export const formatOrderDate = (dateString) => {
  if (!dateString) return 'Just now';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    
    // Format date
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Show relative time for recent orders
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // Show formatted date for older orders
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Just now';
  }
};

// Format order time
export const formatOrderTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

// Get order status color
export const getOrderStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return '#FF9800';
    case 'ACCEPTED':
      return '#2196F3';
    case 'PICKED':
      return '#9C27B0';
    case 'DELIVERED':
      return '#4CAF50';
    case 'CANCELLED':
      return '#F44336';
    default:
      return '#666666';
  }
};

// Get order status icon
export const getOrderStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'clock-outline';
    case 'ACCEPTED':
      return 'check-circle';
    case 'PICKED':
      return 'bike-fast';
    case 'DELIVERED':
      return 'check-all';
    case 'CANCELLED':
      return 'close-circle';
    default:
      return 'information';
  }
};

export default {
  requestNotificationPermissions,
  showOrderNotification,
  showOrderStatusAlert,
  formatOrderDate,
  formatOrderTime,
  getOrderStatusColor,
  getOrderStatusIcon,
};
