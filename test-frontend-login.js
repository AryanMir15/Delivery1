// Test frontend login with detailed error checking
const fetch = require('node-fetch');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

const LOGIN_MUTATION = `
  mutation LoginUser(
    $email: String!
    $password: String!
    $type: String
    $name: String
    $notificationToken: String
    $isActive: Boolean
  ) {
    login(
      email: $email
      password: $password
      type: $type
      name: $name
      notificationToken: $notificationToken
      isActive: $isActive
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

async function testLogin() {
  console.log('🧪 Testing Frontend Login Validation...\n');

  const testCases = [
    {
      name: 'Valid vendor login',
      email: 'vendor@test.com',
      password: 'vendor123',
      type: 'default'
    },
    {
      name: 'Invalid email',
      email: 'wrong@test.com',
      password: 'vendor123',
      type: 'default'
    },
    {
      name: 'Invalid password',
      email: 'vendor@test.com',
      password: 'wrongpass',
      type: 'default'
    },
    {
      name: 'Empty email',
      email: '',
      password: 'vendor123',
      type: 'default'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Email: ${testCase.email || '(empty)'}`);
    console.log(`   Password: ${testCase.password ? '***' : '(empty)'}`);

    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: LOGIN_MUTATION,
          variables: {
            email: testCase.email,
            password: testCase.password,
            type: testCase.type,
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        console.log('   ❌ Error:', data.errors[0].message);
      } else if (data.data && data.data.login) {
        console.log('   ✅ Success!');
        console.log('   User:', data.data.login.name);
        console.log('   Email:', data.data.login.email);
        console.log('   Role:', data.data.login.userTypeId);
        console.log('   Token:', data.data.login.token.substring(0, 20) + '...');
      } else {
        console.log('   ⚠️  Unexpected response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log('   ❌ Network Error:', error.message);
    }
  }

  console.log('\n✅ Login validation test completed!');
}

testLogin();
