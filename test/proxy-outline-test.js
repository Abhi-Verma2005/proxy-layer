const axios = require('axios');

// Configuration - adjust these values for your setup
const SUPABASE_JWT = process.env.SUPABASE_JWT || 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlNncVZIZE9mQ3ZJQjlLQ3oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3JuZ3d6c2lidmV0YWJpZ3Z3dnBjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmY2E0NDVjMi0zMTdjLTQxZTctYTkxZS1jOGEzYTY0NDJjYTQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyOTIxMjE4LCJpYXQiOjE3NTI5MTc2MTgsImVtYWlsIjoiYWJoaXNoZWsudmVybWEyMDI0QG5zdC5yaXNoaWhvb2QuZWR1LmluIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFiaGlzaGVrLnZlcm1hMjAyNEBuc3QucmlzaGlob29kLmVkdS5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiSm9kZCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmNhNDQ1YzItMzE3Yy00MWU3LWE5MWUtYzhhM2E2NDQyY2E0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTI5MTc2MTh9XSwic2Vzc2lvbl9pZCI6ImFkM2FjODczLTJlYWMtNGExMy1iMTdmLWJhYzAyNzFjNDYwMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.hUraacof8GEW3XVOQfIpPquzuOb0yUGZOMhxG1QA3QI';
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || 'http://localhost:8000';
const OUTLINE_TARGET_URL = process.env.OUTLINE_TARGET_URL || 'http://localhost:3000';

// Test scenarios that mimic real dashboard requests
const testScenarios = [
  {
    name: 'Dashboard → Outline Auth Info',
    method: 'GET',
    path: '/outline/api/auth.info',
    description: 'Main dashboard checking user authentication status in Outline'
  },
  {
    name: 'Dashboard → Outline User Profile',
    method: 'GET', 
    path: '/outline/api/users.info',
    description: 'Main dashboard fetching user profile from Outline'
  },
  {
    name: 'Dashboard → Outline Documents List',
    method: 'GET',
    path: '/outline/api/documents.list',
    description: 'Main dashboard fetching user documents from Outline'
  },
  {
    name: 'Dashboard → Outline Teams List',
    method: 'GET',
    path: '/outline/api/teams.list',
    description: 'Main dashboard fetching user teams from Outline'
  },
  {
    name: 'Dashboard → Outline Health Check',
    method: 'GET',
    path: '/outline/health',
    description: 'Main dashboard checking Outline service health'
  },
  {
    name: 'Dashboard → Outline Root',
    method: 'GET',
    path: '/outline',
    description: 'Main dashboard accessing Outline root (should redirect to dashboard)'
  }
];

// Headers that would come from a real dashboard
const getDashboardHeaders = (jwt) => ({
  'Authorization': `Bearer ${jwt}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Dashboard-Client/1.0',
  'X-Requested-With': 'XMLHttpRequest',
  'X-Forwarded-For': '127.0.0.1',
  'X-Forwarded-Proto': 'https',
  'X-Forwarded-Host': 'dashboard.example.com'
});

async function testProxyScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🌐 URL: ${PROXY_BASE_URL}${scenario.path}`);
  console.log(`📋 Method: ${scenario.method}`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: scenario.method,
      url: `${PROXY_BASE_URL}${scenario.path}`,
      headers: getDashboardHeaders(SUPABASE_JWT),
      validateStatus: () => true, // Don't throw on non-2xx
      timeout: 10000 // 10 second timeout
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.keys(response.headers));
    
    // Log response data (truncated for readability)
    if (response.data) {
      const dataStr = JSON.stringify(response.data, null, 2);
      console.log(`📄 Response Data:`, dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr);
    }
    
    // Success indicators
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ SUCCESS: Request completed successfully`);
    } else if (response.status === 401) {
      console.log(`🔐 AUTH: Authentication required (expected for some endpoints)`);
    } else if (response.status === 404) {
      console.log(`❌ NOT_FOUND: Endpoint not found (may be expected)`);
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

async function runAllTests() {
  console.log(`🚀 Starting Proxy Layer Tests`);
  console.log(`📡 Proxy URL: ${PROXY_BASE_URL}`);
  console.log(`🎯 Target URL: ${OUTLINE_TARGET_URL}`);
  console.log(`🔐 Using JWT: ${SUPABASE_JWT ? 'Yes' : 'No'}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Test proxy health first
  await testProxyHealth();
  
  // Test services status
  await testServicesStatus();
  
  // Test each scenario
  for (const scenario of testScenarios) {
    await testProxyScenario(scenario);
  }
  
  console.log(`\n🏁 All tests completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Health check: Verify proxy is running`);
  console.log(`   - Services status: Verify outline service is enabled`);
  console.log(`   - Auth flow: Verify JWT authentication works`);
  console.log(`   - Proxy flow: Verify requests are forwarded to Outline`);
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testProxyScenario,
  testProxyHealth,
  testServicesStatus,
  runAllTests
}; 