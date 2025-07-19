#!/bin/bash

# Quick test script for proxy layer
# Usage: ./quick-test.sh

PROXY_URL="http://localhost:8000"
OUTLINE_URL="http://localhost:3000"

echo "🚀 Quick Proxy Layer Test"
echo "📡 Proxy URL: $PROXY_URL"
echo "🎯 Outline URL: $OUTLINE_URL"
echo ""

# Test 1: Health check
echo "🏥 Testing proxy health..."
curl -s "$PROXY_URL/health" | jq '.' 2>/dev/null || curl -s "$PROXY_URL/health"

echo ""
echo "📋 Testing services status..."
curl -s "$PROXY_URL/services" | jq '.' 2>/dev/null || curl -s "$PROXY_URL/services"

echo ""
echo "🧪 Testing outline proxy (without auth)..."
echo "📄 Testing /outline endpoint:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" "$PROXY_URL/outline" -o /dev/null

echo ""
echo "📄 Testing /outline/health endpoint:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" "$PROXY_URL/outline/health" -o /dev/null

echo ""
echo "📄 Testing /outline/api/auth.info endpoint:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" "$PROXY_URL/outline/api/auth.info" -o /dev/null

echo ""
echo "🏁 Quick test completed!"
echo "💡 For full testing with authentication, run: node test/proxy-outline-test.js" 