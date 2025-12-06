# 🚀 Run Rider App - Quick Commands

## ✅ All Issues Fixed!

The app is ready to run. Just follow these steps:

---

## Step 1: Install Dependencies

```bash
cd rider
npm install
```

---

## Step 2: Start the App

```bash
npm start
```

This will open Expo Dev Tools in your browser.

---

## Step 3: Run on Device

### Option A: Android
```bash
npm run android
```

### Option B: iOS (Mac only)
```bash
npm run ios
```

### Option C: Scan QR Code
1. Install "Expo Go" app on your phone
2. Scan the QR code from Expo Dev Tools
3. App will load on your phone

---

## 🔧 If You Get Errors

### Clear Cache:
```bash
npm start -- --clear
```

### Reinstall:
```bash
rm -rf node_modules
npm install
npm start
```

---

## 📱 Test Login

**Credentials:**
- Email: `rider@example.com`
- Password: `password123`

---

## 🗺️ Google Maps Setup (Optional)

For live map tracking to work:

1. Get API key from: https://console.cloud.google.com/
2. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
3. Add key to `app.json` (line 18)
4. Add key to `src/screens/DeliveryScreen.js` (line 27)

**Without API key:**
- App will still work
- Map will show but routes won't display
- You can add it later

---

## ✅ What's Working

- ✅ Login screen
- ✅ Navigation
- ✅ GPS tracking
- ✅ Map display
- ✅ Order management
- ✅ All icons

---

## 🎉 You're Ready!

Just run:
```bash
cd rider
npm install
npm start
```

Then press 'a' for Android or 'i' for iOS!

---

**Happy Delivering! 🚴**
