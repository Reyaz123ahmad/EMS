import runAuthSecurityTests from './security/auth.security.test.js';
import runInjectionSecurityTests from './security/injection.security.test.js';
import runXssSecurityTests from './security/xss.security.test.js';
import runRateLimitSecurityTests from './security/rate-limit.security.test.js';
import runLoadTest from './load/api.load.js';

async function runAllTests() {
  console.log('====================================================');
  console.log('--- EXECUTING COMPLETE EMS BACKEND TEST SUITE ---');
  console.log('====================================================');

  console.log('\n>>> 1. RUNNING SECURITY SUITE <<<');
  await runAuthSecurityTests();
  await runInjectionSecurityTests();
  await runXssSecurityTests();
  await runRateLimitSecurityTests();

  console.log('\n>>> 2. RUNNING PERFORMANCE LOAD TEST <<<');
  await runLoadTest();

  console.log('\n>>> 3. EXECUTING INTEGRATION API SUITE <<<');
  const { execSync } = await import('child_process');
  execSync('node tests/run-phase-5b.js', { stdio: 'inherit' });

  console.log('\n====================================================');
  console.log('--- ALL BACKEND TEST SUITES COMPLETED SUCCESSFULLY ---');
  console.log('====================================================');
}

runAllTests();
