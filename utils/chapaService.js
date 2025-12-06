const axios = require('axios');
const crypto = require('crypto');

class ChapaService {
  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY;
    this.publicKey = process.env.CHAPA_PUBLIC_KEY;
    this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
    this.callbackUrl = process.env.CHAPA_CALLBACK_URL;
    this.returnUrl = process.env.CHAPA_RETURN_URL;
    this.baseUrl = 'https://api.chapa.co/v1';
  }

  /**
   * Initialize a payment transaction
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment initialization response
   */
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        currency = 'ETB',
        email,
        firstName,
        lastName,
        phone,
        txRef,
        callbackUrl,
        returnUrl,
        customization = {}
      } = paymentData;

      // Validate and format email (Chapa requires valid email format)
      const validEmail = email && email.includes('@') ? email : `${phone}@customer.app`;
      
      // Chapa title: only letters, numbers, hyphens, underscores, spaces, and dots
      // Remove # and other special characters, limit to 16 characters
      const title = (customization.title || 'Order Payment')
        .replace(/[^a-zA-Z0-9\-_\s\.]/g, '') // Remove invalid characters
        .substring(0, 16);
      
      // Keep phone number in Ethiopian format (with leading 0)
      // Chapa expects: 0912345678 format for Ethiopian numbers
      let formattedPhone = phone || '';
      // Remove +251 if present and add 0
      if (formattedPhone.startsWith('+251')) {
        formattedPhone = '0' + formattedPhone.substring(4);
      } else if (!formattedPhone.startsWith('0')) {
        formattedPhone = '0' + formattedPhone;
      }

      const customerInfo = {
        amount: String(parseFloat(amount).toFixed(2)),
        currency,
        email: validEmail,
        first_name: firstName || 'Customer',
        last_name: lastName || 'User',
        phone_number: formattedPhone,
        tx_ref: txRef,
        callback_url: this.callbackUrl,
        return_url: this.returnUrl,
        test_mode: true, // Enable test mode for easier testing
        customization: {
          title: title,
          description: (customization.description || 'Payment for your order').substring(0, 100)
        }
      };

      console.log('🔵 Chapa Request Data:', JSON.stringify(customerInfo, null, 2));

      // Use direct API call instead of SDK
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        customerInfo,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Chapa Response:', response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          checkoutUrl: response.data.data.checkout_url,
          txRef: txRef
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment initialization failed',
          details: response.data
        };
      }
    } catch (error) {
      console.error('❌ Chapa payment initialization error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Payment initialization failed',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Verify a payment transaction
   * @param {String} txRef - Transaction reference
   * @returns {Promise<Object>} Verification response
   */
  async verifyPayment(txRef) {
    try {
      // Use direct API call
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${txRef}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      if (response.data.status === 'success') {
        const data = response.data.data;
        
        return {
          success: true,
          status: data.status,
          amount: data.amount,
          currency: data.currency,
          txRef: data.tx_ref,
          chargeResponseCode: data.charge_response_code,
          chargeResponseMessage: data.charge_response_message,
          createdAt: data.created_at,
          data: data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment verification failed',
          details: response.data
        };
      }
    } catch (error) {
      console.error('Chapa payment verification error:', error.message || error);
      return {
        success: false,
        error: error.message || 'Payment verification failed',
        details: error
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {String} signature - Webhook signature from header
   * @param {Object} payload - Webhook payload
   * @returns {Boolean} Verification result
   */
  verifyWebhookSignature(signature, payload) {
    try {
      const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate transaction reference
   * @param {String} orderId - Order ID
   * @returns {String} Transaction reference
   */
  generateTxRef(orderId) {
    const timestamp = Date.now();
    return `${orderId}-${timestamp}`;
  }

  /**
   * Get payment status from Chapa status
   * @param {String} chapaStatus - Chapa transaction status
   * @returns {String} Normalized payment status
   */
  normalizePaymentStatus(chapaStatus) {
    const statusMap = {
      'success': 'paid',
      'pending': 'pending',
      'failed': 'failed',
      'cancelled': 'failed'
    };
    
    return statusMap[chapaStatus?.toLowerCase()] || 'pending';
  }

  /**
   * Create a subaccount for vendor split payments (if supported)
   * @param {Object} vendorData - Vendor account details
   * @returns {Promise<Object>} Subaccount creation response
   */
  async createSubaccount(vendorData) {
    try {
      const {
        businessName,
        accountName,
        accountNumber,
        bankCode,
        splitType = 'percentage',
        splitValue
      } = vendorData;

      const payload = {
        business_name: businessName,
        account_name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        split_type: splitType,
        split_value: splitValue
      };

      const response = await axios.post(
        `${this.baseUrl}/subaccount`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Chapa subaccount creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Subaccount creation failed',
        details: error.response?.data
      };
    }
  }

  /**
   * Get list of supported banks
   * @returns {Promise<Object>} Banks list
   */
  async getBanks() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/banks`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        banks: response.data.data
      };
    } catch (error) {
      console.error('Chapa get banks error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch banks',
        details: error.response?.data
      };
    }
  }
}

module.exports = new ChapaService();
