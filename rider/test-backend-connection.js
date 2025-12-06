#!/usr/bin/env node
// Quick Backend Connection Test for Rider App

const http = require('http');

const BACKEND_IP = '192.168.137.1'; // Change this to match your config
const BACKEND_PORT = 4000;

console.log('🧪 Testing Backend Connection...\n');
console.log(`📍 Backend: http://${BACKEND_IP}:${BACKEND_PORT}`);
console.log('─'.repeat(50));

// Test 1: Health Check
function testHealthCheck() {
  return new Promise((resolve) => {
    console.log('\n1️⃣ Testing Health Endpoint...');
    
    const options = {
      hostname: BACKEND_IP,
      port: BACKEND_PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Health check passed');
          console.log('   Response:', data);
          resolve(true);
        } else {
          console.log('   ❌ Health check failed');
          console.log('   Status:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Connection failed:', error.message);
      console.log('   💡 Backend might not be running');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ❌ Connection timeout');
      console.log('   💡 Check firewall or IP address');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Test 2: GraphQL Endpoint
function testGraphQL() {
  return new Promise((resolve) => {
    console.log('\n2️⃣ Testing GraphQL Endpoint...');
    
    const postData = JSON.stringify({
      query: '{ __typename }',
    });

    const options = {
      hostname: BACKEND_IP,
      port: BACKEND_PORT,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ GraphQL endpoint working');
          resolve(true);
        } else {
          console.log('   ❌ GraphQL endpoint failed');
          console.log('   Status:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Connection failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ❌ Connection timeout');
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Socket.io Endpoint
function testSocketIO() {
  return new Promise((resolve) => {
    console.log('\n3️⃣ Testing Socket.io Endpoint...');
    
    const options = {
      hostname: BACKEND_IP,
      port: BACKEND_PORT,
      path: '/socket.io/socket.io.js',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Socket.io endpoint accessible');
        resolve(true);
      } else {
        console.log('   ❌ Socket.io endpoint not found');
        console.log('   Status:', res.statusCode);
        console.log('   💡 Socket.io might not be initialized');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('   ❌ Connection failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ❌ Connection timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  const results = {
    health: await testHealthCheck(),
    graphql: await testGraphQL(),
    socketio: await testSocketIO(),
  };

  console.log('\n' + '─'.repeat(50));
  console.log('📊 Test Results:');
  console.log('─'.repeat(50));
  console.log(`Health Check:    ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`GraphQL:         ${results.graphql ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Socket.io:       ${results.socketio ? '✅ PASS' : '❌ FAIL'}`);
  console.log('─'.repeat(50));

  const allPassed = results.health && results.graphql && results.socketio;

  if (allPassed) {
    console.log('\n🎉 All tests passed! Backend is ready.');
    console.log('✅ You can now run the rider app.');
  } else {
    console.log('\n⚠️  Some tests failed. Troubleshooting:');
    
    if (!results.health) {
      console.log('\n❌ Health Check Failed:');
      console.log('   1. Make sure backend is running: npm start');
      console.log('   2. Check if port 4000 is in use');
      console.log('   3. Verify IP address is correct');
    }
    
    if (!results.graphql) {
      console.log('\n❌ GraphQL Failed:');
      console.log('   1. Backend might be starting up (wait 10 seconds)');
      console.log('   2. Check backend logs for errors');
    }
    
    if (!results.socketio) {
      console.log('\n❌ Socket.io Failed:');
      console.log('   1. Socket.io might not be initialized');
      console.log('   2. Check backend logs for "Socket.io server starting"');
      console.log('   3. App will work without Socket.io (no real-time tracking)');
    }

    console.log('\n💡 Quick Fixes:');
    console.log('   • Restart backend: npm start');
    console.log('   • Check firewall settings');
    console.log('   • Update IP in rider/src/config/constants.js');
    console.log('   • Run: node test-socket-rider.js');
  }

  console.log('\n📚 For detailed help, see: rider/SOCKET_TROUBLESHOOTING.md\n');
  process.exit(allPassed ? 0 : 1);
}

runTests();
