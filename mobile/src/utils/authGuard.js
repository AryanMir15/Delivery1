import { Alert } from 'react-native';
import SessionService from '../services/SessionService';

class AuthGuard {
  // Check if action requires login
  requiresLogin(action) {
    return SessionService.requiresLogin(action);
  }

  // Handle action with login check
  async handleAction(action, callback, navigation, user) {
    if (this.requiresLogin(action)) {
      if (!user) {
        this.showLoginPrompt(action, navigation);
        return false;
      }
    }
    
    // Execute action
    if (callback) {
      await callback();
    }
    return true;
  }

  // Show login prompt
  showLoginPrompt(action, navigation) {
    const actionMessages = {
      checkout: 'checkout and place your order',
      placeOrder: 'place an order',
      saveFavorite: 'save favorites',
      viewOrders: 'view your orders',
      trackOrder: 'track your order',
      writeReview: 'write a review',
      saveAddress: 'save addresses'
    };

    const message = actionMessages[action] || 'continue';

    Alert.alert(
      'Login Required',
      `Please login to ${message}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Login',
          onPress: () => {
            if (navigation) {
              navigation.navigate('Login');
            }
          }
        }
      ]
    );
  }

  // Merge guest session after login
  async mergeGuestSession(userId) {
    await SessionService.mergeGuestToUserSession(userId);
  }
}

export default new AuthGuard();
