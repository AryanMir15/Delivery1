// Test backend GraphQL connection
const fetch = require('node-fetch');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testConnection() {
  console.log('🔵 Testing backend connection...');
  console.log('   URL:', GRAPHQL_URL);
  
  try {
    // Test 1: Simple ping
    console.log('\n📡 Test 1: HTTP Connection');
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ __typename }'
      })
    });
    
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
      console.log('✅ Backend is reachable!');
    } else {
      console.log('❌ Backend returned error status');
    }
    
    // Test 2: ownerLogin mutation
    console.log('\n📡 Test 2: ownerLogin Mutation');
    const loginResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation {
            ownerLogin(email: "vendor@test.com", password: "vendor123") {
              userId
              token
              email
              name
              userType
            }
          }
        `
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.data?.ownerLogin) {
      console.log('✅ Login mutation works!');
      console.log('   User ID:', loginData.data.ownerLogin.userId);
      console.log('   Email:', loginData.data.ownerLogin.email);
      console.log('   Role:', loginData.data.ownerLogin.userType);
    } else if (loginData.errors) {
      console.log('❌ Login mutation failed:', loginData.errors[0].message);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm run dev)');
    console.log('   2. Server is on port 4000');
    console.log('   3. MongoDB is running');
  }
}

testConnection();
