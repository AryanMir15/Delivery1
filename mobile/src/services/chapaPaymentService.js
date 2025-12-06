import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

class ChapaPaymentService {
  /**
   * Open Chapa checkout URL
   * @param {string} checkoutUrl - Chapa checkout URL
   * @param {Function} onSuccess - Callback when payment succeeds
   * @param {Function} onCancel - Callback when payment is cancelled
   * @param {Function} onError - Callback when error occurs
   */
  async openCheckout(checkoutUrl, onSuccess, onCancel, onError) {
    try {
      if (!checkoutUrl) {
        throw new Error('Checkout URL is required');
      }

      // Open in-app browser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        showTitle: true,
        toolbarColor: '#4CAF50',
        enableBarCollapsing: false,
        showInRecents: true,
      });

      // Handle browser result
      if (result.type === 'cancel') {
        onCancel && onCancel();
      } else if (result.type === 'dismiss') {
        // User closed the browser
        onCancel && onCancel();
      }
    } catch (error) {
      console.error('Error opening Chapa checkout:', error);
      onError && onError(error);
    }
  }

  /**
   * Handle deep link callback from Chapa
   * @param {string} url - Deep link URL
   * @returns {Object} Parsed payment data
   */
  parseCallbackUrl(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      return {
        txRef: params.get('tx_ref'),
        status: params.get('status'),
        trxRef: params.get('trx_ref'),
      };
    } catch (error) {
      console.error('Error parsing callback URL:', error);
      return null;
    }
  }

  /**
   * Setup deep link listener for payment callbacks
   * @param {Function} callback - Callback function to handle payment result
   * @returns {Function} Cleanup function to remove listener
   */
  setupDeepLinkListener(callback) {
    const handleUrl = ({ url }) => {
      if (url && url.includes('payment')) {
        const paymentData = this.parseCallbackUrl(url);
        if (paymentData) {
          callback(paymentData);
        }
      }
    };

    // Add listener
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    // Return cleanup function
    return () => {
      subscription.remove();
    };
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in ETB
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    return `ETB ${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Get payment method display name
   * @param {string} method - Payment method code
   * @returns {string} Display name
   */
  getPaymentMethodName(method) {
    const methods = {
      chapa: 'Chapa Payment',
      telebirr: 'Telebirr',
      cbe: 'CBE Birr',
      card: 'Card Payment',
      cash: 'Cash on Delivery',
    };
    return methods[method] || method;
  }

  /**
   * Get payment status display info
   * @param {string} status - Payment status
   * @returns {Object} Status info with color and label
   */
  getPaymentStatusInfo(status) {
    const statusMap = {
      pending: { label: 'Pending', color: '#FFA500' },
      paid: { label: 'Paid', color: '#4CAF50' },
      failed: { label: 'Failed', color: '#F44336' },
      refunded: { label: 'Refunded', color: '#2196F3' },
    };
    return statusMap[status] || { label: status, color: '#757575' };
  }
}

export default new ChapaPaymentService();
