# Chapa Payment Integration Guide

## Overview

This guide explains how to integrate and test Chapa payment gateway in your delivery platform. Chapa is Ethiopia's leading payment gateway supporting Telebirr, CBE Birr, card payments, and more.

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
# All required dependencies are already installed
npm install
```

#### Configure Environment Variables

Edit your `.env` file and add your Chapa credentials:

```env
# Chapa Payment Gateway (Test Mode)
CHAPA_SECRET_KEY=your_chapa_test_secret_key_here
CHAPA_PUBLIC_KEY=your_chapa_test_public_key_here
CHAPA_WEBHOOK_SECRET=your_chapa_webhook_secret_here
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_CALLBACK_URL=http://localhost:4000/payment/callback
CHAPA_RETURN_URL=http://localhost:4000/payment/success
```

**Get Your Test Credentials:**
1. Go to [Chapa Dashboard](https://dashboard.chapa.co)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Copy your Test Secret Key and Public Key
5. Generate a webhook secret (any random string for test mode)

#### Start Backend Server
```bash
npm run dev
```

The backend will be available at `http://localhost:4000`

### 2. Mobile App Setup

#### Install Required Package
```bash
cd mobile
npm install expo-web-browser
```

#### Update Apollo Client Configuration

Make sure your `mobile/src/api/apolloClient.js` points to the correct backend URL:

```javascript
// For Android Emulator
const API_URL = 'http://10.0.2.2:4000/graphql';

// For iOS Simulator
// const API_URL = 'http://localhost:4000/graphql';

// For Physical Device (replace with your IP)
// const API_URL = 'http://192.168.1.100:4000/graphql';
```

#### Configure Deep Links (Optional)

For production, add deep link configuration to `mobile/app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "myapp",
              "host": "payment"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.deliveryapp",
      "associatedDomains": ["applinks:yourapp.com"]
    }
  }
}
```

#### Start Mobile App
```bash
npm start
# Then press 'a' for Android or 'i' for iOS
```

## 📱 Testing Payment Flow

### Test Mode Payment

Chapa provides test credentials for testing without real money:

**Test Cards:**
- Card Number: `5555555555554444` (Mastercard)
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3 digits (e.g., `123`)

**Test Mobile Money:**
- Use any phone number
- OTP will be sent to your registered email in test mode

### Payment Flow Steps

1. **Add items to cart** in the mobile app
2. **Go to checkout** and select delivery address
3. **Choose "Chapa Payment"** as payment method
4. **Place order** - this creates the order in pending status
5. **Payment page opens** in in-app browser
6. **Complete payment** using test credentials
7. **Automatic verification** - backend verifies payment with Chapa
8. **Order confirmed** - payment status updated to "paid"

## 🔧 API Endpoints

### GraphQL Mutations

#### Initialize Payment
```graphql
mutation InitializePayment(
  $orderId: ID!
  $paymentMethod: String!
  $returnUrl: String
  $callbackUrl: String
) {
  initializePayment(
    orderId: $orderId
    paymentMethod: $paymentMethod
    returnUrl: $returnUrl
    callbackUrl: $callbackUrl
  ) {
    success
    checkoutUrl
    txRef
    error
    orderId
  }
}
```

#### Verify Payment
```graphql
mutation VerifyPayment($txRef: String!) {
  verifyPayment(txRef: $txRef) {
    success
    status
    amount
    currency
    txRef
    order {
      id
      orderId
      paymentStatus
      orderAmount
    }
    error
  }
}
```

### REST Endpoints

#### Webhook (for Chapa callbacks)
```
POST /payment/webhook/chapa
Headers:
  - chapa-signature: <webhook_signature>
Body: Chapa webhook payload
```

#### Payment Callback
```
GET /payment/callback?tx_ref=<transaction_ref>&status=<status>
```

#### Success/Failed Pages
```
GET /payment/success?orderId=<order_id>
GET /payment/failed?error=<error_message>
```

## 🧪 Testing Scenarios

### 1. Successful Payment
```javascript
// In mobile app
1. Add items to cart
2. Proceed to checkout
3. Select Chapa payment
4. Use test card: 5555555555554444
5. Complete payment
6. Verify order status changes to "paid"
```

### 2. Failed Payment
```javascript
// Use invalid card or cancel payment
1. Follow steps 1-3 above
2. Close payment browser or use invalid card
3. Verify order remains in "pending" status
4. User can retry payment from orders screen
```

### 3. Webhook Testing
```bash
# Use ngrok to expose local server for webhook testing
ngrok http 4000

# Update CHAPA_CALLBACK_URL in .env with ngrok URL
CHAPA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/payment/callback
```

## 🔐 Security Best Practices

### Production Checklist

- [ ] Use production Chapa credentials (not test keys)
- [ ] Enable webhook signature verification
- [ ] Use HTTPS for all callback URLs
- [ ] Implement rate limiting on payment endpoints
- [ ] Log all payment transactions
- [ ] Set up monitoring and alerts
- [ ] Validate payment amounts on backend
- [ ] Implement idempotency for payment operations
- [ ] Store sensitive data encrypted
- [ ] Regular security audits

### Environment Variables Security

**Never commit these to version control:**
- `CHAPA_SECRET_KEY`
- `CHAPA_WEBHOOK_SECRET`

Use environment-specific configurations:
- `.env.development` - Test credentials
- `.env.production` - Production credentials

## 📊 Payment Status Flow

```
Order Created (pending)
    ↓
Payment Initialized
    ↓
User Completes Payment
    ↓
Webhook Received ← → Payment Verified
    ↓
Order Status Updated (paid/failed)
    ↓
Notification Sent to User
```

## 🐛 Troubleshooting

### Payment initialization fails
- Check Chapa API credentials in `.env`
- Verify backend server is running
- Check network connectivity
- Review backend logs for errors

### Webhook not received
- Ensure callback URL is publicly accessible
- Use ngrok for local testing
- Check webhook signature verification
- Review Chapa dashboard for webhook logs

### Payment verification fails
- Check transaction reference is correct
- Verify Chapa API is accessible
- Check for network timeouts
- Review payment status in Chapa dashboard

### Mobile app can't connect to backend
- Verify API_URL in apolloClient.js
- Use `10.0.2.2` for Android emulator
- Use your local IP for physical devices
- Check firewall settings

## 📞 Support

### Chapa Support
- Dashboard: https://dashboard.chapa.co
- Documentation: https://developer.chapa.co
- Email: support@chapa.co

### Testing Resources
- Test API: https://api.chapa.co/v1
- Test Dashboard: https://dashboard.chapa.co
- Postman Collection: Available in Chapa docs

## 🎯 Next Steps

1. **Test thoroughly** in test mode
2. **Complete KYC** in Chapa dashboard
3. **Switch to production** credentials
4. **Configure webhooks** with production URL
5. **Monitor transactions** in Chapa dashboard
6. **Set up reconciliation** process
7. **Implement refunds** if needed
8. **Add analytics** and reporting

## 📝 Code Examples

### Backend - Initialize Payment
```javascript
const chapaService = require('./utils/chapaService');

const txRef = chapaService.generateTxRef(orderId);
const result = await chapaService.initializePayment({
  amount: 1000,
  currency: 'ETB',
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+251911234567',
  txRef: txRef,
});

console.log(result.checkoutUrl); // Redirect user here
```

### Mobile - Open Payment
```javascript
import chapaPaymentService from './services/chapaPaymentService';

await chapaPaymentService.openCheckout(
  checkoutUrl,
  () => console.log('Payment successful'),
  () => console.log('Payment cancelled'),
  (error) => console.error('Payment error:', error)
);
```

## 🔄 Payment Reconciliation

Daily reconciliation process:
1. Export transactions from Chapa dashboard
2. Compare with your database orders
3. Identify discrepancies
4. Manually verify disputed transactions
5. Update order statuses if needed

## 💡 Tips

- Always test in test mode first
- Keep test and production credentials separate
- Monitor webhook delivery success rate
- Implement retry logic for failed webhooks
- Cache payment status to reduce API calls
- Use transaction IDs for support queries
- Set up alerts for failed payments
- Regular backup of payment data

---

**Ready to go live?** Make sure you've completed all items in the Production Checklist above!
