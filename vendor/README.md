# Vendor Mobile App

A complete React Native mobile application for shop owners/vendors to manage their products, orders, and shop settings on the go.

## Features

### 📊 Dashboard
- Real-time revenue and order statistics
- Today's revenue, orders count
- Pending and active orders overview
- Quick actions for common tasks
- Shop open/close toggle

### 📦 Order Management
- View orders by status (Pending, Active, Completed, All)
- Real-time order updates (polls every 5 seconds)
- Accept/reject incoming orders
- Update order status (Accepted → Preparing → Ready → Picked)
- View detailed order information
- Call customer directly from app
- Payment status tracking

### 🍕 Product Management
- View all products with search
- Add new products with images
- Edit existing products
- Toggle product availability (in stock/out of stock)
- Multiple variations per product (sizes, prices)
- Category management
- Image upload support

### 📈 Analytics
- Revenue trends (Today, Week, Month, Year)
- Order statistics and charts
- Average order value
- Order status distribution
- Visual charts with react-native-chart-kit

### ⚙️ Shop Settings
- Update shop information
- Manage contact details
- Set minimum order amount
- Configure delivery time
- Set tax rate
- Toggle shop availability

### 👤 Profile
- View vendor information
- Shop statistics (rating, reviews)
- Access settings and support
- Logout functionality

## Technology Stack

- **Framework**: React Native 0.74.5 with Expo SDK 51
- **State Management**: Redux Toolkit with Redux Persist
- **GraphQL Client**: Apollo Client 3.14
- **Navigation**: React Navigation 6 (Stack + Bottom Tabs)
- **UI Library**: React Native Paper
- **Charts**: react-native-chart-kit
- **Notifications**: Expo Notifications
- **Image Picker**: Expo Image Picker

## Installation

1. **Install dependencies**
```bash
cd vendor
npm install
```

2. **Configure API URL**

Edit `src/api/apolloClient.js` and update the API URLs:

```javascript
// For Android Emulator
const HTTP_URL = 'http://10.0.2.2:4000/graphql';
const WS_URL = 'ws://10.0.2.2:4000/graphql';

// For iOS Simulator
const HTTP_URL = 'http://localhost:4000/graphql';
const WS_URL = 'ws://localhost:4000/graphql';

// For Physical Device (replace with your IP)
const HTTP_URL = 'http://YOUR_IP:4000/graphql';
const WS_URL = 'ws://YOUR_IP:4000/graphql';
```

3. **Start the app**
```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS (Mac only)
- `w` for web

## Project Structure

```
vendor/
├── src/
│   ├── api/
│   │   ├── apolloClient.js      # GraphQL client setup
│   │   ├── queries.js           # GraphQL queries
│   │   └── mutations.js         # GraphQL mutations
│   ├── navigation/
│   │   ├── RootNavigator.js     # Main navigation
│   │   ├── AuthNavigator.js     # Auth screens
│   │   └── MainNavigator.js     # Bottom tabs
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── OrdersScreen.js
│   │   ├── OrderDetailScreen.js
│   │   ├── ProductsScreen.js
│   │   ├── ProductFormScreen.js
│   │   ├── AnalyticsScreen.js
│   │   ├── ProfileScreen.js
│   │   └── ShopProfileScreen.js
│   ├── store/
│   │   ├── index.js             # Redux store
│   │   ├── authSlice.js         # Auth state
│   │   ├── orderSlice.js        # Orders state
│   │   ├── productSlice.js      # Products state
│   │   └── shopSlice.js         # Shop state
│   └── utils/
│       ├── notifications.js     # Push notifications
│       └── soundAlerts.js       # Sound alerts
├── App.js                       # Root component
├── package.json
└── app.json                     # Expo configuration
```

## Key Features Explained

### Real-Time Order Updates
Orders are automatically refreshed every 5-10 seconds using Apollo Client's `pollInterval`. New orders trigger notifications.

### Order Status Flow
```
Pending → Accepted → Preparing → Ready → Picked → Delivered
         ↓
      Cancelled
```

### Product Variations
Each product can have multiple variations (e.g., Small, Medium, Large) with different prices and optional discounted prices.

### Image Upload
Images are uploaded to the backend using the `uploadImageToS3` mutation and stored as base64 strings.

### Offline Support
Redux Persist caches authentication and shop data locally for offline access.

## GraphQL Operations

### Queries
- `restaurantsByOwner` - Get vendor's shops
- `ordersByRestaurant` - Get shop orders
- `foods` - Get products
- `categories` - Get product categories

### Mutations
- `ownerLogin` - Vendor authentication
- `updateOrderStatus` - Update order status
- `createFood` - Add new product
- `updateFood` - Edit product
- `updateRestaurant` - Update shop settings
- `uploadImageToS3` - Upload images

## Test Credentials

```
Email: owner@test.com
Password: Test123!
```

## Backend Requirements

The app requires the following backend GraphQL operations to be available:
- ✅ Owner authentication (`ownerLogin`)
- ✅ Restaurant/shop management
- ✅ Order management with status updates
- ✅ Product (food) CRUD operations
- ✅ Image upload support
- ✅ Real-time subscriptions (optional)

## Notifications

The app supports:
- Push notifications (Expo Notifications)
- Local notifications for new orders
- Sound alerts (requires audio file)
- Badge updates

## Development Tips

1. **Hot Reload**: Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for dev menu
2. **Debug**: Use React Native Debugger or Flipper
3. **Network**: Ensure backend is running and accessible
4. **Permissions**: Grant camera and notification permissions

## Common Issues

### Cannot connect to backend
- Check API URL in `apolloClient.js`
- Ensure backend is running on port 4000
- For physical devices, use your computer's IP address

### Images not uploading
- Check camera roll permissions
- Verify `uploadImageToS3` mutation is working
- Check image size (should be < 5MB)

### Orders not updating
- Check WebSocket connection
- Verify `pollInterval` is set in queries
- Check network connectivity

## Building for Production

### Android
```bash
npx expo build:android
```

### iOS (Mac only)
```bash
npx expo build:ios
```

## Future Enhancements

- [ ] Push notification integration with FCM
- [ ] Offline order queue
- [ ] Bulk product import
- [ ] Advanced analytics with filters
- [ ] Multi-shop support
- [ ] Order printing
- [ ] Customer chat support
- [ ] Inventory management

## Support

For issues or questions:
- Check the main project README
- Review GraphQL schema documentation
- Contact: support@vendorapp.com

## License

ISC License

---

**Built with ❤️ for efficient shop management**
