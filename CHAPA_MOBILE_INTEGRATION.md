# Chapa Payment Gateway - Mobile App Integration

## Overview
Complete integration of Chapa payment gateway into the React Native mobile app for processing online payments.

## Features Implemented

### 1. Payment Methods
- **Cash on Delivery** - Traditional cash payment
- **Chapa Payment** - Card payments via Chapa
- **Telebirr** - Mobile money payment
- **CBE Birr** - Bank mobile payment

### 2. Payment Flow
1. User selects items and proceeds to checkout
2. Chooses payment method (Chapa/Telebirr/CBE Birr)
3. Order is created with "PENDING" payment status
4. Payment is initialized via GraphQL mutation
5. Chapa checkout URL opens in in-app browser
6. User completes payment on Chapa's secure page
7. User returns to app
8. Payment is verified via GraphQL mutation
9. Order status updates to "PAID" or "FAILED"
10. User redirected to order tracking

## Files Created

### 1. `mobile/src/services/chapaService.js`
Service for handling Chapa payment operations:
- Opens Chapa checkout in in-app browser
- Handles payment callbacks
- Manages payment state

### 2. `mobile/src/screens/PaymentScreen.js`
Payment verification screen:
- Verifies payment after user returns from Chapa
- Shows payment status (success/failed)
- Handles retry logic
- Redirects to order tracking on success

## Files Modified

### 1. `mobile/src/screens/CheckoutScreen.js`
Updated to support Chapa payments:
- Added new payment methods (Chapa, Telebirr, CBE Birr)
- Integrated payment initialization
- Opens Chapa checkout for online payments
- Handles payment cancellation

### 2. `mobile/src/navigation/MainNavigator.js`
Added Payment screen to navigation stack:
```javascript
import PaymentScreen from '../screens/PaymentScreen';
<Stack.Screen name="Payment" component={PaymentScreen} />
```

### 3. `mobile/src/api/mutations.js`
Already contains required mutations:
- `INITIALIZE_PAYMENT` - Initialize Chapa payment
- `VERIFY_PAYMENT` - Verify payment status
- `UPDATE_PAYMENT_STATUS` - Update order payment status

## Backend Requirements

The backend already has Chapa integration with:
- Chapa Node.js SDK installed (`chapa` package)
- Environment variables configured in `.env`
- GraphQL resolvers for payment operations

### Environment Variables (.env)
```env
CHAPA_SECRET_KEY=CHASECK_TEST-JjYZMncZbPIEJgKu4PEHQIGoPkpL75Rx
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-tSKZBlG7kTmT3ZXOdtufB9eotqwMk92q
CHAPA_WEBHOOK_SECRET=hctgQFPIhIImx5fBdmqZu1IZ
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_CALLBACK_URL=http://localhost:4000/payment/callback
CHAPA_RETURN_URL=http://localhost:4000/payment/success
```

## Testing

### Test Mode
Currently configured with Chapa test credentials. Use test cards:
- **Card Number**: 5200000000000007
- **Expiry**: Any future date
- **CVV**: Any 3 digits

### Test Flow
1. Start the mobile app: `cd mobile && npm start`
2. Add items to cart
3. Go to checkout
4. Select "Chapa Payment" or "Telebirr"
5. Place order
6. Complete payment in browser
7. Verify payment status updates

## Payment Status Flow

### Order Payment Statuses
- `PENDING` - Order created, payment not completed
- `PAID` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

### Order Statuses
- `PENDING` - Waiting for restaurant acceptance
- `ACCEPTED` - Restaurant accepted order
- `PICKED` - Rider picked up order
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled

## Security Considerations

1. **API Keys**: Never expose secret keys in mobile app
2. **Payment Verification**: Always verify on backend
3. **HTTPS**: Use secure connections for API calls
4. **Token Storage**: JWT tokens stored securely in AsyncStorage

## Dependencies

### Required Packages (Already Installed)
- `expo-web-browser` - For in-app browser
- `@apollo/client` - GraphQL client
- `react-navigation` - Navigation

### Backend Dependencies
- `chapa` - Chapa Node.js SDK
- `apollo-server-express` - GraphQL server

## API Endpoints

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
    error
    order {
      id
      _id
      orderId
      orderStatus
      paymentStatus
      orderAmount
      paidAmount
    }
  }
}
```

## Troubleshooting

### Payment Not Initializing
- Check backend is running
- Verify Chapa credentials in `.env`
- Check network connectivity
- Review GraphQL errors in console

### Browser Not Opening
- Ensure `expo-web-browser` is installed
- Check device permissions
- Try on different device/emulator

### Payment Verification Failing
- Check transaction reference is correct
- Verify backend can reach Chapa API
- Check Chapa dashboard for transaction status

## Production Deployment

### Before Going Live
1. Replace test credentials with production keys
2. Update callback/return URLs to production domains
3. Test with real payment methods
4. Implement webhook handling for payment notifications
5. Add proper error logging and monitoring
6. Test refund functionality

### Production Environment Variables
```env
CHAPA_SECRET_KEY=CHASECK-your-production-key
CHAPA_PUBLIC_KEY=CHAPUBK-your-production-key
CHAPA_WEBHOOK_SECRET=your-webhook-secret
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_CALLBACK_URL=https://yourdomain.com/payment/callback
CHAPA_RETURN_URL=https://yourdomain.com/payment/success
```

## Support

For Chapa-specific issues:
- Documentation: https://developer.chapa.co
- Support: support@chapa.co
- Dashboard: https://dashboard.chapa.co

## Next Steps

1. **Test thoroughly** with different payment methods
2. **Add payment history** screen for users
3. **Implement refunds** for cancelled orders
4. **Add payment receipts** via email
5. **Monitor transactions** in Chapa dashboard
6. **Set up webhooks** for real-time payment updates
