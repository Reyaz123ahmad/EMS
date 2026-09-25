const BASE_URL = 'http://localhost:5000/api/v1';

async function runAuthSecurityTests() {
  console.log('[Security Test] Running Auth & Token Verification Security Tests...');
  let passed = 0;
  let failed = 0;

  // 1. Unauthorized request without token
  const res1 = await fetch(`${BASE_URL}/employees`);
  if (res1.status === 401 || res1.status === 403) {
    console.log('✅ [PASS] Rejection on missing Authorization header');
    passed++;
  } else {
    console.error(`❌ [FAIL] Missing token did not return 401 (got ${res1.status})`);
    failed++;
  }

  // 2. Request with invalid/tampered token
  const res2 = await fetch(`${BASE_URL}/employees`, {
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' },
  });
  if (res2.status === 401 || res2.status === 403) {
    console.log('✅ [PASS] Rejection on forged JWT signature');
    passed++;
  } else {
    console.error(`❌ [FAIL] Tampered token did not return 401 (got ${res2.status})`);
    failed++;
  }

  console.log(`[Security Test - Auth] Summary: Passed: ${passed}, Failed: ${failed}`);
  return { passed, failed };
}

if (process.argv[1]?.endsWith('auth.security.test.js')) {
  runAuthSecurityTests();
}

export default runAuthSecurityTests;
