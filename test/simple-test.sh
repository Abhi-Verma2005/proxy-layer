#!/bin/bash

# Simple test script for real user flow
# Usage: ./test/simple-test.sh

PROXY_URL="http://localhost:8000"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IlNncVZIZE9mQ3ZJQjlLQ3oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3JuZ3d6c2lidmV0YWJpZ3Z3dnBjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmY2E0NDVjMi0zMTdjLTQxZTctYTkxZS1jOGEzYTY0NDJjYTQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyOTIxMjE4LCJpYXQiOjE3NTI5MTc2MTgsImVtYWlsIjoiYWJoaXNoZWsudmVybWEyMDI0QG5zdC5yaXNoaWhvb2QuZWR1LmluIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFiaGlzaGVrLnZlcm1hMjAyNEBuc3QucmlzaGlob29kLmVkdS5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiSm9kZCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmNhNDQ1YzItMzE3Yy00MWU3LWE5MWUtYzhhM2E2NDQyY2E0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTI5MTc2MTh9XSwic2Vzc2lvbl9pZCI6ImFkM2FjODczLTJlYWMtNGExMy1iMTdmLWJhYzAyNzFjNDYwMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.hUraacof8GEW3XVOQfIpPquzuOb0yUGZOMhxG1QA3QI"

echo "🚀 Testing Real User Flow with curl"
echo "👤 Simulating: User clicks on localhost:8000/outline with token"
echo "🔐 Using JWT: Yes"
echo "⏰ Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Test 1: User clicks on /outline (browser navigation)
echo "📄 Test 1: User clicks on /outline (Browser Navigation)"
echo "🌐 URL: $PROXY_URL/outline"
echo "📋 Method: GET"
echo "🔧 Headers: Real browser headers"
echo ""

curl -s -w "\n⏱️  Status: %{http_code}, Time: %{time_total}s\n" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.5" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Upgrade-Insecure-Requests: 1" \
  -H "Cache-Control: max-age=0" \
  "$PROXY_URL/outline"

echo ""
echo ""

# Test 2: User makes API call to /outline/api/auth.info (AJAX)
echo "📄 Test 2: User makes API call to /outline/api/auth.info (AJAX)"
echo "🌐 URL: $PROXY_URL/outline/api/auth.info"
echo "📋 Method: GET"
echo "🔧 Headers: Real API headers"
echo ""

curl -s -w "\n⏱️  Status: %{http_code}, Time: %{time_total}s\n" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/plain, */*" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "$PROXY_URL/outline/api/auth.info"

echo ""
echo ""

# Test 3: User makes API call to /outline/health (AJAX)
echo "📄 Test 3: User makes API call to /outline/health (AJAX)"
echo "🌐 URL: $PROXY_URL/outline/health"
echo "📋 Method: GET"
echo "🔧 Headers: Real API headers"
echo ""

curl -s -w "\n⏱️  Status: %{http_code}, Time: %{time_total}s\n" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/plain, */*" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "$PROXY_URL/outline/health"

echo ""
echo ""

echo "🏁 Real user flow test completed!"
echo ""
echo "📊 Summary:"
echo "   - Test 1: Browser navigation to /outline"
echo "   - Test 2: AJAX call to /outline/api/auth.info"
echo "   - Test 3: AJAX call to /outline/health"
echo ""
echo "💡 Check the proxy server logs to see the injected headers!" 