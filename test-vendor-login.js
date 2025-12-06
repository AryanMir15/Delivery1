// Test vendor login functionality
const fetch = require('node-fetch');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      userId
      token
      name
      email
      phone
      userTypeId
      isActive
    }
  }
`;

const OWNER_LOGIN_MUTATION = `
  mutation OwnerLogin($email: String!, $password: String!) {
    ownerLogin(email: $email, password: $password) {
      userId
      token
      email
      userType
      userTypeId
    }
  }
`;

async function testLogin() {
  console.log('🧪 Testing Vendor Login...\n');

  try {
    // Test regular login
    console.log('1️⃣ Testing regular login mutation:');
    const loginResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: {
          email: 'vendor@test.com',
          password: 'vendor123',
        },
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginData.errors) {
      console.log('❌ Login failed:', loginData.errors[0].message);
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', loginData.data.login.userId);
      console.log('Name:', loginData.data.login.name);
      console.log('Email:', loginData.data.login.email);
      console.log('Role:', loginData.data.login.userTypeId);
      console.log('Token:', loginData.data.login.token.substring(0, 20) + '...');
    }

    console.log('\n2️⃣ Testing owner login mutation:');
    const ownerLoginResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: OWNER_LOGIN_MUTATION,
        variables: {
          email: 'vendor@test.com',
          password: 'vendor123',
        },
      }),
    });

    const ownerLoginData = await ownerLoginResponse.json();
    
    if (ownerLoginData.errors) {
      console.log('❌ Owner login failed:', ownerLoginData.errors[0].message);
      console.log('Note: This is expected if vendor role is not "admin" or "restaurant"');
    } else {
      console.log('✅ Owner login successful!');
      console.log('User ID:', ownerLoginData.data.ownerLogin.userId);
      console.log('Email:', ownerLoginData.data.ownerLogin.email);
      console.log('User Type:', ownerLoginData.data.ownerLogin.userType);
      console.log('Token:', ownerLoginData.data.ownerLogin.token.substring(0, 20) + '...');
    }

    console.log('\n✅ Login test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();
