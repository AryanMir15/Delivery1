# Mobile App Setup

## ✅ Fixed Issues

The mobile app entry point has been created and configured. You're ready to run!

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

Open `mobile/src/api/apolloClient.js` and update the API URL:

```javascript
// For Android Emulator (default)
const API_URL = 'http://10.0.2.2:4000/graphql';

// For iOS Simulator
// const API_URL = 'http://localhost:4000/graphql';

// For Physical Device (replace with your computer's IP)
// const API_URL = 'http://192.168.1.XXX:4000/graphql';
```

### 3. Run the App

**For Android:**
```bash
npm run android
```

**For iOS (Mac only):**
```bash
npm run ios
```

**Start Metro Bundler:**
```bash
npm start
```

## 📱 App Structure

```
mobile/
├── index.js              # Entry point (✅ Created)
├── App.js                # Main app component
├── app.json              # Expo configuration (✅ Created)
├── babel.config.js       # Babel configuration (✅ Created)
├── metro.config.js       # Metro bundler config (✅ Created)
├── package.json          # Dependencies
├── assets/               # App icons and splash (✅ Created)
└── src/
    ├── api/              # GraphQL queries & mutations
    ├── navigation/       # Navigation setup
    ├── screens/          # All app screens (16 screens)
    └── store/            # Redux state management
```

## 🎯 All Screens Available

### Authentication (5 screens)
1. ✅ WelcomeScreen
2. ✅ LoginScreen
3. ✅ RegisterScreen
4. ✅ OTPVerificationScreen
5. ✅ ForgotPasswordScreen

### Main App (11 screens)
1. ✅ SplashScreen
2. ✅ HomeScreen
3. ✅ SearchScreen
4. ✅ RestaurantScreen
5. ✅ FoodDetailScreen
6. ✅ CartScreen
7. ✅ CheckoutScreen
8. ✅ OrdersScreen
9. ✅ OrderTrackingScreen
10. ✅ ProfileScreen
11. ✅ EditProfileScreen

## 🔧 Troubleshooting

### "Cannot resolve entry file"
✅ **FIXED!** The `index.js` file has been created.

### "Module not found: babel-preset-expo"
Run:
```bash
npm install
```

### "Cannot connect to backend"
1. Make sure backend is running: `http://localhost:4000/health`
2. Update API URL in `src/api/apolloClient.js`
3. For Android emulator, use `10.0.2.2` instead of `localhost`

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### Build errors
```bash
# Clear and reinstall
rm -rf node_modules
npm install

# For iOS
cd ios && pod install && cd ..
```

## 📦 Assets Needed

Add these files to the `assets/` folder:

1. **icon.png** (1024x1024) - App icon
2. **splash.png** (1242x2436) - Splash screen
3. **adaptive-icon.png** (1024x1024) - Android adaptive icon
4. **favicon.png** (48x48) - Web favicon

You can use placeholder images for now or create your own.

## 🎉 You're Ready!

The mobile app is now properly configured and ready to run. Just:

1. Make sure backend is running
2. Install dependencies: `npm install`
3. Run the app: `npm run android` or `npm run ios`

Happy coding! 🚀
