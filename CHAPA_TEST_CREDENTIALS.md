# 🧪 Chapa Payment Test Credentials

## Test Cards

### Mastercard (Success)
```
Card Number: 5555 5555 5555 4444
Expiry Date: 12/25 (any future date)
CVV: 123 (any 3 digits)
```

### Visa (Success)
```
Card Number: 4111 1111 1111 1111
Expiry Date: 12/25
CVV: 123
```

## Mobile Money Test Numbers

All test numbers use **OTP: 12345** (except where specified)

### ✅ Awash Bank
- **Phone:** 0900123456 | **OTP:** 12345
- **Phone:** 0900112233 | **OTP:** 12345
- **Phone:** 0900881111 | **OTP:** 12345

### ✅ Amole
- **Phone:** 0900123456 | **OTP:** 12345
- **Phone:** 0900112233 | **OTP:** 12345
- **Phone:** 0900881111 | **OTP:** 12345

### ✅ Telebirr
- **Phone:** 0900123456
- **Phone:** 0900112233
- **Phone:** 0900881111

### ✅ CBE Birr
- **Phone:** 0900123456
- **Phone:** 0900112233
- **Phone:** 0900881111

### ✅ COOPPay (e-birr)
- **Phone:** 0900123456
- **Phone:** 0900112233
- **Phone:** 0900881111

### ✅ M-Pesa
- **Phone:** 0700123456
- **Phone:** 0700112233
- **Phone:** 0700881111

## ⚠️ Important Notes

1. **Success Numbers:** Only the numbers listed above will return SUCCESS status
2. **Failed Numbers:** Any other phone numbers will return FAILED status
3. **OTP:** Use `12345` for all test transactions requiring OTP
4. **Test Mode:** These credentials only work in Chapa TEST mode
5. **No Real Money:** No actual money is charged in test mode

## 🧪 Test Scenarios

### Scenario 1: Successful Card Payment
```
1. Add items to cart (Total: ETB 500)
2. Go to checkout
3. Select "Chapa Payment"
4. Place order
5. Use card: 5555 5555 5555 4444
6. Expiry: 12/25, CVV: 123
7. ✅ Payment should succeed
8. Order status: PAID
```

### Scenario 2: Successful Telebirr Payment
```
1. Add items to cart (Total: ETB 300)
2. Go to checkout
3. Select "Chapa Payment"
4. Place order
5. Choose Telebirr
6. Enter phone: 0900123456
7. ✅ Payment should succeed
8. Order status: PAID
```

### Scenario 3: Successful CBE Birr Payment
```
1. Add items to cart (Total: ETB 750)
2. Go to checkout
3. Select "Chapa Payment"
4. Place order
5. Choose CBE Birr
6. Enter phone: 0900112233
7. ✅ Payment should succeed
8. Order status: PAID
```

### Scenario 4: Failed Payment (Invalid Number)
```
1. Add items to cart (Total: ETB 200)
2. Go to checkout
3. Select "Chapa Payment"
4. Place order
5. Choose Telebirr
6. Enter phone: 0911111111 (not in test list)
7. ❌ Payment should fail
8. Order status: PENDING
```

### Scenario 5: Cancelled Payment
```
1. Add items to cart (Total: ETB 400)
2. Go to checkout
3. Select "Chapa Payment"
4. Place order
5. Payment page opens
6. Close browser without paying
7. ⚠️ Payment cancelled
8. Order status: PENDING
9. User can retry from orders screen
```

### Scenario 6: Cash on Delivery
```
1. Add items to cart (Total: ETB 600)
2. Go to checkout
3. Select "Cash on Delivery"
4. Place order
5. ✅ Order placed immediately
6. Order status: PENDING
7. Payment status: PENDING
8. Payment collected on delivery
```

## 🔍 Verification Steps

### Check Backend Logs
```bash
# Successful payment log:
✅ Payment webhook processed for order ORD-000001: success

# Failed payment log:
❌ Payment failed for order ORD-000002: failed
```

### Check Database
```javascript
// MongoDB query
db.orders.findOne({ orderId: "ORD-000001" })

// Expected result for successful payment:
{
  orderId: "ORD-000001",
  paymentStatus: "paid",
  paymentMethod: "chapa",
  paymentTransactionId: "CHW-xxxxx",
  paymentReference: "ORD-000001-1234567890",
  orderAmount: 500,
  paidAmount: 500
}
```

### Check GraphQL
```graphql
query CheckOrder {
  order(id: "ORDER_ID_HERE") {
    orderId
    orderStatus
    paymentStatus
    paymentMethod
    paymentTransactionId
    paymentReference
    orderAmount
    paidAmount
    paymentMetadata
  }
}
```

### Check Chapa Dashboard
1. Login to [Chapa Dashboard](https://dashboard.chapa.co)
2. Go to **Transactions**
3. Filter by **Test Mode**
4. Verify transaction appears with correct amount
5. Check transaction status

## 📊 Test Results Template

| Test # | Scenario | Payment Method | Phone/Card | Amount | Expected | Actual | Status |
|--------|----------|----------------|------------|--------|----------|--------|--------|
| 1 | Card Payment | Card | 5555...4444 | 500 | Success | Success | ✅ |
| 2 | Telebirr | Mobile Money | 0900123456 | 300 | Success | Success | ✅ |
| 3 | CBE Birr | Mobile Money | 0900112233 | 750 | Success | Success | ✅ |
| 4 | Invalid Number | Mobile Money | 0911111111 | 200 | Failed | Failed | ✅ |
| 5 | Cancelled | Card | 5555...4444 | 400 | Cancelled | Cancelled | ✅ |
| 6 | Cash | COD | N/A | 600 | Pending | Pending | ✅ |

## 🎯 Complete Test Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] GraphQL playground accessible
- [ ] Payment mutations available
- [ ] Chapa service initialized
- [ ] Environment variables loaded
- [ ] Database connection working

### Payment Initialization Tests
- [ ] Order created successfully
- [ ] Payment initialized with Chapa
- [ ] Checkout URL generated
- [ ] Transaction reference created
- [ ] Order payment reference saved

### Payment Completion Tests
- [ ] Card payment succeeds (5555...4444)
- [ ] Telebirr payment succeeds (0900123456)
- [ ] CBE Birr payment succeeds (0900112233)
- [ ] Amole payment succeeds (0900881111)
- [ ] M-Pesa payment succeeds (0700123456)
- [ ] Invalid number fails (0911111111)

### Payment Verification Tests
- [ ] Webhook received and processed
- [ ] Payment status updated in database
- [ ] Order status updated correctly
- [ ] Transaction ID saved
- [ ] Payment metadata stored

### Mobile App Tests
- [ ] Payment page opens in browser
- [ ] Browser closes after payment
- [ ] Success notification shown
- [ ] Failed payment handled
- [ ] Cancelled payment handled
- [ ] Order tracking accessible

### Edge Cases
- [ ] Network timeout during payment
- [ ] Duplicate payment prevention
- [ ] Concurrent payment attempts
- [ ] Invalid order ID
- [ ] Expired checkout URL
- [ ] Webhook signature verification

## 🚨 Common Test Issues

### Issue: Payment initialization fails
**Solution:**
- Check Chapa credentials in `.env`
- Verify API key is for TEST mode
- Check backend logs for errors
- Ensure order exists in database

### Issue: Webhook not received
**Solution:**
- Use ngrok for local testing
- Update callback URL in `.env`
- Check webhook signature
- Verify Chapa dashboard webhook settings

### Issue: Payment succeeds but order not updated
**Solution:**
- Check webhook endpoint is accessible
- Verify transaction reference matches
- Check database connection
- Review backend logs

### Issue: Mobile app can't open payment page
**Solution:**
- Install `expo-web-browser`
- Check checkout URL is valid
- Verify network connectivity
- Test on different device/emulator

## 📝 Test Report Template

```markdown
# Chapa Payment Integration Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** Test Mode
**Backend Version:** 1.0.0
**Mobile App Version:** 1.0.0

## Summary
- Total Tests: 20
- Passed: 18
- Failed: 2
- Skipped: 0

## Test Results

### Payment Methods Tested
- ✅ Card Payment (Mastercard)
- ✅ Card Payment (Visa)
- ✅ Telebirr (3 numbers)
- ✅ CBE Birr (3 numbers)
- ✅ Amole (3 numbers)
- ✅ M-Pesa (3 numbers)
- ✅ Cash on Delivery

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Status: Open/Fixed
   - Notes: [Details]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Sign-off
- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Ready for production
```

## 🎓 Testing Best Practices

1. **Test in sequence:** Start with simple scenarios, then complex ones
2. **Document everything:** Record all test results
3. **Test edge cases:** Don't just test happy paths
4. **Verify webhooks:** Ensure callbacks are received
5. **Check logs:** Always review backend logs
6. **Test on multiple devices:** Android, iOS, different versions
7. **Simulate failures:** Test error handling
8. **Performance test:** Try multiple concurrent payments
9. **Security test:** Verify signature validation
10. **User experience:** Test from end-user perspective

## 🔐 Security Testing

- [ ] API keys not exposed in client
- [ ] Webhook signature verified
- [ ] Payment amounts validated on backend
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] Sensitive data encrypted
- [ ] Logs don't contain secrets
- [ ] HTTPS enforced in production

---

**Ready to test?** Start with Scenario 1 and work through all test cases!
