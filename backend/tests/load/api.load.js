/**
 * Autocannon / k6 Load Testing Script for EMS High-Throughput APIs
 */
const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000/api/v1';

async function runLoadTest() {
  console.log(`[Load Test] Initiating load test against ${BASE_URL}...`);
  const concurrency = 20;
  const requestsPerWorker = 50;
  const startTime = Date.now();
  let completed = 0;
  let success = 0;

  async function worker() {
    for (let i = 0; i < requestsPerWorker; i++) {
      try {
        const res = await fetch(`${BASE_URL}/health`);
        if (res.ok) success++;
      } catch (err) {
        // Log worker error
      } finally {
        completed++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationSec = (Date.now() - startTime) / 1000;
  const rps = (completed / durationSec).toFixed(2);

  console.log(`[Load Test] Finished: Total Requests: ${completed}, Successful: ${success}, Duration: ${durationSec}s, RPS: ${rps}`);
}

if (process.argv[1]?.endsWith('api.load.js')) {
  runLoadTest();
}

export default runLoadTest;
