import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Chapa Payment Service for Mobile App
 * Handles payment initialization and verification
 */
class ChapaService {
  constructor() {
    this.paymentInProgress = false;
    this.currentTxRef = null;
  }

  /**
   * Open Chapa checkout URL in browser
   * @param {string} checkoutUrl - Chapa checkout URL
   * @param {string} txRef - Transaction reference
   * @returns {Promise<{success: boolean, txRef: string}>}
   */
  async openCheckout(checkoutUrl, txRef) {
    try {
      this.paymentInProgress = true;
      this.currentTxRef = txRef;

      // Open the checkout URL in an in-app browser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: '#FF6B35',
        toolbarColor: '#FFFFFF',
      });

      this.paymentInProgress = false;

      // User closed the browser
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return {
          success: false,
          txRef,
          cancelled: true,
        };
      }

      return {
        success: true,
        txRef,
      };
    } catch (error) {
      this.paymentInProgress = false;
      console.error('Error opening Chapa checkout:', error);
      throw error;
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
        txRef: params.get('tx_ref') || params.get('trx_ref'),
        status: params.get('status'),
        transactionId: params.get('transaction_id'),
      };
    } catch (error) {
      console.error('Error parsing callback URL:', error);
      return null;
    }
  }

  /**
   * Check if payment is in progress
   * @returns {boolean}
   */
  isPaymentInProgress() {
    return this.paymentInProgress;
  }

  /**
   * Get current transaction reference
   * @returns {string|null}
   */
  getCurrentTxRef() {
    return this.currentTxRef;
  }

  /**
   * Reset payment state
   */
  reset() {
    this.paymentInProgress = false;
    this.currentTxRef = null;
  }
}

export default new ChapaService();
