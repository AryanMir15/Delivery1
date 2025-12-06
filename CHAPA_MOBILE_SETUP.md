# Chapa Mobile Integration - Quick Setup Guide

## ✅ What's Been Done

### 1. Backend Setup (Already Complete)
- ✅ Chapa SDK installed (`chapa` package)
- ✅ Environment variables configured
- ✅ GraphQL mutations for payment operations
- ✅ Payment verification logic

### 2. Mobile App Integration (Just Completed)
- ✅ Chapa service created (`mobile/src/services/chapaService.js`)
- ✅ Payment screen created (`mobile/src/screens/PaymentScreen.js`)
- ✅ Checkout screen updated with Chapa support
- ✅ Navigation configured
- ✅ Payment status display in orders

## 🚀 How to Test

### Step 1: Start Backend
```bash
npm run dev
```
Backend should be running on `http://localhost:4000`

### Step 2: Start Mobile App
```bash
cd mobile
npm start
```

### Step 3: Configure API URL
In `mobile/src/api/apolloClient.js`, ensure the URL points to your backend:
- **Android Emulator**: `http://10.0.2.2:4000/graphql`
- **iOS Simulator**: `http://localhost:4000/graphql`
- **Physical Device**: `http://YOUR_IP:4000/graphql`

### Step 4: Test Payment Flow
1. Open the app
2. Login/Register
3. Browse products and add to cart
4. Go to checkout
5. Select **"Chapa Payment"** or **"Telebirr"**
6. Click **"Proceed to Payment"**
7. Complete payment in the browser
8. Return to app to see verification

## 💳 Test Cards (Chapa Test Mode)

### Successful Payment
- **Card**: 5200000000000007
- **Expiry**: 12/25 (any future date)
- **CVV**: 123 (any 3 digits)

### Failed Payment
- **Card**: 4000000000000002
- **Expiry**: 12/25
- **CVV**: 123

## 📱 Payment Methods Available

1. **Cash on Delivery** - Traditional cash payment
2. **Chapa Payment** - Card payments (Visa, Mastercard)
3. **Telebirr** - Mobile money
4. **CBE Birr** - Bank mobile payment

## 🔍 Payment Flow

```
User adds items to cart
    ↓
Proceeds to checkout
    ↓
Selects payment method (Chapa/Telebirr/CBE)
    ↓
Clicks "Proceed to Payment"
    ↓
Order created (PENDING payment)
    ↓
Payment initialized via GraphQL
    ↓
Chapa checkout opens in browser
    ↓
User completes payment
    ↓
Returns to app
    ↓
Payment verified automatically
    ↓
Order status updated (PAID/FAILED)
    ↓
Redirected to Order Tracking
```

## 📊 Payment Statuses

### Payment Status
- **PENDING** - Payment not completed
- **PAID** - Payment successful
- **FAILED** - Payment failed
- **REFUNDED** - Payment refunded

### Order Status
- **PENDING** - Waiting for restaurant
- **ACCEPTED** - Restaurant accepted
- **PICKED** - Rider picked up
- **DELIVERED** - Order delivered
- **CANCELLED** - Order cancelled

## 🐛 Troubleshooting

### Issue: Payment screen doesn't open
**Solution**: 
- Check backend is running
- Verify network connectivity
- Check console for errors

### Issue: Payment verification fails
**Solution**:
- Check transaction reference
- Verify Chapa credentials in `.env`
- Check backend logs

### Issue: "Network error"
**Solution**:
- Verify API URL in `apolloClient.js`
- Check backend is accessible
- Try restarting both backend and app

## 📝 Files Modified/Created

### Created Files
1. `mobile/src/services/chapaService.js` - Payment service
2. `mobile/src/screens/PaymentScreen.js` - Payment verification screen
3. `CHAPA_MOBILE_INTEGRATION.md` - Full documentation
4. `CHAPA_MOBILE_SETUP.md` - This setup guide

### Modified Files
1. `mobile/src/screens/CheckoutScreen.js` - Added Chapa integration
2. `mobile/src/navigation/MainNavigator.js` - Added Payment route
3. `mobile/src/screens/MyOrdersScreen.js` - Added payment status display

## 🔐 Security Notes

- Secret keys are stored in backend `.env` (not in mobile app)
- Payment verification happens on backend
- Mobile app only displays checkout URL
- All sensitive operations are server-side

## 📦 Dependencies

All required dependencies are already installed:
- `expo-web-browser` - For in-app browser
- `@apollo/client` - GraphQL client
- Backend has `chapa` package

## 🎯 Next Steps

1. **Test with different payment methods**
2. **Test on physical device**
3. **Add payment retry functionality**
4. **Implement webhooks for real-time updates**
5. **Add payment receipts**
6. **Test refund flow**

## 🌐 Production Checklist

Before going live:
- [ ] Replace test credentials with production keys
- [ ] Update callback URLs to production domain
- [ ] Test with real payment methods
- [ ] Set up webhook handling
- [ ] Add error monitoring
- [ ] Test on multiple devices
- [ ] Review security measures

## 📞 Support

- **Chapa Docs**: https://developer.chapa.co
- **Chapa Support**: support@chapa.co
- **Dashboard**: https://dashboard.chapa.co

## ✨ Features Implemented

✅ Multiple payment methods (Cash, Chapa, Telebirr, CBE Birr)
✅ In-app browser for secure payment
✅ Automatic payment verification
✅ Payment status tracking
✅ Order status updates
✅ Payment retry option (UI ready)
✅ Error handling
✅ Loading states
✅ User-friendly messages

## 🎉 Ready to Test!

Your Chapa payment integration is complete and ready for testing. Start the backend and mobile app, then try making a test payment!
