const BASE_URL = 'http://localhost:5000/api/v1';

async function runInjectionSecurityTests() {
  console.log('[Security Test] Testing SQL & NoSQL Injection Resilience...');
  let passed = 0;
  let failed = 0;

  const sqlPayloads = [
    "' OR '1'='1",
    "1; DROP TABLE users; --",
    "admin' --",
    "' UNION SELECT null, null, null --",
  ];

  const { getSuperAdminToken } = await import('../helpers/auth.helper.js');
  const { authHeader } = getSuperAdminToken();

  for (const payload of sqlPayloads) {
    try {
      const res = await fetch(`${BASE_URL}/companies?search=${encodeURIComponent(payload)}`, {
        headers: { Authorization: authHeader }
      });
      // It should safely respond 200 with 0 matches or 400 validation error, never 500 SQL crash
      if (res.status === 200 || res.status === 400 || res.status === 404) {
        console.log(`✅ [PASS] SQL Injection payload handled safely: ${payload}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] Server threw unexpected status for payload ${payload}: ${res.status}`);
        failed++;
      }
    } catch (err) {
      failed++;
    }
  }

  console.log(`[Security Test - Injection] Summary: Passed: ${passed}, Failed: ${failed}`);
  return { passed, failed };
}

if (process.argv[1]?.endsWith('injection.security.test.js')) {
  runInjectionSecurityTests();
}

export default runInjectionSecurityTests;
