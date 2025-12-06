/**
 * Real App Payment Flow Integration Test
 * Tests the complete flow: Order → Payment → Verification
 */

require('dotenv').config();
const axios = require('axios');

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

const API_URL = process.env.API_URL || 'http://localhost:4000/graphql';

// Test user credentials
const TEST_USER = {
  email: 'testcustomer@example.com',
  password: 'Test123456',
  name: 'Test Customer',
  phone: '0900123456', // Chapa test number
};

// Test order data
const TEST_ORDER = {
  restaurantId: null, // Will be fetched
  items: [],
  deliveryAddress: {
    deliveryAddress: 'Bole, Addis Ababa',
    location: [38.7578, 9.0320], // Addis Ababa coordinates
    details: 'Near Edna Mall',
    label: 'Home',
  },
  deliveryCharges: 50,
  taxRate: 0.15,
  tipping: 0,
};

let authToken = null;
let testUserId = null;
let testOrderId = null;
let paymentTxRef = null;

async function graphqlRequest(query, variables = {}, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.post(
      API_URL,
      { query, variables },
      { headers }
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors[0].message);
    }
    throw error;
  }
}

async function testServerConnection() {
  log.section('🔌 Testing Server Connection');

  try {
    const query = `
      query {
        categories {
          id
          title
        }
      }
    `;

    const data = await graphqlRequest(query);
    
    if (data.categories) {
      log.success(`Server is running at ${API_URL}`);
      log.info(`Found ${data.categories.length} categories`);
      return true;
    }
  } catch (error) {
    log.error('Cannot connect to server');
    log.error(error.message);
    log.info('Make sure backend is running: npm run dev');
    return false;
  }
}

async function registerOrLoginUser() {
  log.section('👤 User Authentication');

  try {
    // Try to login first
    const loginQuery = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          userId
          token
          name
          email
          phone
        }
      }
    `;

    try {
      const data = await graphqlRequest(loginQuery, {
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      authToken = data.login.token;
      testUserId = data.login.userId;
      
      log.success('User logged in successfully');
      log.info(`User: ${data.login.name} (${data.login.email})`);
      log.info(`Phone: ${data.login.phone}`);
      
      return true;
    } catch (loginError) {
      // User doesn't exist, try to register
      log.info('User not found, registering new user...');

      const registerQuery = `
        mutation Register(
          $name: String!
          $email: String!
          $phone: String
          $password: String!
          $role: String
        ) {
          register(
            name: $name
            email: $email
            phone: $phone
            password: $password
            role: $role
          ) {
            userId
            token
            name
            email
            phone
          }
        }
      `;

      const data = await graphqlRequest(registerQuery, {
        name: TEST_USER.name,
        email: TEST_USER.email,
        phone: TEST_USER.phone,
        password: TEST_USER.password,
        role: 'customer',
      });

      authToken = data.register.token;
      testUserId = data.register.userId;

      log.success('User registered successfully');
      log.info(`User: ${data.register.name} (${data.register.email})`);
      
      return true;
    }
  } catch (error) {
    log.error('Authentication failed');
    log.error(error.message);
    return false;
  }
}

async function fetchRestaurantAndProducts() {
  log.section('🏪 Fetching Restaurant & Products');

  try {
    const query = `
      query {
        restaurants {
          id
          _id
          name
          isActive
          isAvailable
        }
      }
    `;

    const data = await graphqlRequest(query);

    if (!data.restaurants || data.restaurants.length === 0) {
      log.error('No restaurants found in database');
      log.info('Please add a restaurant first');
      return false;
    }

    const restaurant = data.restaurants.find(r => r.isActive && r.isAvailable) || data.restaurants[0];
    TEST_ORDER.restaurantId = restaurant.id;

    log.success(`Found restaurant: ${restaurant.name}`);

    // Fetch products
    const foodQuery = `
      query GetFoods($restaurant: ID) {
        foods(restaurant: $restaurant) {
          id
          title
          description
          image
          variations {
            id
            title
            price
            discounted
          }
        }
      }
    `;

    const foodData = await graphqlRequest(foodQuery, {
      restaurant: restaurant.id,
    });

    if (!foodData.foods || foodData.foods.length === 0) {
      log.warning('No products found for this restaurant');
      log.info('Creating a test order anyway...');
      return true;
    }

    const product = foodData.foods[0];
    const variation = product.variations[0];

    TEST_ORDER.items = [
      {
        food: product.id,
        title: product.title,
        description: product.description || '',
        image: product.image || '',
        quantity: 2,
        variation: {
          title: variation.title,
          price: variation.price,
          discounted: variation.discounted || variation.price,
        },
        addons: [],
        specialInstructions: 'Test order - please handle with care',
      },
    ];

    log.success(`Added product: ${product.title}`);
    log.info(`Variation: ${variation.title} - ETB ${variation.price}`);
    log.info(`Quantity: 2`);

    return true;
  } catch (error) {
    log.error('Failed to fetch restaurant/products');
    log.error(error.message);
    return false;
  }
}

async function placeOrder() {
  log.section('📦 Placing Order');

  try {
    const subtotal = TEST_ORDER.items.reduce((sum, item) => {
      return sum + (item.variation.price * item.quantity);
    }, 0);

    const taxAmount = subtotal * TEST_ORDER.taxRate;
    const totalAmount = subtotal + TEST_ORDER.deliveryCharges + taxAmount + TEST_ORDER.tipping;

    log.info(`Subtotal: ETB ${subtotal.toFixed(2)}`);
    log.info(`Delivery: ETB ${TEST_ORDER.deliveryCharges.toFixed(2)}`);
    log.info(`Tax (15%): ETB ${taxAmount.toFixed(2)}`);
    log.info(`Total: ETB ${totalAmount.toFixed(2)}`);

    const mutation = `
      mutation PlaceOrder(
        $restaurant: ID!
        $orderInput: [OrderItemInput!]!
        $paymentMethod: String!
        $address: OrderAddressInput!
        $tipping: Float!
        $taxationAmount: Float!
        $orderDate: String!
        $isPickedUp: Boolean!
        $deliveryCharges: Float!
        $instructions: String
      ) {
        placeOrder(
          restaurant: $restaurant
          orderInput: $orderInput
          paymentMethod: $paymentMethod
          address: $address
          tipping: $tipping
          taxationAmount: $taxationAmount
          orderDate: $orderDate
          isPickedUp: $isPickedUp
          deliveryCharges: $deliveryCharges
          instructions: $instructions
        ) {
          id
          _id
          orderId
          orderStatus
          paymentStatus
          orderAmount
          deliveryCharges
          taxationAmount
          createdAt
        }
      }
    `;

    const data = await graphqlRequest(
      mutation,
      {
        restaurant: TEST_ORDER.restaurantId,
        orderInput: TEST_ORDER.items,
        paymentMethod: 'chapa',
        address: {
          deliveryAddress: TEST_ORDER.deliveryAddress.deliveryAddress,
          location: TEST_ORDER.deliveryAddress.location,
          details: TEST_ORDER.deliveryAddress.details,
          label: TEST_ORDER.deliveryAddress.label,
        },
        tipping: TEST_ORDER.tipping,
        taxationAmount: taxAmount,
        orderDate: new Date().toISOString(),
        isPickedUp: false,
        deliveryCharges: TEST_ORDER.deliveryCharges,
        instructions: 'Test order via integration test',
      },
      authToken
    );

    testOrderId = data.placeOrder.id;

    log.success('Order placed successfully!');
    log.info(`Order ID: ${data.placeOrder.orderId}`);
    log.info(`Order Status: ${data.placeOrder.orderStatus}`);
    log.info(`Payment Status: ${data.placeOrder.paymentStatus}`);
    log.info(`Amount: ETB ${data.placeOrder.orderAmount}`);

    return true;
  } catch (error) {
    log.error('Failed to place order');
    log.error(error.message);
    return false;
  }
}

async function initializePayment() {
  log.section('💳 Initializing Chapa Payment');

  try {
    const mutation = `
      mutation InitializePayment(
        $orderId: ID!
        $paymentMethod: String!
        $returnUrl: String
        $callbackUrl: String
      ) {
        initializePayment(
          orderId: $orderId
          paymentMethod: $paymentMethod
          returnUrl: $returnUrl
          callbackUrl: $callbackUrl
        ) {
          success
          checkoutUrl
          txRef
          error
          orderId
        }
      }
    `;

    const data = await graphqlRequest(
      mutation,
      {
        orderId: testOrderId,
        paymentMethod: 'chapa',
        returnUrl: 'http://localhost:4000/payment/success',
        callbackUrl: 'http://localhost:4000/payment/callback',
      },
      authToken
    );

    if (data.initializePayment.success) {
      paymentTxRef = data.initializePayment.txRef;

      log.success('Payment initialized successfully!');
      log.info(`Transaction Ref: ${paymentTxRef}`);
      
      console.log('\n' + '═'.repeat(70));
      console.log('🌐 CHAPA CHECKOUT URL:');
      console.log(colors.cyan + data.initializePayment.checkoutUrl + colors.reset);
      console.log('═'.repeat(70) + '\n');

      log.highlight('📱 PAYMENT INSTRUCTIONS:');
      console.log('1. Open the URL above in your browser');
      console.log('2. Select payment method (Telebirr, CBE Birr, etc.)');
      console.log('3. Use test phone: 0900123456');
      console.log('4. Complete the payment');
      console.log('5. Return here to verify\n');

      return true;
    } else {
      log.error('Payment initialization failed');
      log.error(data.initializePayment.error);
      return false;
    }
  } catch (error) {
    log.error('Failed to initialize payment');
    log.error(error.message);
    return false;
  }
}

async function verifyPayment() {
  log.section('🔍 Verifying Payment');

  if (!paymentTxRef) {
    log.error('No transaction reference available');
    return false;
  }

  try {
    const mutation = `
      mutation VerifyPayment($txRef: String!) {
        verifyPayment(txRef: $txRef) {
          success
          status
          amount
          currency
          txRef
          error
          order {
            id
            orderId
            orderStatus
            paymentStatus
            orderAmount
            paidAmount
          }
        }
      }
    `;

    const data = await graphqlRequest(
      mutation,
      { txRef: paymentTxRef },
      authToken
    );

    if (data.verifyPayment.success) {
      log.success('Payment verification successful!');
      log.info(`Status: ${data.verifyPayment.status}`);
      log.info(`Amount: ${data.verifyPayment.currency} ${data.verifyPayment.amount}`);
      
      if (data.verifyPayment.order) {
        log.info(`Order Status: ${data.verifyPayment.order.orderStatus}`);
        log.info(`Payment Status: ${data.verifyPayment.order.paymentStatus}`);
        
        if (data.verifyPayment.order.paymentStatus === 'paid') {
          log.success('✓ Payment completed successfully!');
        } else {
          log.warning(`Payment status: ${data.verifyPayment.order.paymentStatus}`);
        }
      }

      return true;
    } else {
      log.error('Payment verification failed');
      log.error(data.verifyPayment.error);
      return false;
    }
  } catch (error) {
    log.error('Failed to verify payment');
    log.error(error.message);
    return false;
  }
}

async function runFullIntegrationTest() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 REAL APP PAYMENT FLOW INTEGRATION TEST');
  console.log('═'.repeat(70) + '\n');

  const results = {
    serverConnection: false,
    authentication: false,
    fetchData: false,
    placeOrder: false,
    initializePayment: false,
  };

  // Step 1: Test server connection
  results.serverConnection = await testServerConnection();
  if (!results.serverConnection) {
    log.error('\n❌ Cannot proceed without server connection\n');
    return;
  }

  // Step 2: Authenticate user
  results.authentication = await registerOrLoginUser();
  if (!results.authentication) {
    log.error('\n❌ Cannot proceed without authentication\n');
    return;
  }

  // Step 3: Fetch restaurant and products
  results.fetchData = await fetchRestaurantAndProducts();
  if (!results.fetchData) {
    log.error('\n❌ Cannot proceed without restaurant data\n');
    return;
  }

  // Step 4: Place order
  results.placeOrder = await placeOrder();
  if (!results.placeOrder) {
    log.error('\n❌ Cannot proceed without placing order\n');
    return;
  }

  // Step 5: Initialize payment
  results.initializePayment = await initializePayment();
  if (!results.initializePayment) {
    log.error('\n❌ Payment initialization failed\n');
    return;
  }

  // Summary
  log.section('✅ Integration Test Summary');

  log.success('Server Connection');
  log.success('User Authentication');
  log.success('Data Fetching');
  log.success('Order Placement');
  log.success('Payment Initialization');

  console.log('\n' + '═'.repeat(70));
  log.highlight('🎉 ALL TESTS PASSED!');
  console.log('═'.repeat(70) + '\n');

  log.info('Next steps:');
  console.log('1. Complete the payment in your browser');
  console.log('2. Run verification:');
  console.log(`   node -e "require('./test-app-payment-flow').verifyPaymentManual('${paymentTxRef}')"`);
  console.log('');

  log.info('Test Data:');
  console.log(`  User ID: ${testUserId}`);
  console.log(`  Order ID: ${testOrderId}`);
  console.log(`  Transaction Ref: ${paymentTxRef}`);
  console.log('');
}

// Export for manual verification
async function verifyPaymentManual(txRef) {
  paymentTxRef = txRef;
  authToken = 'dummy'; // Will need actual token
  await verifyPayment();
}

// Run the test
if (require.main === module) {
  runFullIntegrationTest().catch((error) => {
    console.error('\n❌ Integration test failed:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { verifyPaymentManual };
