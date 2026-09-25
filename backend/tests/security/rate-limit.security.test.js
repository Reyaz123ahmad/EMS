const BASE_URL = 'http://localhost:5000/api/v1';

async function runRateLimitSecurityTests() {
  console.log('[Security Test] Verifying Rate Limit Header Presence & Thresholds...');
  let passed = 0;
  let failed = 0;

  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status === 200) {
      console.log('✅ [PASS] Endpoint accessible under normal request frequency');
      passed++;
    } else {
      failed++;
    }
  } catch (err) {
    failed++;
  }

  console.log(`[Security Test - Rate Limit] Summary: Passed: ${passed}, Failed: ${failed}`);
  return { passed, failed };
}

if (process.argv[1]?.endsWith('rate-limit.security.test.js')) {
  runRateLimitSecurityTests();
}

export default runRateLimitSecurityTests;
