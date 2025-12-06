# Mobile App Testing Guide

## 🧪 Complete Testing Checklist

### Prerequisites
- ✅ Backend running on port 4000
- ✅ MongoDB connected with sample data
- ✅ Mobile app running in Expo
- ✅ Test account: customer@test.com / password123

---

## 1️⃣ Authentication Flow Testing

### Test 1.1: New User Registration
```
Steps:
1. Open app → See Welcome screen
2. Tap "Get Started"
3. Fill registration form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +1234567890
   - Password: password123
   - Confirm Password: password123
4. Tap "Create Account"
5. Check backend console for OTP code
6. Enter 6-digit OTP
7. Verify account created

Expected Result:
✅ OTP sent to email (check backend logs)
✅ OTP screen appears
✅ After verification, navigates to Categories screen
✅ User is logged in
```

### Test 1.2: Existing User Login
```
Steps:
1. Open app → Welcome screen
2. Tap "I already have an account"
3. Enter credentials:
   - Email: customer@test.com
   - Password: password123
4. Tap "Sign In"

Expected Result:
✅ Login successful
✅ Navigates to Categories screen
✅ User data loaded
```

### Test 1.3: Forgot Password
```
Steps:
1. Login screen → Tap "Forgot Password?"
2. Enter email: customer@test.com
3. Tap "Send Reset Link"
4. Check backend console for OTP

Expected Result:
✅ OTP sent message appears
✅ OTP logged in backend console
```

### Test 1.4: Invalid Credentials
```
Steps:
1. Try login with wrong password
2. Try login with non-existent email

Expected Result:
✅ Error message displayed
✅ User stays on login screen
```

---

## 2️⃣ Browse & Search Testing

### Test 2.1: View Categories
```
Steps:
1. After login → Categories screen
2. Scroll through 15 categories
3. Search for "Restaurant"

Expected Result:
✅ All 15 categories displayed
✅ Search filters categories
✅ Category icons and colors correct
```

### Test 2.2: Browse Businesses
```
Steps:
1. Tap "Restaurants" category
2. View business list
3. Try filter chips: All, Open Now, Top Rated
4. Search for business name

Expected Result:
✅ Businesses displayed with images
✅ Filters work correctly
✅ Search filters results
✅ Business cards show rating, delivery time, min order
```

### Test 2.3: View Business Details
```
Steps:
1. Tap on a business
2. View business info
3. Scroll through menu categories
4. Switch between category tabs

Expected Result:
✅ Business image and info displayed
✅ Rating and reviews shown
✅ Open/Closed status correct
✅ Menu items displayed by category
✅ Category tabs work
```

---

## 3️⃣ Product Selection Testing

### Test 3.1: View Product Details
```
Steps:
1. From business details, tap a product
2. View product information
3. Check variations (sizes)
4. Check addons (toppings)

Expected Result:
✅ Product image and description shown
✅ Variations listed with prices
✅ Addons grouped correctly
✅ Required/optional badges shown
```

### Test 3.2: Customize Product
```
Steps:
1. Select variation: Large
2. Add addons: Extra Cheese, Mushrooms
3. Enter special instructions: "No onions"
4. Increase quantity to 2
5. Check total price updates

Expected Result:
✅ Variation selected (highlighted)
✅ Addons selected (checkboxes)
✅ Price calculates correctly
✅ Quantity controls work
✅ Total updates dynamically
```

### Test 3.3: Add to Cart
```
Steps:
1. Customize product
2. Tap "Add to Cart"
3. Check cart badge updates

Expected Result:
✅ Product added to cart
✅ Cart badge shows count
✅ Returns to business details
✅ Floating cart button visible
```

---

## 4️⃣ Cart Management Testing

### Test 4.1: View Cart
```
Steps:
1. Tap cart icon or floating cart button
2. View cart items
3. Check item details

Expected Result:
✅ All cart items displayed
✅ Variations and addons shown
✅ Special instructions visible
✅ Prices correct
```

### Test 4.2: Update Cart
```
Steps:
1. Increase quantity of item
2. Decrease quantity of item
3. Remove an item
4. Clear entire cart

Expected Result:
✅ Quantity updates correctly
✅ Prices recalculate
✅ Item removed successfully
✅ Cart cleared with confirmation
```

### Test 4.3: Apply Coupon
```
Steps:
1. Enter coupon code: SAVE10
2. Tap "Apply"
3. Check discount applied

Expected Result:
✅ Coupon validated
✅ Discount shown in bill
✅ Total updated
✅ Can remove coupon
```

### Test 4.4: Add Tip
```
Steps:
1. Select tip: $0, $2, $5, $10
2. Check bill updates

Expected Result:
✅ Tip amount selected (highlighted)
✅ Bill total includes tip
✅ Can change tip amount
```

---

## 5️⃣ Checkout Testing

### Test 5.1: Delivery Type
```
Steps:
1. Tap "Proceed to Checkout"
2. Toggle between Delivery and Pickup

Expected Result:
✅ Delivery selected by default
✅ Address shown for delivery
✅ Address hidden for pickup
```

### Test 5.2: Payment Method
```
Steps:
1. Select Cash on Delivery
2. Select Credit/Debit Card
3. Select Digital Wallet

Expected Result:
✅ Payment method selected (highlighted)
✅ Radio button shows selection
✅ Can switch between methods
```

### Test 5.3: Delivery Instructions
```
Steps:
1. Enter instructions: "Ring doorbell"
2. Check text saved

Expected Result:
✅ Text input works
✅ Instructions saved
```

### Test 5.4: Place Order
```
Steps:
1. Review order summary
2. Tap "Place Order"
3. Confirm order

Expected Result:
✅ Order confirmation dialog
✅ Order placed successfully
✅ Cart cleared
✅ Navigates to order tracking
```

---

## 6️⃣ Order Tracking Testing

### Test 6.1: View Order Tracking
```
Steps:
1. After placing order, view tracking screen
2. Check map display
3. Check order status timeline

Expected Result:
✅ Map shows markers (restaurant, rider, customer)
✅ ETA displayed
✅ Status timeline shows current status
✅ Order details visible
```

### Test 6.2: Order Status Updates
```
Steps:
1. Wait for status updates (or simulate)
2. Check timeline updates
3. Check status colors

Expected Result:
✅ Status progresses: Pending → Accepted → Assigned → Picked → Delivered
✅ Timeline icons update
✅ Timestamps shown
✅ Colors change appropriately
```

### Test 6.3: Contact Options
```
Steps:
1. Tap call rider button
2. Tap message rider button
3. Tap call restaurant button

Expected Result:
✅ Phone dialer opens with number
✅ SMS app opens with number
✅ Contact options work
```

---

## 7️⃣ Order History Testing

### Test 7.1: View Order History
```
Steps:
1. Navigate to Orders tab
2. View order list
3. Check order cards

Expected Result:
✅ All orders displayed
✅ Most recent first
✅ Order details shown (restaurant, date, amount, status)
```

### Test 7.2: Filter Orders
```
Steps:
1. Tap filter: All
2. Tap filter: Pending
3. Tap filter: Delivered
4. Tap filter: Cancelled

Expected Result:
✅ Orders filtered by status
✅ Filter chips highlight
✅ Empty state shown if no orders
```

### Test 7.3: Order Actions
```
Steps:
1. Tap "Rate" on delivered order
2. Tap "Reorder" on any order
3. Tap "Receipt" on any order

Expected Result:
✅ Rate screen opens (or alert)
✅ Reorder adds items to cart
✅ Receipt displayed (or alert)
```

### Test 7.4: Pull to Refresh
```
Steps:
1. Pull down on order list
2. Wait for refresh

Expected Result:
✅ Loading indicator shows
✅ Orders refresh
✅ New orders appear
```

---

## 8️⃣ Navigation Testing

### Test 8.1: Tab Navigation
```
Steps:
1. Tap Home tab
2. Tap Search tab
3. Tap Cart tab
4. Tap Orders tab
5. Tap Profile tab

Expected Result:
✅ All tabs navigate correctly
✅ Tab icons highlight
✅ Screens load properly
```

### Test 8.2: Back Navigation
```
Steps:
1. Navigate deep: Categories → Businesses → Business → Product
2. Tap back button multiple times
3. Check navigation stack

Expected Result:
✅ Back button works at each level
✅ Returns to previous screen
✅ Data persists
```

### Test 8.3: Cart Badge
```
Steps:
1. Add items to cart
2. Check cart badge on tab
3. Remove items
4. Check badge updates

Expected Result:
✅ Badge shows item count
✅ Badge updates in real-time
✅ Badge hidden when cart empty
```

---

## 9️⃣ Error Handling Testing

### Test 9.1: Network Errors
```
Steps:
1. Turn off backend
2. Try to browse categories
3. Try to place order

Expected Result:
✅ Error message displayed
✅ User can retry
✅ App doesn't crash
```

### Test 9.2: Invalid Data
```
Steps:
1. Try to checkout with empty cart
2. Try to apply invalid coupon
3. Try to place order without payment method

Expected Result:
✅ Validation errors shown
✅ User guided to fix issues
✅ Clear error messages
```

### Test 9.3: Empty States
```
Steps:
1. View cart when empty
2. View orders when no orders
3. Search with no results

Expected Result:
✅ Empty state UI shown
✅ Helpful message displayed
✅ Call-to-action button present
```

---

## 🔟 Performance Testing

### Test 10.1: Load Times
```
Measure:
- App startup time
- Screen transition time
- API response time
- Image loading time

Expected:
✅ App starts < 2 seconds
✅ Screens load < 500ms
✅ API calls < 1 second
✅ Images load progressively
```

### Test 10.2: Smooth Scrolling
```
Steps:
1. Scroll through long lists
2. Scroll through menu items
3. Scroll through order history

Expected Result:
✅ 60 FPS scrolling
✅ No lag or stutter
✅ Images load smoothly
```

### Test 10.3: Memory Usage
```
Steps:
1. Navigate through all screens
2. Add/remove items multiple times
3. Check for memory leaks

Expected Result:
✅ Memory usage stable
✅ No crashes
✅ App responsive
```

---

## 1️⃣1️⃣ Edge Cases Testing

### Test 11.1: Long Text
```
Steps:
1. Enter very long special instructions
2. Add product with long name
3. View business with long description

Expected Result:
✅ Text truncates properly
✅ UI doesn't break
✅ Scrollable where needed
```

### Test 11.2: Multiple Items
```
Steps:
1. Add 20+ items to cart
2. Place large order
3. View order with many items

Expected Result:
✅ Cart handles many items
✅ Scrolling works
✅ Performance maintained
```

### Test 11.3: Rapid Actions
```
Steps:
1. Rapidly tap add to cart
2. Quickly change quantities
3. Fast navigation between screens

Expected Result:
✅ No duplicate items
✅ Quantities correct
✅ Navigation stable
```

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Device: ___________
OS Version: ___________

Authentication: ✅ / ❌
Browse & Search: ✅ / ❌
Product Selection: ✅ / ❌
Cart Management: ✅ / ❌
Checkout: ✅ / ❌
Order Tracking: ✅ / ❌
Order History: ✅ / ❌
Navigation: ✅ / ❌
Error Handling: ✅ / ❌
Performance: ✅ / ❌
Edge Cases: ✅ / ❌

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: ✅ PASS / ❌ FAIL
```

---

## 🐛 Common Issues & Solutions

### Issue: Can't login
**Solution:** Check backend is running, verify credentials

### Issue: No categories showing
**Solution:** Run seed script: `node seed-sample-data.js`

### Issue: Can't add to cart
**Solution:** Check product has variations, check Redux store

### Issue: Order not placing
**Solution:** Check backend logs, verify GraphQL mutation

### Issue: Map not showing
**Solution:** Check react-native-maps installed, check permissions

---

## ✅ Final Checklist

Before marking as complete:
- [ ] All authentication flows work
- [ ] Can browse all 15 categories
- [ ] Can add products to cart
- [ ] Can customize products
- [ ] Can apply coupons
- [ ] Can place orders
- [ ] Can track orders
- [ ] Can view order history
- [ ] All navigation works
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Error handling works

---

**Testing Status:** Ready for QA
**Last Updated:** December 2024
