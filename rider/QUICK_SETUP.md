# 🚀 Rider App - Quick Setup (5 Minutes)

## ✅ What's Included

Complete rider/driver app with:
- Live GPS tracking
- Google Maps with navigation
- Real-time order updates
- Earnings tracking

---

## 📦 Step 1: Install Dependencies (2 min)

```bash
cd rider
npm install
```

---

## 🗺️ Step 2: Configure Google Maps (2 min)

### Get API Key:
1. Go to: https://console.cloud.google.com/
2. Create project
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS  
   - Directions API
4. Create API key

### Add API Key:

**File 1:** `rider/app.json` (line 28)
```json
"googleMaps": {
  "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
}
```

**File 2:** `rider/src/screens/DeliveryScreen.js` (line 27)
```javascript
const GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

---

## 🔌 Step 3: Configure Backend (1 min)

Edit `rider/src/api/apolloClient.js`:

```javascript
// Android Emulator (default)
const HTTP_URL = 'http://10.0.2.2:4000/graphql';
const WS_URL = 'ws://10.0.2.2:4000/graphql';

// iOS Simulator
// const HTTP_URL = 'http://localhost:4000/graphql';
// const WS_URL = 'ws://localhost:4000/graphql';

// Physical Device (use your IP)
// const HTTP_URL = 'http://192.168.1.XXX:4000/graphql';
// const WS_URL = 'ws://192.168.1.XXX:4000/graphql';
```

---

## 🚀 Step 4: Run the App

```bash
# Android
npm run android

# iOS (Mac only)
npm run ios
```

---

## 🎮 Test It Out

1. **Login:**
   - Email: rider@example.com
   - Password: password123

2. **Accept Order:**
   - View available orders
   - Tap to accept

3. **Start Delivery:**
   - See live map with route
   - Navigate to restaurant
   - Mark "Picked Up"
   - Navigate to customer
   - Mark "Delivered"

---

## ✅ Features Working

- ✅ Live GPS tracking (updates every 5 sec)
- ✅ Google Maps with route
- ✅ Turn-by-turn navigation
- ✅ Distance & ETA calculation
- ✅ Call restaurant/customer
- ✅ Real-time status updates
- ✅ Background location tracking

---

## 🐛 Common Issues

**Map not showing:**
- Add Google Maps API key
- Enable billing in Google Cloud
- Enable required APIs

**Location not updating:**
- Grant location permissions
- Enable GPS on device
- Allow background location

**Can't connect:**
- Check backend is running
- Use correct IP address
- For emulator: use `10.0.2.2`

---

## 📚 Full Documentation

See `README.md` for complete documentation.

---

**You're ready to deliver! 🚴**
