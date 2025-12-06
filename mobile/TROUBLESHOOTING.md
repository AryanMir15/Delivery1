# Mobile App Not Displaying in Expo Go - Troubleshooting Guide

## Common Issues and Solutions

### Issue: Blank/White Screen in Expo Go

This usually happens due to one of these reasons:

1. **Cache Issues**
2. **Network Connection Problems**
3. **Metro Bundler Not Running Properly**
4. **Redux Persist Initialization Issues**

## Solutions (Try in Order)

### Solution 1: Clear Cache and Restart

```bash
cd mobile
npx expo start --clear
```

Then in Expo Go:
- Shake device or press Ctrl+M (Android) / Cmd+D (iOS)
- Select "Reload"

### Solution 2: Reset Everything

```bash
cd mobile
# Delete cache
del /q /s .expo
del /q /s node_modules\.cache

# Restart with clear cache
npx expo start --clear --reset-cache
```

### Solution 3: Check Network Connection

Make sure your phone and computer are on the **same WiFi network**.

Current API URL in `src/api/apolloClient.js`:
```
http://10.80.214.227:4000/graphql
```

To find your correct IP:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### Solution 4: Enable Debug Mode

Add console logs to see what's happening:

1. Open Expo Go app
2. Shake device or press Ctrl+M (Android) / Cmd+D (iOS)
3. Select "Debug Remote JS"
4. Open browser console to see logs

### Solution 5: Test with Minimal App

Create a test file to verify Expo Go is working:

```bash
cd mobile
```

Create `AppTest.js`:
```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppTest() {
  console.log('AppTest rendering');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello from Expo Go!</Text>
      <Text style={styles.text}>If you see this, Expo Go is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    marginVertical: 10,
  },
});
```

Then temporarily modify `App.js`:
```javascript
import AppTest from './AppTest';
export default AppTest;
```

If this works, the issue is in your main app code.

### Solution 6: Check Redux Persist

The app might be stuck waiting for Redux to rehydrate. Try disabling persistence temporarily:

In `App.js`, replace:
```javascript
<PersistGate loading={null} persistor={persistor}>
```

With:
```javascript
<PersistGate loading={<Text>Loading...</Text>} persistor={persistor}>
```

### Solution 7: Verify Dependencies

```bash
cd mobile
npm install
```

Make sure all dependencies are installed correctly.

## Quick Diagnostic Commands

### Check if Metro Bundler is Running
When you run `npx expo start`, you should see:
```
Metro waiting on exp://192.168.x.x:8081
```

### Check Backend Connection
```bash
cd ..
node test-frontend-backend-connection.js
```

### Verify Backend is Running
```bash
# In another terminal
cd ..
npm start
```

Backend should be running on `http://localhost:4000`

## Step-by-Step Fresh Start

1. **Stop all running processes** (Ctrl+C in all terminals)

2. **Clear mobile app cache:**
```bash
cd mobile
npx expo start --clear
```

3. **In Expo Go app:**
   - Close the app completely
   - Reopen Expo Go
   - Scan QR code again

4. **Watch the terminal** for any error messages

5. **Check Expo Go app** - you should see the splash screen, then the Welcome screen

## Still Not Working?

### Enable Verbose Logging

Modify `App.js` to add more logging:

```javascript
const App = () => {
  console.log('=== APP STARTING ===');
  
  useEffect(() => {
    console.log('=== APP MOUNTED ===');
    console.log('Store:', store.getState());
  }, []);

  console.log('=== APP RENDERING ===');
  
  return (
    // ... rest of code
  );
};
```

### Check Expo Go Logs

In terminal where `npx expo start` is running, you'll see logs from the app.

### Common Error Messages

**"Unable to resolve module"**
- Run: `npm install`
- Clear cache: `npx expo start --clear`

**"Network request failed"**
- Check backend is running
- Verify IP address in `apolloClient.js`
- Ensure same WiFi network

**"Invariant Violation"**
- Usually a navigation issue
- Check all screen components exist
- Verify navigation structure

## Contact Information

If none of these work, provide:
1. Terminal output from `npx expo start`
2. Any error messages in Expo Go
3. Console logs from Debug Remote JS
