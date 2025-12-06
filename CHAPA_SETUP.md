# 🚀 Quick Chapa Payment Setup

## Step 1: Get Your Chapa Test Credentials

1. Visit [Chapa Dashboard](https://dashboard.chapa.co)
2. Sign up or log in to your account
3. Go to **Settings** → **API Keys**
4. Copy your **Test Secret Key**
5. Copy your **Test Public Key**

## Step 2: Configure Backend

Edit your `.env` file in the root directory:

```bash
# Replace these with your actual Chapa test credentials
CHAPA_SECRET_KEY=CHASECK_TEST-xxxxxxxxxxxxxxxxxx
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-xxxxxxxxxxxxxxxxxx
CHAPA_WEBHOOK_SECRET=your_random_webhook_secret_123
```

**Note:** Keep your `.env` file secure and never commit it to version control!

## Step 3: Install Mobile Dependencies

```bash
cd mobile
npm install
```

This will install `expo-web-browser` which is required for the payment flow.

## Step 4: Start Backend Server

```bash
# From root directory
npm run dev
```

Backend will start on `http://localhost:4000`

## Step 5: Start Mobile App

```bash
# From mobile directory
npm start

# Then press:
# 'a' for Android emulator
# 'i' for iOS simulator
```

## Step 6: Test Payment Flow

### Using Test Cards

Chapa provides test cards for testing:

**Mastercard (Success):**
- Card: `5555 5555 5555 4444`
- Expiry: `12/25` (any future date)
- CVV: `123` (any 3 digits)

**Visa (Success):**
- Card: `4111 1111 1111 1111`
- Expiry: `12/25`
- CVV: `123`

### Test Flow:

1. **Open mobile app** and browse products
2. **Add items to cart**
3. **Go to checkout**
4. **Select delivery address**
5. **Choose "Chapa Payment"**
6. **Click "Place Order"**
7. **Payment page opens** in browser
8. **Enter test card details**
9. **Complete payment**
10. **Verify order status** changes to "paid"

## 🎯 Quick Test Checklist

- [ ] Backend server running on port 4000
- [ ] Mobile app connected to backend
- [ ] Chapa credentials configured in `.env`
- [ ] Test card payment successful
- [ ] Order status updates to "paid"
- [ ] Payment appears in Chapa dashboard

## 🔍 Verify Integration

### Check Backend Logs
```bash
# You should see:
✅ Payment webhook processed for order ORD-000001: success
```

### Check Chapa Dashboard
1. Go to [Chapa Dashboard](https://dashboard.chapa.co)
2. Navigate to **Transactions**
3. Verify your test payment appears

### Check Order Status
```graphql
# Query in GraphQL Playground (http://localhost:4000/graphql)
query {
  order(id: "your_order_id") {
    orderId
    paymentStatus
    paymentTransactionId
    orderAmount
    paidAmount
  }
}
```

## 🐛 Common Issues

### "Payment initialization failed"
- Check Chapa credentials in `.env`
- Verify backend server is running
- Check console for error messages

### "Cannot connect to backend"
- Android Emulator: Use `http://10.0.2.2:4000/graphql`
- iOS Simulator: Use `http://localhost:4000/graphql`
- Physical Device: Use your computer's IP address

### "Payment page doesn't open"
- Make sure `expo-web-browser` is installed
- Run `npm install` in mobile directory
- Restart Expo dev server

## 📱 Mobile App Configuration

Update `mobile/src/api/apolloClient.js` with correct backend URL:

```javascript
// Android Emulator
const API_URL = 'http://10.0.2.2:4000/graphql';

// iOS Simulator
// const API_URL = 'http://localhost:4000/graphql';

// Physical Device (replace with your IP)
// const API_URL = 'http://192.168.1.100:4000/graphql';
```

## 🎉 Success!

If you can complete a test payment and see the order status change to "paid", your integration is working!

## 📚 Next Steps

- Read the full [CHAPA_INTEGRATION_GUIDE.md](./CHAPA_INTEGRATION_GUIDE.md)
- Test different payment scenarios
- Implement error handling
- Add payment retry logic
- Set up webhook monitoring
- Prepare for production deployment

## 💬 Need Help?

- Check [CHAPA_INTEGRATION_GUIDE.md](./CHAPA_INTEGRATION_GUIDE.md) for detailed documentation
- Review Chapa's [official documentation](https://developer.chapa.co)
- Contact Chapa support: support@chapa.co

---

**Happy Testing! 🚀**
