# Chapa Test Phone Numbers

## For Mobile Money Testing

Use these specific test phone numbers when testing mobile money payments (Telebirr, CBE Birr, etc.):

### ✅ Success Test Numbers

#### Telebirr
- `0900123456`
- `0900112233`
- `0900881111`

#### CBE Birr
- `0900123456`
- `0900112233`
- `0900881111`

#### Amole
- `0900123456` (OTP: 12345)
- `0900112233` (OTP: 12345)
- `0900881111` (OTP: 12345)

#### Awash Bank
- `0900123456` (OTP: 12345)
- `0900112233` (OTP: 12345)
- `0900881111` (OTP: 12345)

#### COOP Pay-eBirr
- `0900123456`
- `0900112233`
- `0900881111`

#### M-Pesa
- `0700123456`
- `0700112233`
- `0700881111`

### ❌ Failed Test Numbers
**Any phone number NOT in the list above will return FAILED status**

---

## For Card Testing

### ✅ Success Card
```
Card Number: 5200000000000007
Expiry: 12/25 (any future date)
CVV: 123 (any 3 digits)
Name: Test User
```

### ❌ Failed Card
```
Card Number: 4000000000000002
Expiry: 12/25
CVV: 123
Name: Test User
```

---

## Important Notes

1. **User Registration**: When testing, register with one of the test phone numbers above
2. **Order Placement**: The phone number in your user profile will be used for payment
3. **Mobile Money**: Only works with the specific test numbers listed
4. **Card Payments**: Work with any phone number, use test cards above

---

## Current Issue

Your user is registered with phone: `0918490881`

This is **NOT** a test number, so mobile money payments will fail.

### Solution Options:

**Option 1: Register New Test User**
- Register with phone: `0900123456`
- Use this account for testing

**Option 2: Update User Phone**
- Go to Profile → Edit
- Change phone to: `0900123456`
- Try payment again

**Option 3: Use Card Payment**
- Your current phone works for card payments
- Select "Chapa Payment" (not Telebirr/CBE Birr)
- Use test card: `5200000000000007`

---

## Testing Steps

### For Mobile Money (Telebirr/CBE Birr)
1. Register user with phone: `0900123456`
2. Add items to cart
3. Go to checkout
4. Select "Telebirr" or "CBE Birr"
5. Complete payment
6. Enter OTP: `12345` (if prompted)

### For Card Payment
1. Use any phone number
2. Add items to cart
3. Go to checkout
4. Select "Chapa Payment"
5. Enter card: `5200000000000007`
6. Complete payment

---

## Quick Test

**Recommended**: Use card payment with your current account
- Phone: `0918490881` (your current number - OK for cards)
- Payment Method: "Chapa Payment"
- Card: `5200000000000007`
- Expiry: `12/25`
- CVV: `123`

This should work immediately!
