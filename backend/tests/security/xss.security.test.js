import { sanitizeInput } from '../../src/middlewares/security.middleware.js';

async function runXssSecurityTests() {
  console.log('[Security Test] Testing Cross-Site Scripting (XSS) Sanitization...');
  let passed = 0;
  let failed = 0;

  const mockReq = {
    body: {
      name: '<script>alert("xss")</script>John Doe',
      nested: {
        bio: '<img src=x onerror=alert(1)>Software Engineer',
      },
    },
  };

  sanitizeInput(mockReq, {}, () => {});

  if (!mockReq.body.name.includes('<script>') && !mockReq.body.nested.bio.includes('onerror=')) {
    console.log('✅ [PASS] XSS vectors sanitized before processing');
    passed++;
  } else {
    console.error('❌ [FAIL] XSS vectors were not stripped by sanitizer');
    failed++;
  }

  console.log(`[Security Test - XSS] Summary: Passed: ${passed}, Failed: ${failed}`);
  return { passed, failed };
}

if (process.argv[1]?.endsWith('xss.security.test.js')) {
  runXssSecurityTests();
}

export default runXssSecurityTests;
