# Proxy Layer Test Scripts

This directory contains test scripts to verify that the proxy layer is working correctly and can properly route requests from a main dashboard to the Outline self-hosted instance.

## 🚀 Quick Test (No Authentication)

For a quick test without authentication:

```bash
./test/quick-test.sh
```

This script will:
- Test proxy health endpoint
- Test services status endpoint  
- Test outline proxy endpoints (without auth)
- Show response times and status codes

## 🧪 Full Test (With Authentication)

For a comprehensive test that mimics real dashboard requests:

```bash
# Set your Supabase JWT token
export SUPABASE_JWT="your_jwt_token_here"

# Run the full test suite
node test/proxy-outline-test.js
```

### Test Scenarios

The full test includes these scenarios that mimic real dashboard requests:

1. **Dashboard → Outline Auth Info** (`/outline/api/auth.info`)
   - Main dashboard checking user authentication status in Outline

2. **Dashboard → Outline User Profile** (`/outline/api/users.info`)
   - Main dashboard fetching user profile from Outline

3. **Dashboard → Outline Documents List** (`/outline/api/documents.list`)
   - Main dashboard fetching user documents from Outline

4. **Dashboard → Outline Teams List** (`/outline/api/teams.list`)
   - Main dashboard fetching user teams from Outline

5. **Dashboard → Outline Health Check** (`/outline/health`)
   - Main dashboard checking Outline service health

6. **Dashboard → Outline Root** (`/outline`)
   - Main dashboard accessing Outline root (should redirect to dashboard)

### Environment Variables

You can customize the test by setting these environment variables:

```bash
export SUPABASE_JWT="your_jwt_token_here"
export PROXY_BASE_URL="http://localhost:8000"
export OUTLINE_TARGET_URL="http://localhost:3000"
```

## 📊 Expected Results

### ✅ Success Indicators

- **Health Check**: Returns proxy status and enabled services
- **Services Status**: Shows outline service as enabled
- **Auth Flow**: JWT authentication works (401 is expected for invalid tokens)
- **Proxy Flow**: Requests are forwarded to Outline (200, 401, or 404 responses)

### ❌ Failure Indicators

- **Connection Errors**: Proxy server not running
- **500 Errors**: Internal server errors in proxy
- **Service Not Found**: Outline service not properly configured
- **Path-to-regexp Errors**: Route parsing issues (should be fixed)

## 🔧 Troubleshooting

### Proxy Not Running
```bash
# Start the proxy server
pnpm dev
```

### Outline Not Running
```bash
# Start your Outline instance on localhost:3000
# or update OUTLINE_TARGET_URL in the test
```

### Authentication Issues
```bash
# Get a valid JWT from your Supabase dashboard
# or test without auth using the quick test script
```

## 📋 Test Output

The test scripts provide detailed output including:

- Request URLs and methods
- Response status codes and times
- Response headers and data (truncated)
- Success/failure indicators
- Error details if requests fail

This helps identify exactly where issues occur in the proxy flow. 