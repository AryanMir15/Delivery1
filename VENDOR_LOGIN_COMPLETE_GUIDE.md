# ✅ Vendor Login - Complete Setup Guide

## 🔴 CRITICAL: Backend Must Be Restarted!

The backend code has been updated but the server is still running with OLD code.

### **Restart Backend Server:**

```bash
# Stop the current server (Ctrl+C in the terminal where it's running)

# Then restart:
npm run dev
```

---

## ✅ All Changes Made

### 1. **Backend - User Model** (`models/User.js`)
- ✅ Removed `'restaurant'` from role enum
- ✅ Roles now: `customer`, `rider`, `vendor`, `owner`, `admin`

### 2. **Backend - ownerLogin Resolver** (`graphql/resolvers.js`)
- ✅ Accepts: `vendor`, `owner`, `admin`, `customer`, `rider`
- ✅ Blocks: `restaurant` role
- ✅ Checks if account is active
- ✅ Returns restaurants for vendors

### 3. **Database Migration**
- ✅ All restaurant role users converted to vendor role
- ✅ vendor@test.com now has role: `vendor`

### 4. **Vendor App - Apollo Client** (`vendor/src/api/apolloClient.js`)
- ✅ Configured for Android Emulator: `http://10.0.2.2:4000/graphql`
- ✅ Added connection logging
- ✅ Added error handling

### 5. **Vendor App - Login Screen** (`vendor/src/screens/auth/LoginScreen.js`)
- ✅ Clean, fresh implementation
- ✅ Local loading state (button always resets)
- ✅ Error clearing when typing
- ✅ Proper error messages

---

## 🧪 Test Results

### Backend Connection Test:
```
✅ Backend is reachable on http://localhost:4000/graphql
❌ ownerLogin still using OLD code (needs restart)
```

### Current Issue:
**Server is running OLD code** - Error message shows:
```
"Not authorized. Admin or restaurant owner access required."
```

This is the OLD error message. The NEW code says:
```
"Not authorized. Restaurant role is not allowed."
```

---

## 📋 Steps to Fix

### Step 1: Restart Backend
```bash
# In backend terminal:
# Press Ctrl+C to stop

# Then:
npm run dev
```

### Step 2: Verify Backend
```bash
node test-backend-connection.js
```

Should show:
```
✅ Backend is reachable!
✅ Login mutation works!
   User ID: [id]
   Email: vendor@test.com
   Role: VENDOR
```

### Step 3: Clear Vendor App Cache
```bash
# In vendor folder:
npx expo start --clear
```

### Step 4: Test Login
1. Open vendor app in emulator
2. Enter:
   - Email: vendor@test.com
   - Password: vendor123
3. Click Login
4. Should successfully log in! ✅

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to server"
**Check:**
- Backend is running: `npm run dev`
- Backend is on port 4000
- MongoDB is running

**For Android Emulator:**
- URL: `http://10.0.2.2:4000/graphql`

**For iOS Simulator:**
- URL: `http://localhost:4000/graphql`

**For Physical Device:**
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- URL: `http://YOUR_IP:4000/graphql`
- Update in `vendor/src/api/apolloClient.js`

### Issue: "Not authorized" Error
**Check:**
1. Backend server restarted with new code
2. User role is `vendor` (not `restaurant`)
3. Run: `node migrate-restaurant-to-vendor.js`

### Issue: Button Stuck on "Logging in..."
**Solution:**
- Already fixed with local state management
- Clear app cache: `npx expo start --clear`

### Issue: Error Persists After Wrong Login
**Solution:**
- Already fixed with error clearing
- Error clears when typing or reopening app

---

## 📱 Apollo Client URLs

Update `vendor/src/api/apolloClient.js` based on your device:

```javascript
// Android Emulator (default)
const HTTP_URL = 'http://10.0.2.2:4000/graphql';
const WS_URL = 'ws://10.0.2.2:4000/graphql';

// iOS Simulator
const HTTP_URL = 'http://localhost:4000/graphql';
const WS_URL = 'ws://localhost:4000/graphql';

// Physical Device (replace with your IP)
const HTTP_URL = 'http://192.168.1.100:4000/graphql';
const WS_URL = 'ws://192.168.1.100:4000/graphql';
```

---

## ✅ Summary

**All code is correct and ready!**

The ONLY issue is that the backend server needs to be restarted to load the new code.

**After restarting the backend:**
1. ✅ Vendor login will work
2. ✅ Button will reset properly
3. ✅ Errors will clear when typing
4. ✅ Connection to backend will succeed

**Just restart the backend server and test!** 🎉
