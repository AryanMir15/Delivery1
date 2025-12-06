# Fix: Blank Screen in Expo Go After Build/Load

## Quick Fix Steps

### Step 1: Clear Cache and Restart
```bash
cd mobile
npx expo start --clear
```

### Step 2: In Expo Go App
- Close Expo Go completely
- Reopen and scan QR code again

### Step 3: If Still Blank - Test Simple App

Temporarily modify `mobile/index.js`:

```javascript
import { registerRootComponent } from 'expo';

// Test with simple app first
import App from './AppSimple';  // Change this line

registerRootComponent(App);
```

Run again:
```bash
npx expo start --clear
```

If you see "✅ Expo Go is Working!" - the issue is in the main app.

### Step 4: Switch Back to Main App

Change `mobile/index.js` back:
```javascript
import App from './App';  // Back to main app
```

### Step 5: Check Console Logs

The updated App.js now has detailed logging. Watch your terminal for:
- `=== App component rendering ===`
- `=== App component mounted ===`
- `=== Redux Persist: Before Lift ===`
- `=== Navigation Ready ===`

If you don't see these logs, there's a JavaScript error preventing the app from loading.

## Common Causes

1. **Metro Bundler Cache** - Fixed by `--clear` flag
2. **Redux Persist Stuck** - Now shows "Loading..." if stuck
3. **Network Issue** - Backend not reachable at `http://10.80.214.227:4000/graphql`
4. **Missing Dependencies** - Run `npm install` in mobile folder

## Verify Backend Connection

```bash
# From root directory
node test-frontend-backend-connection.js
```

Backend must be running:
```bash
npm start
```

## Check Your IP Address

```bash
ipconfig
```

Update `mobile/src/api/apolloClient.js` if your IP changed:
```javascript
const API_URL = 'http://YOUR_IP_HERE:4000/graphql';
```

## Enable Remote Debugging

1. In Expo Go, shake device or press Ctrl+M (Android) / Cmd+D (iOS)
2. Select "Debug Remote JS"
3. Browser will open with console logs
4. Look for error messages

## Still Not Working?

Run the simple test app and check the TROUBLESHOOTING.md file for more detailed solutions.
