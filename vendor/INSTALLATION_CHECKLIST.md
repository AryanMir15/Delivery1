# Vendor App - Installation Checklist ✅

Use this checklist to ensure everything is set up correctly.

## Pre-Installation

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Backend server code available
- [ ] MongoDB running
- [ ] Backend server tested and working

## Installation Steps

### 1. Install Dependencies
- [ ] Navigate to vendor directory: `cd vendor`
- [ ] Run: `npm install`
- [ ] Wait for installation to complete (2-3 minutes)
- [ ] No errors in installation

### 2. Configure API Connection
- [ ] Open `src/api/apolloClient.js`
- [ ] Update `HTTP_URL` for your setup:
  - [ ] Android Emulator: `http://10.0.2.2:4000/graphql`
  - [ ] iOS Simulator: `http://localhost:4000/graphql`
  - [ ] Physical Device: `http://YOUR_IP:4000/graphql`
- [ ] Update `WS_URL` similarly
- [ ] Save file

### 3. Start Backend Server
- [ ] Open new terminal
- [ ] Navigate to root directory
- [ ] Run: `npm run dev`
- [ ] Backend starts successfully
- [ ] GraphQL endpoint accessible: `http://localhost:4000/graphql`

### 4. Start Vendor App
- [ ] In vendor directory
- [ ] Run: `npm start`
- [ ] Expo dev server starts
- [ ] QR code appears
- [ ] No errors in terminal

### 5. Run on Device/Emulator

#### Android Emulator
- [ ] Android Studio installed
- [ ] Emulator running
- [ ] Press `a` in terminal OR run `npm run android`
- [ ] App builds successfully
- [ ] App opens on emulator

#### iOS Simulator (Mac only)
- [ ] Xcode installed
- [ ] Simulator running
- [ ] Press `i` in terminal OR run `npm run ios`
- [ ] App builds successfully
- [ ] App opens on simulator

#### Physical Device
- [ ] Expo Go app installed
- [ ] Device on same WiFi as computer
- [ ] Scan QR code
- [ ] App loads successfully

## First Run Testing

### Login Screen
- [ ] Login screen appears
- [ ] Email field works
- [ ] Password field works
- [ ] Eye icon toggles password visibility
- [ ] Test credentials visible
- [ ] Login with: `owner@test.com` / `Test123!`
- [ ] Login successful
- [ ] Navigates to dashboard

### Dashboard
- [ ] Dashboard loads
- [ ] Shop name displays
- [ ] Stats cards show data
- [ ] Open/Close toggle works
- [ ] Quick actions visible
- [ ] Recent orders load (if any)
- [ ] Pull to refresh works

### Orders Tab
- [ ] Orders tab accessible
- [ ] Status tabs visible (Pending, Active, Completed, All)
- [ ] Orders list loads
- [ ] Can tap on order
- [ ] Order detail screen opens
- [ ] Back button works

### Products Tab
- [ ] Products tab accessible
- [ ] Search bar visible
- [ ] Products list loads (if any)
- [ ] FAB (+ button) visible
- [ ] Can tap "Add Product"
- [ ] Product form opens
- [ ] Back button works

### Analytics Tab
- [ ] Analytics tab accessible
- [ ] Period selector works
- [ ] Stats cards display
- [ ] Charts render correctly
- [ ] No errors

### Profile Tab
- [ ] Profile tab accessible
- [ ] User info displays
- [ ] Shop card shows
- [ ] Menu items visible
- [ ] Shop Settings opens
- [ ] Logout works

## Feature Testing

### Order Management
- [ ] Can view order details
- [ ] Can accept order (if pending)
- [ ] Can update order status
- [ ] Can call customer
- [ ] Status updates reflect immediately
- [ ] Payment info displays correctly

### Product Management
- [ ] Can add new product
- [ ] Can upload image
- [ ] Can select category
- [ ] Can add variations
- [ ] Can save product
- [ ] Product appears in list
- [ ] Can edit product
- [ ] Can toggle stock status
- [ ] Search works

### Shop Settings
- [ ] Can update shop name
- [ ] Can update address
- [ ] Can update phone
- [ ] Can update email
- [ ] Can change minimum order
- [ ] Can change delivery time
- [ ] Can change tax rate
- [ ] Can toggle availability
- [ ] Changes save successfully

## Performance Testing

- [ ] App loads quickly (< 3 seconds)
- [ ] Navigation is smooth
- [ ] No lag when scrolling
- [ ] Images load properly
- [ ] Pull to refresh works smoothly
- [ ] No crashes during use
- [ ] Memory usage reasonable

## Network Testing

- [ ] Orders update in real-time
- [ ] Can work with slow connection
- [ ] Handles network errors gracefully
- [ ] Shows loading states
- [ ] Shows error messages when needed
- [ ] Retry mechanisms work

## Offline Testing

- [ ] Turn off WiFi
- [ ] App doesn't crash
- [ ] Shows offline message (if implemented)
- [ ] Cached data still visible
- [ ] Turn on WiFi
- [ ] App reconnects automatically
- [ ] Data syncs

## Build Testing (Optional)

### Android APK
- [ ] Run: `npx expo build:android`
- [ ] Build completes successfully
- [ ] APK downloads
- [ ] APK installs on device
- [ ] App works from APK

### iOS IPA (Mac only)
- [ ] Run: `npx expo build:ios`
- [ ] Build completes successfully
- [ ] IPA downloads
- [ ] IPA installs on device
- [ ] App works from IPA

## Common Issues Resolved

- [ ] Fixed "Cannot connect to backend" error
- [ ] Fixed "Module not found" errors
- [ ] Fixed image upload issues
- [ ] Fixed navigation issues
- [ ] Fixed styling issues
- [ ] Fixed permission issues

## Documentation Review

- [ ] Read README.md
- [ ] Read SETUP_GUIDE.md
- [ ] Read QUICK_START.md
- [ ] Understand project structure
- [ ] Know how to debug
- [ ] Know how to build for production

## Final Checks

- [ ] All features working
- [ ] No console errors
- [ ] No console warnings (or acceptable)
- [ ] UI looks good
- [ ] Performance acceptable
- [ ] Ready for customization
- [ ] Ready for production use

## Post-Installation

- [ ] Customize branding (colors, logo)
- [ ] Add real products
- [ ] Test complete order flow
- [ ] Configure push notifications
- [ ] Set up analytics
- [ ] Prepare for app store submission

## Success Criteria

✅ **Installation Successful** if:
- App runs without errors
- Can login successfully
- All tabs accessible
- Can view and manage orders
- Can add/edit products
- Analytics display correctly
- Settings can be updated
- No crashes during normal use

## Need Help?

If any checkbox fails:
1. Check SETUP_GUIDE.md troubleshooting section
2. Review error messages carefully
3. Check backend is running
4. Verify API URLs are correct
5. Clear cache and restart: `npm start --clear`
6. Reinstall dependencies: `rm -rf node_modules && npm install`

---

**Once all checkboxes are complete, you're ready to go! 🎉**

**Installation Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete
