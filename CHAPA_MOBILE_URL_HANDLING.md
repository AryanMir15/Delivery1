# Chapa Mobile Payment - URL Handling

## Issue Resolved

**Error**: `The callback url must be a valid URL`

**Cause**: Chapa requires valid HTTP/HTTPS URLs for callback and return URLs, not deep link URLs like `fooddelivery://payment/success`.

## Solution for Mobile Apps

For mobile apps using in-app browsers, the callback/return URLs are not actually used for navigation. Instead:

1. **Payment opens in in-app browser** (expo-web-browser)
2. **User completes payment on Chapa's page**
3. **User closes browser manually**
4. **App detects browser closure**
5. **App navigates to payment verification screen**
6. **Payment is verified via GraphQL API**

## Current Implementation

### Mobile App (CheckoutScreen.js)
```javascript
initializePaymentMutation({
  variables: {
    orderId,
    paymentMethod: selectedPayment,
    // Placeholder URLs - not used for navigation in mobile
    returnUrl: 'https://yourapp.com/payment/success',
    callbackUrl: 'https://yourapp.com/payment/callback',
  },
});
```

### Why Placeholder URLs?
- Chapa API requires valid HTTP/HTTPS URLs
- Mobile app doesn't rely on these for navigation
- Browser closure triggers app flow, not URL redirect
- Payment verification happens via GraphQL API call

## Payment Flow in Mobile

```
1. User clicks "Proceed to Payment"
   ↓
2. GraphQL mutation: initializePayment
   (with placeholder URLs)
   ↓
3. Chapa returns checkout URL
   ↓
4. expo-web-browser opens checkout URL
   ↓
5. User completes payment
   ↓
6. User closes browser (or browser auto-closes)
   ↓
7. App detects browser closure
   ↓
8. App navigates to PaymentScreen
   ↓
9. PaymentScreen calls verifyPayment GraphQL
   ↓
10. Payment status updated
    ↓
11. User redirected to OrderTracking
```

## For Production

### Option 1: Use Your Domain (Recommended)
```javascript
returnUrl: 'https://yourdomain.com/payment/success',
callbackUrl: 'https://yourdomain.com/payment/callback',
```

### Option 2: Backend Webhooks (Advanced)
Set up webhook endpoints on your backend to receive payment notifications:

```javascript
// Backend route
app.post('/api/payment/webhook', async (req, res) => {
  const { tx_ref, status } = req.body;
  
  // Verify webhook signature
  // Update order payment status
  // Send push notification to user
  
  res.status(200).send('OK');
});
```

Then configure in Chapa dashboard:
- Webhook URL: `https://yourdomain.com/api/payment/webhook`

## Testing

The current implementation works for testing because:
- ✅ URLs are valid HTTP format
- ✅ Chapa accepts the payment initialization
- ✅ Mobile app handles flow independently
- ✅ Payment verification works via API

## Notes

- **Web apps** need real callback URLs for redirects
- **Mobile apps** can use placeholder URLs
- **Webhooks** are optional but recommended for production
- **Deep links** (`app://`) don't work with Chapa API

## Related Files

- `mobile/src/screens/CheckoutScreen.js` - Payment initialization
- `mobile/src/screens/PaymentScreen.js` - Payment verification
- `mobile/src/services/chapaService.js` - Browser handling
- `graphql/resolvers.js` - Backend payment logic
