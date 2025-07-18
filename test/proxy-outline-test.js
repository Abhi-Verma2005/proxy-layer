const axios = require('axios');

// Paste your Supabase JWT here
const SUPABASE_JWT = process.env.SUPABASE_JWT || '<PASTE_YOUR_SUPABASE_JWT_HERE>';

// The URL of your proxy server (adjust as needed)
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:3000/outline/api/auth.info';

async function testProxy() {
  try {
    const response = await axios.get(PROXY_URL, {
      headers: {
        Authorization: `Bearer ${SUPABASE_JWT}`,
      },
      validateStatus: () => true, // Don't throw on non-2xx
    });
    console.log('Status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    console.log('If the proxy and auth are working, you should be logged in and see Outline user info or a valid error.');
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testProxy(); 