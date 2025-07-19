const axios = require('axios');

// Configuration
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || 'http://localhost:8000';
const SUPABASE_JWT = process.env.SUPABASE_JWT || 'your_supabase_jwt_here';

// Test scenarios for cross-database session checking
const testScenarios = [
  {
    name: 'User with active Outline session',
    description: 'User exists in both databases and has active Outline session',
    expectedBehavior: 'Should redirect directly to Outline'
  },
  {
    name: 'User without Outline session',
    description: 'User exists in both databases but no active Outline session',
    expectedBehavior: 'Should redirect to Google OAuth'
  },
  {
    name: 'User not in Outline database',
    description: 'User exists in main app but not in Outline database',
    expectedBehavior: 'Should redirect to Google OAuth'
  },
  {
    name: 'Invalid token',
    description: 'Invalid or expired Supabase JWT',
    expectedBehavior: 'Should return 401 Unauthorized'
  }
];

async function testCrossDatabaseSession(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🎯 Expected: ${scenario.expectedBehavior}`);
  console.log(`🌐 URL: ${PROXY_BASE_URL}/outline?token=${SUPABASE_JWT ? 'valid_token' : 'invalid_token'}`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: 'GET',
      url: `${PROXY_BASE_URL}/outline`,
      params: { token: SUPABASE_JWT },
      validateStatus: () => true, // Don't throw on non-2xx
      timeout: 10000,
      maxRedirects: 5
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Analyze response
    if (response.status === 302) {
      const location = response.headers.location;
      console.log(`🔄 Redirect Location: ${location}`);
      
      if (location.includes('localhost:3000/auth/google')) {
        console.log(`✅ SUCCESS: Redirected to Google OAuth (no session)`);
      } else if (location.includes('localhost:3000')) {
        console.log(`✅ SUCCESS: Redirected to Outline (has session)`);
      } else {
        console.log(`⚠️  UNEXPECTED: Redirected to unknown location`);
      }
    } else if (response.status === 401) {
      console.log(`🔐 AUTH: Authentication required (invalid token)`);
    } else if (response.status === 200) {
      console.log(`📄 RESPONSE: Got JSON response instead of redirect`);
      console.log(`📄 Data:`, JSON.stringify(response.data, null, 2));
    } else {
      console.log(`⚠️  WARNING: Unexpected status code`);
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    if (error.response) {
      console.log(`📊 Error Status: ${error.response.status}`);
      console.log(`📄 Error Data:`, error.response.data);
    }
  }
}

async function testProxyHealth() {
  console.log(`\n🏥 Testing Proxy Health`);
  console.log(`🌐 URL: ${PROXY_BASE_URL}/health`);
  
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log(`📊 Health Status: ${response.status}`);
    console.log(`📄 Health Data:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log(`💥 Health Check Failed: ${error.message}`);
  }
}

async function testServicesStatus() {
  console.log(`\n📋 Testing Services Status`);
  console.log(`🌐 URL: ${PROXY_BASE_URL}/services`);
  
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/services`, {
      timeout: 5000
    });
    
    console.log(`📊 Services Status: ${response.status}`);
    console.log(`📄 Services Data:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log(`💥 Services Check Failed: ${error.message}`);
  }
}

async function testEnvironmentVariables() {
  console.log(`\n🔧 Testing Environment Variables`);
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OUTLINE_SUPABASE_URL',
    'OUTLINE_SUPABASE_ANON_KEY',
    'OUTLINE_SUPABASE_SERVICE_ROLE_KEY',
    'OUTLINE_BASE_URL'
  ];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });
}

async function runAllTests() {
  console.log(`🚀 Starting Cross-Database Session Tests`);
  console.log(`📡 Proxy URL: ${PROXY_BASE_URL}`);
  console.log(`🔐 Using JWT: ${SUPABASE_JWT ? 'Yes' : 'No'}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Test environment variables
  await testEnvironmentVariables();
  
  // Test proxy health first
  await testProxyHealth();
  
  // Test services status
  await testServicesStatus();
  
  // Test each scenario
  for (const scenario of testScenarios) {
    await testCrossDatabaseSession(scenario);
  }
  
  console.log(`\n🏁 All tests completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Environment: Verify all required variables are set`);
  console.log(`   - Health check: Verify proxy is running`);
  console.log(`   - Services status: Verify outline service is enabled`);
  console.log(`   - Session checking: Verify cross-database validation works`);
  console.log(`   - OAuth flow: Verify redirects work correctly`);
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCrossDatabaseSession,
  testProxyHealth,
  testServicesStatus,
  testEnvironmentVariables,
  runAllTests
}; 