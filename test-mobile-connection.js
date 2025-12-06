// Test if mobile app can connect to backend
const fetch = require('node-fetch');

const MOBILE_IP = '10.0.26.24'; // Your computer's IP
const PORT = '4000';

async function testConnection() {
  console.log('🧪 Testing Mobile App Connection...\n');
  
  const endpoints = [
    { name: 'Health Check', url: `http://localhost:${PORT}/health` },
    { name: 'GraphQL (localhost)', url: `http://localhost:${PORT}/graphql` },
    { name: 'GraphQL (IP)', url: `http://${MOBILE_IP}:${PORT}/graphql` },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '{ __typename }',
        }),
        timeout: 5000,
      });

      if (response.ok) {
        console.log(`   ✅ Connected! Status: ${response.status}`);
      } else {
        console.log(`   ⚠️  Response: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n📱 Mobile App Configuration:');
  console.log(`   API URL should be: http://${MOBILE_IP}:${PORT}/graphql`);
  console.log(`   Current IP: ${MOBILE_IP}`);
  console.log(`   Port: ${PORT}`);
  console.log('\n✅ Connection test completed!');
}

testConnection();
