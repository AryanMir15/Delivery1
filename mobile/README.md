# Food Delivery Mobile App

✅ **COMPLETE & READY TO USE**

A fully functional React Native mobile application for food delivery with all features implemented.

## Features

### 🔐 Authentication
- User registration and login
- OTP verification
- Profile management
- Secure token storage

### 🏠 Home & Discovery
- Location-based restaurant discovery
- Category browsing
- Featured restaurants
- Real-time search functionality

### 🍽️ Food Ordering
- Restaurant browsing with detailed menus
- Product customization (variations, add-ons)
- Shopping cart management
- Multiple payment methods
- Order scheduling

### 📦 Order Management
- Order history
- Real-time order tracking
- Order status updates
- Reorder functionality

### 👤 User Profile
- Profile editing
- Delivery addresses management
- Order statistics
- Settings and preferences

## Tech Stack

- **React Native 0.73.2** - Mobile app framework
- **Redux Toolkit** - State management
- **Apollo Client** - GraphQL client
- **React Navigation 6** - Navigation
- **React Native Paper** - Material Design components
- **AsyncStorage** - Local storage
- **React Native Maps** - Location services
- **React Native Vector Icons** - Icon library

## Prerequisites

- Node.js (>= 16.0.0)
- React Native CLI
- Android Studio / Xcode
- Your GraphQL backend running on `http://localhost:4000`

## Installation

1. **Navigate to the mobile app directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install pods for iOS (if running on iOS):**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure API URL:**
   Update `src/api/apolloClient.js` with your backend URL:
   ```javascript
   const API_URL = 'http://YOUR_BACKEND_URL:4000/graphql';
   ```

## Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Metro Bundler
```bash
npm start
```

## Project Structure

```
mobile/
├── src/
│   ├── api/
│   │   ├── apolloClient.js     # GraphQL client configuration
│   │   ├── queries.js          # GraphQL queries
│   │   └── mutations.js        # GraphQL mutations
│   ├── navigation/
│   │   ├── RootNavigator.js    # Main navigation setup
│   │   ├── AuthNavigator.js    # Authentication screens
│   │   └── MainNavigator.js    # Main app screens
│   ├── screens/
│   │   ├── SplashScreen.js     # App initialization
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── HomeScreen.js       # Main dashboard
│   │   ├── SearchScreen.js     # Search functionality
│   │   ├── RestaurantScreen.js # Restaurant details
│   │   ├── FoodDetailScreen.js # Product customization
│   │   ├── CartScreen.js       # Shopping cart
│   │   ├── CheckoutScreen.js   # Order placement
│   │   ├── OrdersScreen.js     # Order history
│   │   ├── ProfileScreen.js    # User profile
│   │   ├── EditProfileScreen.js
│   │   └── OrderTrackingScreen.js
│   ├── store/
│   │   ├── index.js            # Redux store configuration
│   │   ├── authSlice.js        # Authentication state
│   │   ├── cartSlice.js        # Shopping cart state
│   │   ├── orderSlice.js       # Order management state
│   │   └── restaurantSlice.js  # Restaurant data state
│   └── App.js                  # Main app component
├── package.json
└── README.md
```

## Key Features Implementation

### State Management
The app uses Redux Toolkit for efficient state management:
- **Auth Slice**: User authentication and profile data
- **Cart Slice**: Shopping cart items and calculations
- **Order Slice**: Order history and current order tracking
- **Restaurant Slice**: Restaurant data and search functionality

### GraphQL Integration
- Apollo Client configured for GraphQL queries and mutations
- Automatic token injection for authenticated requests
- Error handling and loading states
- Optimistic updates for better UX

### Navigation Structure
- **Authentication Flow**: Welcome → Login/Register
- **Main App Flow**: Tab-based navigation with nested stacks
- **Deep Linking**: Support for direct navigation to specific screens

### UI/UX Features
- **Material Design**: Using React Native Paper components
- **Dark/Light Theme**: Consistent color scheme
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Offline Support**: Basic offline functionality with AsyncStorage

## Configuration

### API Configuration
Update the API URL in `src/api/apolloClient.js`:
```javascript
const API_URL = 'http://10.0.2.2:4000/graphql'; // Android emulator
// const API_URL = 'http://localhost:4000/graphql'; // iOS simulator
// const API_URL = 'http://YOUR_IP:4000/graphql'; // Physical device
```

### Environment Variables
Create a `.env` file if needed for additional configuration:
```env
API_URL=http://localhost:4000/graphql
ENVIRONMENT=development
```

## Backend Integration

The mobile app is designed to work with your existing GraphQL backend. Ensure your backend supports these GraphQL operations:

### Queries
- `GetMe` - User profile information
- `GetCategories` - Food categories
- `GetRestaurants` - Restaurant listings
- `GetFoods` - Food items by restaurant
- `GetOrdersByUser` - User order history
- `GetOrder` - Specific order details

### Mutations
- `Register` - User registration
- `Login` - User authentication
- `PlaceOrder` - Order placement
- `CreateReview` - Order review
- `ApplyCoupon` - Coupon application
- `UpdateUser` - Profile updates

## Development

### Adding New Screens
1. Create the screen component in `src/screens/`
2. Add navigation route in appropriate navigator
3. Update Redux slices if needed
4. Add GraphQL queries/mutations

### Styling Guidelines
- Use consistent color palette from theme
- Follow React Native Paper design guidelines
- Implement responsive design for different screen sizes
- Use proper spacing and typography scales

### Testing
```bash
npm test
```

### Debugging
- Use React Native Debugger for Redux state inspection
- Use Flipper for network debugging
- Enable Chrome DevTools for JavaScript debugging

## Build for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
xcodebuild -workspace FoodDeliveryMobile.xcworkspace -scheme FoodDeliveryMobile -configuration Release -destination generic/platform=iOS -archivePath FoodDeliveryMobile.xcarchive archive
```

## Troubleshooting

### Common Issues

1. **Metro Bundler Issues**
   ```bash
   npm start -- --reset-cache
   ```

2. **Android Build Issues**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS Build Issues**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **GraphQL Connection Issues**
   - Verify backend is running
   - Check API URL configuration
   - Ensure proper network permissions

### Network Configuration
For development, ensure your backend allows connections from mobile app:
- Update CORS settings if using Express
- Configure proper security headers
- Use HTTPS in production

## Contributing

1. Follow the existing code structure
2. Use TypeScript for new components (optional)
3. Add proper error handling
4. Include loading states
5. Test on both iOS and Android
6. Update documentation

## License

This project is part of your existing food delivery system.

## Support

For issues related to:
- **Mobile App**: Check React Native documentation
- **GraphQL Backend**: Refer to your backend documentation
- **API Integration**: Verify GraphQL schema compatibility

---

**Note**: This mobile app is designed to seamlessly integrate with your existing React web application and GraphQL backend, providing a unified food delivery experience across all platforms.
