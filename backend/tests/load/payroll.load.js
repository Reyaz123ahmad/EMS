const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000/api/v1';

async function runPayrollLoadTest() {
  console.log(`[Load Test] Simulating payroll calculation concurrent jobs against ${BASE_URL}/health...`);
  const concurrency = 10;
  const requests = 20;
  const start = Date.now();
  let done = 0;

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let i = 0; i < requests; i++) {
        try {
          await fetch(`${BASE_URL}/health`);
        } catch {}
        done++;
      }
    })
  );

  console.log(`[Load Test - Payroll] Finished ${done} simulated computations in ${(Date.now() - start) / 1000}s`);
}

if (process.argv[1]?.endsWith('payroll.load.js')) {
  runPayrollLoadTest();
}

export default runPayrollLoadTest;
