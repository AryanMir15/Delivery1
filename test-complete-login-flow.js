// Complete login flow test - Frontend to Backend
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const fetch = require('node-fetch');

const GRAPHQL_URL = 'http://10.0.26.24:4000/graphql';

const LOGIN_MUTATION = `
  mutation LoginUser(
    $email: String!
    $password: String!
    $type: String
  ) {
    login(
      email: $email
      password: $password
      type: $type
    ) {
      userId
      token
      tokenExpiration
      name
      phone
      phoneIsVerified
      email
      emailIsVerified
      picture
      isNewUser
      userTypeId
      isActive
    }
  }
`;

async function testCompleteLoginFlow() {
  console.log('🧪 Testing Complete Login Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Connect to MongoDB and verify user exists
    console.log('\n📊 Step 1: Checking Database');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const user = await User.findOne({ email: 'vendor@test.com' });
    if (!user) {
      console.log('❌ User not found in database!');
      process.exit(1);
    }
    
    console.log('✅ User found in database:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   ID:', user._id);

    // Step 2: Test password verification
    console.log('\n🔐 Step 2: Testing Password');
    const isPasswordValid = await user.comparePassword('vendor123');
    if (isPasswordValid) {
      console.log('✅ Password verification works');
    } else {
      console.log('❌ Password verification failed!');
      process.exit(1);
    }

    // Step 3: Test GraphQL endpoint
    console.log('\n🌐 Step 3: Testing GraphQL Login');
    console.log('   URL:', GRAPHQL_URL);
    console.log('   Email: vendor@test.com');
    console.log('   Password: vendor123');

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: {
          email: 'vendor@test.com',
          password: 'vendor123',
          type: 'default',
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.log('❌ GraphQL Error:', data.errors[0].message);
      console.log('   Full error:', JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }

    if (!data.data || !data.data.login) {
      console.log('❌ No login data returned');
      console.log('   Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ GraphQL login successful!');
    console.log('\n📦 Response Data:');
    console.log('   User ID:', data.data.login.userId);
    console.log('   Name:', data.data.login.name);
    console.log('   Email:', data.data.login.email);
    console.log('   Phone:', data.data.login.phone);
    console.log('   Role:', data.data.login.userTypeId);
    console.log('   Active:', data.data.login.isActive);
    console.log('   Token:', data.data.login.token.substring(0, 30) + '...');

    // Step 4: Verify token format
    console.log('\n🔑 Step 4: Verifying Token');
    const token = data.data.login.token;
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      console.log('✅ Token format is valid (JWT)');
    } else {
      console.log('⚠️  Token format may be invalid');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n📱 Mobile App Login Instructions:');
    console.log('   1. Make sure mobile app API URL is: http://10.0.26.24:4000/graphql');
    console.log('   2. Use these credentials:');
    console.log('      Email: vendor@test.com');
    console.log('      Password: vendor123');
    console.log('   3. If still stuck, clear app cache and restart Expo');
    console.log('\n💡 To clear cache: cd mobile && npm start -- --clear');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testCompleteLoginFlow();
