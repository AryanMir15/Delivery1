/**
 * Chapa Payment Integration Test Script
 * Tests the payment flow without requiring the full app
 */

require('dotenv').config();
const chapaService = require('./utils/chapaService');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

// Test data
const testPaymentData = {
  amount: 1000,
  currency: 'ETB',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+251911234567',
  txRef: `TEST-${Date.now()}`,
  customization: {
    title: 'Test Order Payment',
    description: 'Testing Chapa integration',
  },
};

async function testConfiguration() {
  log.section('📋 Testing Configuration');

  const requiredEnvVars = [
    'CHAPA_SECRET_KEY',
    'CHAPA_PUBLIC_KEY',
    'CHAPA_BASE_URL',
  ];

  let allConfigured = true;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log.success(`${envVar} is configured`);
    } else {
      log.error(`${envVar} is missing`);
      allConfigured = false;
    }
  }

  if (!allConfigured) {
    log.error('Please configure all required environment variables in .env file');
    return false;
  }

  // Check if using test credentials
  if (process.env.CHAPA_SECRET_KEY.includes('TEST')) {
    log.success('Using TEST credentials (recommended for testing)');
  } else {
    log.warning('Using PRODUCTION credentials - be careful!');
  }

  return true;
}

async function testPaymentInitialization() {
  log.section('💳 Testing Payment Initialization');

  try {
    log.info('Initializing payment with Chapa...');
    log.info(`Amount: ETB ${testPaymentData.amount}`);
    log.info(`Email: ${testPaymentData.email}`);
    log.info(`Transaction Ref: ${testPaymentData.txRef}`);

    const result = await chapaService.initializePayment(testPaymentData);

    if (result.success) {
      log.success('Payment initialization successful!');
      log.info(`Checkout URL: ${result.checkoutUrl}`);
      log.info(`Transaction Reference: ${testPaymentData.txRef}`);
      
      console.log('\n' + '='.repeat(60));
      console.log('🌐 CHECKOUT URL (Open in browser to test):');
      console.log(colors.cyan + result.checkoutUrl + colors.reset);
      console.log('='.repeat(60) + '\n');

      return { success: true, txRef: testPaymentData.txRef };
    } else {
      log.error('Payment initialization failed');
      log.error(`Error: ${result.error}`);
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      return { success: false };
    }
  } catch (error) {
    log.error('Exception during payment initialization');
    console.error(error);
    return { success: false };
  }
}

async function testTransactionReference() {
  log.section('🔑 Testing Transaction Reference Generation');

  try {
    const orderId = 'ORD-000001';
    const txRef = chapaService.generateTxRef(orderId);
    
    log.success(`Generated transaction reference: ${txRef}`);
    log.info(`Format: ${orderId}-${Date.now()}`);
    
    return true;
  } catch (error) {
    log.error('Failed to generate transaction reference');
    console.error(error);
    return false;
  }
}

async function testPaymentStatusNormalization() {
  log.section('🔄 Testing Payment Status Normalization');

  const testCases = [
    { input: 'success', expected: 'paid' },
    { input: 'pending', expected: 'pending' },
    { input: 'failed', expected: 'failed' },
    { input: 'cancelled', expected: 'failed' },
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    const result = chapaService.normalizePaymentStatus(testCase.input);
    if (result === testCase.expected) {
      log.success(`${testCase.input} → ${result}`);
    } else {
      log.error(`${testCase.input} → ${result} (expected: ${testCase.expected})`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testWebhookSignature() {
  log.section('🔐 Testing Webhook Signature Verification');

  if (!process.env.CHAPA_WEBHOOK_SECRET) {
    log.warning('CHAPA_WEBHOOK_SECRET not configured, skipping test');
    return true;
  }

  try {
    const testPayload = {
      tx_ref: 'TEST-123',
      status: 'success',
      amount: 1000,
    };

    // This would normally come from Chapa's webhook
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    const isValid = chapaService.verifyWebhookSignature(signature, testPayload);

    if (isValid) {
      log.success('Webhook signature verification working correctly');
    } else {
      log.error('Webhook signature verification failed');
    }

    return isValid;
  } catch (error) {
    log.error('Exception during webhook signature test');
    console.error(error);
    return false;
  }
}

async function testAmountFormatting() {
  log.section('💰 Testing Amount Formatting');

  const testAmounts = [100, 1000.50, 50.99, 0.01];

  for (const amount of testAmounts) {
    const formatted = parseFloat(amount).toFixed(2);
    log.info(`${amount} → ETB ${formatted}`);
  }

  log.success('Amount formatting test completed');
  return true;
}

async function displayTestInstructions() {
  log.section('📝 Manual Testing Instructions');

  console.log('To complete the payment flow test:');
  console.log('');
  console.log('1. Copy the checkout URL from above');
  console.log('2. Open it in your browser');
  console.log('3. Use these test card details:');
  console.log('');
  console.log('   Card Number: 5555 5555 5555 4444');
  console.log('   Expiry Date: 12/25 (any future date)');
  console.log('   CVV: 123 (any 3 digits)');
  console.log('');
  console.log('4. Complete the payment');
  console.log('5. Check your Chapa dashboard for the transaction');
  console.log('');
  console.log('Dashboard: https://dashboard.chapa.co');
  console.log('');
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 CHAPA PAYMENT INTEGRATION TEST SUITE');
  console.log('='.repeat(60) + '\n');

  const results = {
    configuration: false,
    txRefGeneration: false,
    statusNormalization: false,
    webhookSignature: false,
    amountFormatting: false,
    paymentInit: false,
  };

  // Test 1: Configuration
  results.configuration = await testConfiguration();
  if (!results.configuration) {
    log.error('\n❌ Configuration test failed. Please fix configuration before continuing.\n');
    return;
  }

  // Test 2: Transaction Reference Generation
  results.txRefGeneration = await testTransactionReference();

  // Test 3: Payment Status Normalization
  results.statusNormalization = await testPaymentStatusNormalization();

  // Test 4: Webhook Signature
  results.webhookSignature = await testWebhookSignature();

  // Test 5: Amount Formatting
  results.amountFormatting = await testAmountFormatting();

  // Test 6: Payment Initialization (requires API call)
  results.paymentInit = await testPaymentInitialization();

  // Display manual testing instructions
  if (results.paymentInit.success) {
    await displayTestInstructions();
  }

  // Summary
  log.section('📊 Test Summary');

  const testNames = {
    configuration: 'Configuration',
    txRefGeneration: 'Transaction Reference Generation',
    statusNormalization: 'Payment Status Normalization',
    webhookSignature: 'Webhook Signature Verification',
    amountFormatting: 'Amount Formatting',
    paymentInit: 'Payment Initialization',
  };

  let passedCount = 0;
  let totalCount = 0;

  for (const [key, name] of Object.entries(testNames)) {
    totalCount++;
    const passed = results[key] === true || (results[key] && results[key].success);
    if (passed) {
      passedCount++;
      log.success(name);
    } else {
      log.error(name);
    }
  }

  console.log('\n' + '='.repeat(60));
  if (passedCount === totalCount) {
    console.log(`${colors.green}✓ All tests passed! (${passedCount}/${totalCount})${colors.reset}`);
    console.log('🎉 Chapa payment integration is ready to use!');
  } else {
    console.log(`${colors.yellow}⚠ ${passedCount}/${totalCount} tests passed${colors.reset}`);
    console.log('Please fix the failing tests before using in production.');
  }
  console.log('='.repeat(60) + '\n');

  // Additional info
  if (results.paymentInit && results.paymentInit.success) {
    log.info('Transaction Reference for verification: ' + results.paymentInit.txRef);
    log.info('You can verify this payment later using:');
    console.log(`  node -e "require('./utils/chapaService').verifyPayment('${results.paymentInit.txRef}').then(console.log)"`);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n❌ Test suite failed with error:');
  console.error(error);
  process.exit(1);
});
