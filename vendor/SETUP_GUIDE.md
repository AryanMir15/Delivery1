# Vendor App - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 16 or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - Mac only)

## Step-by-Step Installation

### 1. Install Dependencies

```bash
cd vendor
npm install
```

This will install all required packages including:
- React Native and Expo
- Apollo Client for GraphQL
- Redux Toolkit for state management
- React Navigation
- React Native Paper UI components
- And more...

### 2. Configure Backend Connection

Open `src/api/apolloClient.js` and update the API URLs based on your setup:

#### For Android Emulator:
```javascript
const HTTP_URL = 'http://10.0.2.2:4000/graphql';
const WS_URL = 'ws://10.0.2.2:4000/graphql';
```

#### For iOS Simulator:
```javascript
const HTTP_URL = 'http://localhost:4000/graphql';
const WS_URL = 'ws://localhost:4000/graphql';
```

#### For Physical Device:
```javascript
// Replace YOUR_IP with your computer's IP address
const HTTP_URL = 'http://192.168.1.100:4000/graphql';
const WS_URL = 'ws://192.168.1.100:4000/graphql';
```

**To find your IP address:**
- Windows: `ipconfig` in Command Prompt
- Mac/Linux: `ifconfig` in Terminal

### 3. Start the Backend Server

Make sure your backend server is running:

```bash
cd ..  # Go to root directory
npm run dev
```

The backend should be running on `http://localhost:4000`

### 4. Start the Vendor App

```bash
cd vendor
npm start
```

This will start the Expo development server and show a QR code.

### 5. Run on Device/Emulator

#### Android Emulator:
```bash
npm run android
```

Or press `a` in the Expo terminal.

#### iOS Simulator (Mac only):
```bash
npm run ios
```

Or press `i` in the Expo terminal.

#### Physical Device:
1. Install **Expo Go** app from Play Store (Android) or App Store (iOS)
2. Scan the QR code shown in terminal
3. Make sure your phone and computer are on the same WiFi network

## Test Login Credentials

Use these credentials to test the app:

```
Email: owner@test.com
Password: Test123!
```

## Troubleshooting

### Issue: Cannot connect to backend

**Solution:**
1. Verify backend is running: `http://localhost:4000/graphql`
2. Check API URL in `apolloClient.js`
3. For physical devices, use your computer's IP address
4. Disable firewall temporarily to test
5. Ensure both devices are on same network

### Issue: Metro bundler errors

**Solution:**
```bash
# Clear cache and restart
npm start --clear
# or
npx expo start --clear
```

### Issue: Module not found errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Android build fails

**Solution:**
1. Check Android Studio is installed
2. Set ANDROID_HOME environment variable
3. Accept Android SDK licenses:
```bash
cd $ANDROID_HOME/tools/bin
./sdkmanager --licenses
```

### Issue: iOS build fails (Mac only)

**Solution:**
1. Install Xcode from App Store
2. Install Xcode Command Line Tools:
```bash
xcode-select --install
```
3. Install CocoaPods:
```bash
sudo gem install cocoapods
```

### Issue: Images not uploading

**Solution:**
1. Grant camera/photo permissions
2. Check backend upload mutation is working
3. Verify image size is reasonable (< 5MB)

### Issue: Notifications not working

**Solution:**
1. Grant notification permissions
2. Check Expo push notification setup
3. Verify notification token is being sent to backend

## Development Workflow

### 1. Making Changes

The app supports hot reloading. Just save your files and changes will appear automatically.

### 2. Debugging

**Open Dev Menu:**
- Android: Shake device or press `Cmd+M`
- iOS: Shake device or press `Cmd+D`

**Debug Options:**
- Enable Remote JS Debugging
- Show Performance Monitor
- Toggle Inspector

**Recommended Tools:**
- React Native Debugger
- Flipper
- Chrome DevTools

### 3. Testing on Multiple Devices

You can run the app on multiple devices simultaneously:
1. Start the Expo server: `npm start`
2. Scan QR code on each device
3. All devices will hot reload together

## Project Structure Overview

```
vendor/
├── src/
│   ├── api/              # GraphQL client and operations
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # All app screens
│   ├── store/            # Redux state management
│   └── utils/            # Utility functions
├── App.js               # Root component
├── package.json         # Dependencies
└── app.json            # Expo configuration
```

## Key Features to Test

### ✅ Authentication
1. Login with test credentials
2. View vendor profile
3. Logout and login again

### ✅ Dashboard
1. View today's stats
2. Toggle shop open/close
3. View recent orders
4. Use quick actions

### ✅ Orders
1. View orders by status tabs
2. Open order details
3. Accept/reject pending orders
4. Update order status
5. Call customer

### ✅ Products
1. View product list
2. Search products
3. Add new product with image
4. Edit existing product
5. Toggle stock availability

### ✅ Analytics
1. Switch between time periods
2. View revenue charts
3. Check order statistics

### ✅ Settings
1. Update shop information
2. Change delivery settings
3. Toggle shop availability

## Building for Production

### Android APK

```bash
# Build APK
npx expo build:android -t apk

# Build AAB (for Play Store)
npx expo build:android -t app-bundle
```

### iOS IPA (Mac only)

```bash
npx expo build:ios
```

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Environment Variables

Create a `.env` file in the vendor directory:

```env
API_URL=http://10.0.2.2:4000/graphql
WS_URL=ws://10.0.2.2:4000/graphql
```

## Performance Optimization

### 1. Enable Hermes (Android)

In `app.json`:
```json
{
  "expo": {
    "android": {
      "enableHermes": true
    }
  }
}
```

### 2. Optimize Images

- Use WebP format
- Compress images before upload
- Use appropriate image sizes

### 3. Reduce Bundle Size

```bash
# Analyze bundle
npx expo-cli customize:web

# Remove unused dependencies
npm prune
```

## Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update Expo SDK
expo upgrade
```

## Common Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start --clear

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Build for production
npx expo build:android
npx expo build:ios
```

## Getting Help

If you encounter issues:

1. Check this guide first
2. Review the main README.md
3. Check Expo documentation: https://docs.expo.dev
4. Check React Native documentation: https://reactnative.dev
5. Search GitHub issues
6. Contact support

## Next Steps

After successful setup:

1. ✅ Test all features with test account
2. ✅ Create your own vendor account
3. ✅ Add your products
4. ✅ Test order flow end-to-end
5. ✅ Customize branding (colors, logo)
6. ✅ Configure push notifications
7. ✅ Build and deploy to stores

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [Apollo Client](https://www.apollographql.com/docs/react)

---

**Happy Coding! 🚀**
