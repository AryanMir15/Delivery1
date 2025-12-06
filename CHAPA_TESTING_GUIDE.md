# Chapa Payment Integration - Testing Guide

## ✅ Integration Complete

The Chapa payment gateway has been successfully integrated into your mobile app!

## 🎯 What Was Implemented

### New Files Created
1. **`mobile/src/services/chapaService.js`** - Chapa payment service
2. **`mobile/src/screens/PaymentScreen.js`** - Payment verification screen
3. **Documentation files** - Setup and integration guides

### Files Modified
1. **`mobile/src/screens/CheckoutScreen.js`** - Added Chapa payment flow
2. **`mobile/src/navigation/MainNavigator.js`** - Added Payment screen route
3. **`mobile/src/screens/MyOrdersScreen.js`** - Added payment status display
4. **`mobile/src/api/mutations.js`** - Fixed duplicate declarations (cleaned up)

## 🚀 Quick Start Testing

### 1. Start Backend Server
```bash
npm run dev
```
✅ Backend runs on `http://localhost:4000`

### 2. Start Mobile App
```bash
cd mobile
npm start
```

### 3. Choose Your Platform
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code for physical device

## 💳 Test Payment Flow

### Step-by-Step Test
1. **Login/Register** in the app
2. **Browse products** from any shop
3. **Add items to cart**
4. **Go to Cart** and click "Checkout"
5. **Select payment method**:
   - Cash on Delivery (no payment needed)
   - Chapa Payment (card payment)
   - Telebirr (mobile money)
   - CBE Birr (bank payment)
6. **Click "Proceed to Payment"**
7. **Complete payment** in the browser
8. **Return to app** - payment verifies automatically
9. **View order** in "My Orders" tab

## 🧪 Test Cards (Test Mode)

### ✅ Successful Payment
```
Card Number: 5200000000000007
Expiry: 12/25 (any future date)
CVV: 123 (any 3 digits)
Name: Test User
```

### ❌ Failed Payment
```
Card Number: 4000000000000002
Expiry: 12/25
CVV: 123
Name: Test User
```

## 📱 Payment Methods

| Method | Icon | Description |
|--------|------|-------------|
| Cash on Delivery | 💵 | Traditional cash payment |
| Chapa Payment | 💳 | Card payments (Visa/Mastercard) |
| Telebirr | 📱 | Mobile money payment |
| CBE Birr | 🏦 | Bank mobile payment |

## 🔍 What to Test

### ✅ Test Scenarios

1. **Successful Payment**
   - Use test card 5200000000000007
   - Complete payment
   - Verify order status changes to PAID
   - Check order appears in "My Orders"

2. **Failed Payment**
   - Use test card 4000000000000002
   - Payment should fail
   - Order status remains PENDING
   - "Retry Payment" button appears

3. **Cancelled Payment**
   - Start payment
   - Close browser before completing
   - Should show cancellation message
   - Order remains in pending state

4. **Cash Payment**
   - Select "Cash on Delivery"
   - Order created immediately
   - No payment verification needed
   - Goes directly to order tracking

## 📊 Payment Status Indicators

### In My Orders Screen
- **PENDING** 🟡 - Payment not completed (shows "Retry Payment" button)
- **PAID** 🟢 - Payment successful
- **FAILED** 🔴 - Payment failed (shows "Retry Payment" button)

### Order Status
- **PENDING** - Waiting for restaurant acceptance
- **ACCEPTED** - Restaurant accepted order
- **PICKED** - Rider picked up order
- **DELIVERED** - Order delivered
- **CANCELLED** - Order cancelled

## 🐛 Troubleshooting

### Issue: "Network Error"
**Check:**
- Backend is running on port 4000
- API URL in `mobile/src/api/apolloClient.js` is correct:
  - Android Emulator: `http://10.0.2.2:4000/graphql`
  - iOS Simulator: `http://localhost:4000/graphql`
  - Physical Device: `http://YOUR_IP:4000/graphql`

### Issue: Payment screen doesn't open
**Check:**
- Console logs for errors
- Backend logs for initialization errors
- Chapa credentials in `.env` file

### Issue: Payment verification fails
**Check:**
- Transaction reference is correct
- Backend can reach Chapa API
- Check backend console for errors

### Issue: App crashes on payment
**Check:**
- Run `cd mobile && npm install` to ensure all dependencies
- Clear cache: `npm start -- --clear`
- Restart Metro bundler

## 📝 Environment Configuration

### Backend `.env` (Already Configured)
```env
CHAPA_SECRET_KEY=CHASECK_TEST-JjYZMncZbPIEJgKu4PEHQIGoPkpL75Rx
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-tSKZBlG7kTmT3ZXOdtufB9eotqwMk92q
CHAPA_WEBHOOK_SECRET=hctgQFPIhIImx5fBdmqZu1IZ
CHAPA_BASE_URL=https://api.chapa.co/v1
```

### Mobile API Configuration
Check `mobile/src/api/apolloClient.js`:
```javascript
const httpLink = createHttpLink({
  uri: 'http://10.0.2.2:4000/graphql', // Android Emulator
  // uri: 'http://localhost:4000/graphql', // iOS Simulator
  // uri: 'http://YOUR_IP:4000/graphql', // Physical Device
});
```

## 🎬 Expected Flow

```
1. User adds items to cart
   ↓
2. Goes to checkout
   ↓
3. Selects "Chapa Payment"
   ↓
4. Clicks "Proceed to Payment"
   ↓
5. Order created (status: PENDING, payment: PENDING)
   ↓
6. GraphQL mutation: initializePayment
   ↓
7. Chapa checkout URL opens in browser
   ↓
8. User enters card details
   ↓
9. Payment processed by Chapa
   ↓
10. Browser closes, returns to app
    ↓
11. PaymentScreen appears
    ↓
12. GraphQL mutation: verifyPayment
    ↓
13. Payment status updated (PAID/FAILED)
    ↓
14. Redirects to OrderTrackingScreen
    ↓
15. Order visible in "My Orders" tab
```

## 📱 Testing on Different Devices

### Android Emulator
- API URL: `http://10.0.2.2:4000/graphql`
- Works out of the box
- Browser opens in emulator

### iOS Simulator
- API URL: `http://localhost:4000/graphql`
- Works on Mac only
- Browser opens in simulator

### Physical Device
- API URL: `http://YOUR_COMPUTER_IP:4000/graphql`
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Device and computer must be on same WiFi
- Browser opens on device

## 🔐 Security Notes

✅ Secret keys stored in backend only
✅ Payment verification on server-side
✅ Mobile app only displays checkout URL
✅ JWT authentication for all requests
✅ HTTPS recommended for production

## 📞 Support Resources

- **Chapa Documentation**: https://developer.chapa.co
- **Chapa Dashboard**: https://dashboard.chapa.co
- **Chapa Support**: support@chapa.co

## ✨ Features Ready

✅ Multiple payment methods
✅ In-app browser checkout
✅ Automatic payment verification
✅ Payment status tracking
✅ Order status updates
✅ Retry payment option (UI ready)
✅ Error handling
✅ Loading states
✅ User-friendly messages

## 🎉 You're Ready!

Your Chapa payment integration is complete and ready for testing. Start both servers and try making a test payment!

### Quick Test Command
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Mobile
cd mobile && npm start
```

Then open the app and test the payment flow! 🚀
