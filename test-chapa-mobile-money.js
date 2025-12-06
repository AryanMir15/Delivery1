/**
 * Chapa Mobile Money Payment Test Script
 * Tests mobile money payments using Chapa's test phone numbers
 */

require('dotenv').config();
const chapaService = require('./utils/chapaService');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  highlight: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`),
};

// Chapa test mobile numbers for different providers
const testMobileNumbers = {
  telebirr: [
    { phone: '0900123456', otp: 'Auto-generated', provider: 'Telebirr' },
    { phone: '0900112233', otp: 'Auto-generated', provider: 'Telebirr' },
    { phone: '0900881111', otp: 'Auto-generated', provider: 'Telebirr' },
  ],
  cbeBirr: [
    { phone: '0900123456', otp: 'Auto-generated', provider: 'CBE Birr' },
    { phone: '0900112233', otp: 'Auto-generated', provider: 'CBE Birr' },
    { phone: '0900881111', otp: 'Auto-generated', provider: 'CBE Birr' },
  ],
  awashBank: [
    { phone: '0900123456', otp: '12345', provider: 'Awash Bank' },
    { phone: '0900112233', otp: '12345', provider: 'Awash Bank' },
    { phone: '0900881111', otp: '12345', provider: 'Awash Bank' },
  ],
  amole: [
    { phone: '0900123456', otp: '12345', provider: 'Amole' },
    { phone: '0900112233', otp: '12345', provider: 'Amole' },
    { phone: '0900881111', otp: '12345', provider: 'Amole' },
  ],
  coopPay: [
    { phone: '0900123456', otp: 'Auto-generated', provider: 'COOP Pay (eBirr)' },
    { phone: '0900112233', otp: 'Auto-generated', provider: 'COOP Pay (eBirr)' },
    { phone: '0900881111', otp: 'Auto-generated', provider: 'COOP Pay (eBirr)' },
  ],
  mpesa: [
    { phone: '0700123456', otp: 'Auto-generated', provider: 'M-Pesa' },
    { phone: '0700112233', otp: 'Auto-generated', provider: 'M-Pesa' },
    { phone: '0700881111', otp: 'Auto-generated', provider: 'M-Pesa' },
  ],
};

async function displayTestNumbers() {
  log.section('📱 Chapa Test Mobile Numbers');

  console.log('These numbers will return SUCCESS status:\n');

  for (const [provider, numbers] of Object.entries(testMobileNumbers)) {
    log.highlight(`${numbers[0].provider}:`);
    numbers.forEach((num, idx) => {
      console.log(`  ${idx + 1}. Phone: ${num.phone} | OTP: ${num.otp}`);
    });
    console.log('');
  }

  log.warning('⚠️  Any other numbers will return FAILED status');
  console.log('');
}

async function testMobileMoneyPayment(phoneNumber, provider, amount = 500) {
  log.section(`Testing ${provider} Payment`);

  try {
    const txRef = `TEST-${provider.toUpperCase()}-${Date.now()}`;
    
    log.info(`Phone: ${phoneNumber}`);
    log.info(`Amount: ETB ${amount}`);
    log.info(`Transaction Ref: ${txRef}`);

    const paymentData = {
      amount: amount,
      currency: 'ETB',
      email: 'test@customer.app', // Valid email format required
      firstName: 'Test',
      lastName: 'User',
      phone: phoneNumber,
      txRef: txRef,
      customization: {
        title: `${provider} Test`, // Max 16 chars
        description: `Testing ${provider} mobile money payment`,
      },
    };

    log.info('Initializing payment...');
    const result = await chapaService.initializePayment(paymentData);

    if (result.success) {
      log.success('Payment initialization successful!');
      console.log('\n' + '─'.repeat(60));
      console.log('🌐 CHECKOUT URL:');
      console.log(colors.cyan + result.checkoutUrl + colors.reset);
      console.log('─'.repeat(60) + '\n');

      log.info('Next steps:');
      console.log(`  1. Open the URL above in your browser`);
      console.log(`  2. Select ${provider} as payment method`);
      console.log(`  3. Enter phone: ${phoneNumber}`);
      
      const testNum = Object.values(testMobileNumbers)
        .flat()
        .find(n => n.phone === phoneNumber);
      
      if (testNum && testNum.otp !== 'Auto-generated') {
        console.log(`  4. Enter OTP: ${testNum.otp}`);
      } else {
        console.log(`  4. OTP will be auto-generated`);
      }
      console.log(`  5. Complete the payment\n`);

      return { success: true, txRef, checkoutUrl: result.checkoutUrl };
    } else {
      log.error('Payment initialization failed');
      log.error(`Error: ${result.error}`);
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      return { success: false };
    }
  } catch (error) {
    log.error('Exception during payment test');
    console.error(error);
    return { success: false };
  }
}

async function testAllProviders() {
  log.section('🧪 Testing All Mobile Money Providers');

  const results = [];

  // Test one number from each provider
  const providersToTest = [
    { name: 'Telebirr', phone: '0900123456' },
    { name: 'CBE Birr', phone: '0900112233' },
    { name: 'Awash Bank', phone: '0900881111' },
    { name: 'Amole', phone: '0900123456' },
  ];

  for (const provider of providersToTest) {
    const result = await testMobileMoneyPayment(provider.phone, provider.name, 100);
    results.push({ provider: provider.name, ...result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

async function testSingleProvider(providerName, phoneNumber) {
  const provider = testMobileNumbers[providerName];
  
  if (!provider) {
    log.error(`Unknown provider: ${providerName}`);
    log.info('Available providers: ' + Object.keys(testMobileNumbers).join(', '));
    return;
  }

  const testNumber = provider.find(n => n.phone === phoneNumber) || provider[0];
  
  await testMobileMoneyPayment(testNumber.phone, testNumber.provider, 500);
}

async function verifyTestPayment(txRef) {
  log.section('🔍 Verifying Payment');

  try {
    log.info(`Verifying transaction: ${txRef}`);
    
    const result = await chapaService.verifyPayment(txRef);

    if (result.success) {
      log.success('Payment verification successful!');
      console.log('\nPayment Details:');
      console.log(`  Status: ${result.status}`);
      console.log(`  Amount: ${result.currency} ${result.amount}`);
      console.log(`  Transaction Ref: ${result.txRef}`);
      console.log(`  Response: ${result.chargeResponseMessage}`);
      
      if (result.status === 'success') {
        log.success('✓ Payment completed successfully!');
      } else if (result.status === 'pending') {
        log.warning('⏳ Payment is still pending');
      } else {
        log.error('✗ Payment failed');
      }
    } else {
      log.error('Payment verification failed');
      log.error(`Error: ${result.error}`);
    }
  } catch (error) {
    log.error('Exception during verification');
    console.error(error);
  }
}

async function interactiveMenu() {
  log.section('🎯 Chapa Mobile Money Test Menu');

  console.log('Choose a test option:\n');
  console.log('1. Display all test numbers');
  console.log('2. Test Telebirr payment');
  console.log('3. Test CBE Birr payment');
  console.log('4. Test Awash Bank payment');
  console.log('5. Test Amole payment');
  console.log('6. Test all providers (quick test)');
  console.log('7. Verify a payment (enter tx_ref)');
  console.log('8. Run full test suite\n');

  // Get command line argument
  const args = process.argv.slice(2);
  const option = args[0];

  if (!option) {
    log.info('Usage: node test-chapa-mobile-money.js [option]');
    log.info('Example: node test-chapa-mobile-money.js 2');
    console.log('');
    await displayTestNumbers();
    return;
  }

  switch (option) {
    case '1':
      await displayTestNumbers();
      break;
    case '2':
      await testSingleProvider('telebirr', '0900123456');
      break;
    case '3':
      await testSingleProvider('cbeBirr', '0900112233');
      break;
    case '4':
      await testSingleProvider('awashBank', '0900881111');
      break;
    case '5':
      await testSingleProvider('amole', '0900123456');
      break;
    case '6':
      await testAllProviders();
      break;
    case '7':
      const txRef = args[1];
      if (txRef) {
        await verifyTestPayment(txRef);
      } else {
        log.error('Please provide transaction reference');
        log.info('Usage: node test-chapa-mobile-money.js 7 <tx_ref>');
      }
      break;
    case '8':
      await runFullTestSuite();
      break;
    default:
      log.error('Invalid option');
      log.info('Please choose a number between 1-8');
  }
}

async function runFullTestSuite() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 CHAPA MOBILE MONEY FULL TEST SUITE');
  console.log('═'.repeat(60) + '\n');

  // Display test numbers
  await displayTestNumbers();

  // Test configuration
  log.section('📋 Configuration Check');
  
  if (!process.env.CHAPA_SECRET_KEY || !process.env.CHAPA_PUBLIC_KEY) {
    log.error('Chapa credentials not configured in .env file');
    return;
  }
  
  log.success('Chapa credentials configured');
  
  if (process.env.CHAPA_SECRET_KEY.includes('TEST')) {
    log.success('Using TEST mode (recommended)');
  } else {
    log.warning('Using PRODUCTION mode - be careful!');
  }

  // Test payment initialization with Telebirr
  log.section('💳 Testing Payment Initialization');
  
  const testResult = await testMobileMoneyPayment('0900123456', 'Telebirr', 250);

  if (testResult.success) {
    log.section('✅ Test Summary');
    log.success('Payment initialization working correctly');
    log.info('Checkout URL generated successfully');
    log.info(`Transaction Reference: ${testResult.txRef}`);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📝 NEXT STEPS:');
    console.log('═'.repeat(60));
    console.log('');
    console.log('1. Open the checkout URL in your browser');
    console.log('2. Select Telebirr as payment method');
    console.log('3. Enter phone: 0900123456');
    console.log('4. Complete the payment');
    console.log('5. Verify payment using:');
    console.log(`   node test-chapa-mobile-money.js 7 ${testResult.txRef}`);
    console.log('');
    console.log('═'.repeat(60) + '\n');
  } else {
    log.section('❌ Test Failed');
    log.error('Payment initialization failed');
    log.info('Please check your Chapa credentials and try again');
  }
}

// Run the interactive menu
interactiveMenu().catch((error) => {
  console.error('\n❌ Test failed with error:');
  console.error(error);
  process.exit(1);
});
