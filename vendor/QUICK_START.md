# Vendor App - Quick Start (5 Minutes)

## 🚀 Fastest Way to Get Started

### 1. Install Dependencies (2 min)
```bash
cd vendor
npm install
```

### 2. Configure API URL (1 min)

Edit `src/api/apolloClient.js`:

**Line 10-11:**
```javascript
// Change this based on your setup:
const HTTP_URL = 'http://10.0.2.2:4000/graphql';  // Android Emulator
// const HTTP_URL = 'http://localhost:4000/graphql';  // iOS Simulator
// const HTTP_URL = 'http://YOUR_IP:4000/graphql';  // Physical Device
```

### 3. Start Backend (30 sec)
```bash
# In root directory
cd ..
npm run dev
```

### 4. Start Vendor App (30 sec)
```bash
cd vendor
npm start
```

### 5. Run on Device (1 min)

Press `a` for Android or `i` for iOS in the terminal.

### 6. Login

```
Email: owner@test.com
Password: Test123!
```

## ✅ You're Done!

The app should now be running. You can:
- View dashboard with stats
- Manage orders
- Add/edit products
- View analytics
- Update shop settings

## 🆘 Quick Fixes

**Can't connect to backend?**
```bash
# Check backend is running
curl http://localhost:4000/graphql

# For physical device, use your IP:
# Windows: ipconfig
# Mac: ifconfig | grep "inet "
```

**Metro bundler issues?**
```bash
npm start --clear
```

**Module errors?**
```bash
rm -rf node_modules && npm install
```

## 📱 Test Features

1. **Dashboard** - View stats, toggle shop open/close
2. **Orders** - Accept orders, update status
3. **Products** - Add product with image
4. **Analytics** - View revenue charts
5. **Profile** - Update shop settings

## 🎯 Next Steps

- Read full [SETUP_GUIDE.md](./SETUP_GUIDE.md) for details
- Check [README.md](./README.md) for features
- Customize colors and branding
- Add your own products
- Test complete order flow

---

**Need help?** Check SETUP_GUIDE.md for troubleshooting.
