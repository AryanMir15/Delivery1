// Push Notification Service for Rider App
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }

      // Get push token (for production use)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2EC4B6',
        });
      }

      console.log('✅ Notifications initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  }

  async getPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('📱 Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  // Show local notification for new order
  async showNewOrderNotification(order) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚴 New Order Available!',
          body: `Order #${order.orderId} from ${order.restaurant?.name}`,
          data: { orderId: order.id, type: 'new_order' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Show notification for order status change
  async showOrderStatusNotification(orderId, status, message) {
    try {
      const titles = {
        accepted: '✅ Order Accepted',
        preparing: '👨‍🍳 Order Being Prepared',
        ready: '📦 Order Ready for Pickup',
        picked: '🚴 Order Picked Up',
        delivered: '🎉 Order Delivered',
        cancelled: '❌ Order Cancelled',
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: titles[status] || 'Order Update',
          body: message || `Order #${orderId} status: ${status}`,
          data: { orderId, status, type: 'status_update' },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Show earnings notification
  async showEarningsNotification(amount) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Payment Received',
          body: `You earned PKR ${amount.toFixed(2)}`,
          data: { type: 'earnings' },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Listen for notifications
  addNotificationListener(callback) {
    this.notificationListener = Notifications.addNotificationReceivedListener(callback);
  }

  // Listen for notification responses (when user taps notification)
  addNotificationResponseListener(callback) {
    this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Remove listeners
  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get badge count
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default new NotificationService();
