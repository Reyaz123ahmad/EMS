#!/usr/bin/env bash
# ==============================================================================
# Multi-Instance Health Verification Script
# ==============================================================================

set -e

FAILED=0
PORTS=(5000 5001 5002 5003)

echo "🔍 Starting EMS multi-instance health check..."

# 1. Check each backend instance
for PORT in "${PORTS[@]}"; do
  echo -n "Checking Backend Instance on Port ${PORT}... "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/api/v1/health" || echo "FAIL")
  if [ "$STATUS" == "200" ]; then
    echo "✅ [200 OK]"
  else
    echo "❌ [FAILED - Status: ${STATUS}]"
    FAILED=$((FAILED + 1))
  fi
done

# 2. Check Nginx Service Status
echo -n "Checking Nginx reverse proxy service... "
if systemctl is-active --quiet nginx; then
  echo "✅ [ACTIVE]"
else
  echo "❌ [INACTIVE or DOWN]"
  FAILED=$((FAILED + 1))
fi

# 3. Check External/Loopback Load Balancer API
echo -n "Checking Nginx Gateway Load Balancer Endpoint (/api/v1/health)... "
LB_STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "http://127.0.0.1/api/v1/health" || echo "FAIL")
if [ "$LB_STATUS" == "200" ]; then
  echo "✅ [200 OK]"
else
  echo "⚠️ [Gateway status: ${LB_STATUS}] (Verify domain/HTTPS bindings if running locally)"
fi

echo "------------------------------------------------------------"
if [ "$FAILED" -eq 0 ]; then
  echo "🎉 All backend cluster instances and services are HEALTHY!"
  exit 0
else
  echo "🚨 CRITICAL: ${FAILED} health checks failed!"
  exit 1
fi
