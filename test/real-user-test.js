import axios from 'axios';

// Real user JWT token
const SUPABASE_JWT = process.env.SUPABASE_JWT || 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlNncVZIZE9mQ3ZJQjlLQ3oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3JuZ3d6c2lidmV0YWJpZ3Z3dnBjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmY2E0NDVjMi0zMTdjLTQxZTctYTkxZS1jOGEzYTY0NDJjYTQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyOTIxMjE4LCJpYXQiOjE3NTI5MTc2MTgsImVtYWlsIjoiYWJoaXNoZWsudmVybWEyMDI0QG5zdC5yaXNoaWhvb2QuZWR1LmluIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFiaGlzaGVrLnZlcm1hMjAyNEBuc3QucmlzaGlob29kLmVkdS5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiSm9kZCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmNhNDQ1YzItMzE3Yy00MWU3LWE5MWUtYzhhM2E2NDQyY2E0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTI5MTc2MTh9XSwic2Vzc2lvbl9pZCI6ImFkM2FjODczLTJlYWMtNGExMy1iMTdmLWJhYzAyNzFjNDYwMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.hUraacof8GEW3XVOQfIpPquzuOb0yUGZOMhxG1QA3QI';

const PROXY_BASE_URL = process.env.PROXY_BASE_URL || 'http://localhost:8000';

// Real user browser headers
const getRealUserHeaders = (jwt) => ({
  'Authorization': `Bearer ${jwt}`,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
});

// Real user API headers (for AJAX requests)
const getRealUserAPIHeaders = (jwt) => ({
  'Authorization': `Bearer ${jwt}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
});

async function testRealUserFlow() {
  console.log('🚀 Testing Real User Flow');
  console.log('👤 Simulating: User clicks on localhost:8000/outline with token');
  console.log('🔐 Using JWT:', SUPABASE_JWT ? 'Yes' : 'No');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  // Test 1: User clicks on /outline (browser navigation)
  console.log('📄 Test 1: User clicks on /outline (Browser Navigation)');
  console.log('🌐 URL:', `${PROXY_BASE_URL}/outline`);
  console.log('📋 Method: GET');
  console.log('🔧 Headers: Real browser headers');
  
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: 'GET',
      url: `${PROXY_BASE_URL}/outline`,
      headers: getRealUserHeaders(SUPABASE_JWT),
      validateStatus: () => true,
      timeout: 10000,
      maxRedirects: 5
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.keys(response.headers));
    
    // Show response data (truncated)
    if (response.data) {
      const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      console.log(`📄 Response Data:`, dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    if (error.response) {
      console.log(`📊 Error Status: ${error.response.status}`);
      console.log(`📄 Error Data:`, error.response.data);
    }
  }

  // Test 2: User makes API call to /outline/api/auth.info (AJAX)
  console.log('📄 Test 2: User makes API call to /outline/api/auth.info (AJAX)');
  console.log('🌐 URL:', `${PROXY_BASE_URL}/outline/api/auth.info`);
  console.log('📋 Method: GET');
  console.log('🔧 Headers: Real API headers');
  
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: 'GET',
      url: `${PROXY_BASE_URL}/outline/api/auth.info`,
      headers: getRealUserAPIHeaders(SUPABASE_JWT),
      validateStatus: () => true,
      timeout: 10000
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.keys(response.headers));
    
    // Show response data
    if (response.data) {
      const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      console.log(`📄 Response Data:`, dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    if (error.response) {
      console.log(`📊 Error Status: ${error.response.status}`);
      console.log(`📄 Error Data:`, error.response.data);
    }
  }

  // Test 3: User makes API call to /outline/health (AJAX)
  console.log('📄 Test 3: User makes API call to /outline/health (AJAX)');
  console.log('🌐 URL:', `${PROXY_BASE_URL}/outline/health`);
  console.log('📋 Method: GET');
  console.log('🔧 Headers: Real API headers');
  
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: 'GET',
      url: `${PROXY_BASE_URL}/outline/health`,
      headers: getRealUserAPIHeaders(SUPABASE_JWT),
      validateStatus: () => true,
      timeout: 10000
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.keys(response.headers));
    
    // Show response data
    if (response.data) {
      const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      console.log(`📄 Response Data:`, dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    if (error.response) {
      console.log(`📊 Error Status: ${error.response.status}`);
      console.log(`📄 Error Data:`, error.response.data);
    }
  }

  console.log('🏁 Real user flow test completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - Test 1: Browser navigation to /outline');
  console.log('   - Test 2: AJAX call to /outline/api/auth.info');
  console.log('   - Test 3: AJAX call to /outline/health');
  console.log('');
  console.log('💡 Check the proxy server logs to see the injected headers!');
}

// Run the test
testRealUserFlow().catch(console.error); 