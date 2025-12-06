// Test mobile app to backend integration
const fetch = require('node-fetch');

const MOBILE_API_URL = 'http://10.0.26.24:4000/graphql';

async function testIntegration() {
  console.log('🧪 Testing Mobile App Backend Integration\n');
  console.log('=' .repeat(60));
  
  // Test 1: Basic connectivity
  console.log('\n📡 Test 1: Basic Connectivity');
  console.log('   URL:', MOBILE_API_URL);
  
  try {
    const response = await fetch(MOBILE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      timeout: 5000,
    });
    
    if (response.ok) {
      console.log('   ✅ Backend is reachable');
    } else {
      console.log('   ❌ Backend returned:', response.status);
      return;
    }
  } catch (error) {
    console.log('   ❌ Cannot reach backend:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if backend is running: npm start');
    console.log('   2. Verify IP address: ipconfig (should be 10.0.26.24)');
    console.log('   3. Check firewall settings');
    console.log('   4. Make sure phone and PC are on same network');
    return;
  }

  // Test 2: Login mutation
  console.log('\n🔐 Test 2: Login Mutation');
  
  const LOGIN_MUTATION = `
    mutation LoginUser($email: String!, $password: String!, $type: String) {
      login(email: $email, password: $password, type: $type) {
        userId
        token
        name
        email
        userTypeId
        isActive
      }
    }
  `;
  
  try {
    const response = await fetch(MOBILE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      console.log('   ❌ Login error:', data.errors[0].message);
    } else if (data.data && data.data.login) {
      console.log('   ✅ Login successful!');
      console.log('   User:', data.data.login.name);
      console.log('   Email:', data.data.login.email);
      console.log('   Role:', data.data.login.userTypeId);
      console.log('   Token:', data.data.login.token.substring(0, 30) + '...');
    } else {
      console.log('   ⚠️  Unexpected response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
  }

  // Test 3: Check categories
  console.log('\n📦 Test 3: Categories Query');
  
  const CATEGORIES_QUERY = `
    query GetCategories {
      categories {
        _id
        title
        businessType
      }
    }
  `;
  
  try {
    const response = await fetch(MOBILE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATEGORIES_QUERY }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.log('   ❌ Query error:', data.errors[0].message);
    } else if (data.data && data.data.categories) {
      console.log('   ✅ Categories found:', data.data.categories.length);
      data.data.categories.forEach(cat => {
        console.log(`      - ${cat.title} (${cat.businessType})`);
      });
    }
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Integration test completed!');
  console.log('\n📱 Mobile App Configuration:');
  console.log('   File: mobile/src/api/apolloClient.js');
  console.log('   API_URL should be: http://10.0.26.24:4000/graphql');
  console.log('\n🔄 To clear app cache:');
  console.log('   cd mobile');
  console.log('   node CLEAR_APP_DATA.js');
  console.log('   npm start -- --clear');
}

testIntegration();
