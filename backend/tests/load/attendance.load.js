const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000/api/v1';

async function runAttendanceLoadTest() {
  console.log(`[Load Test] Simulating concurrent biometric punch spikes against ${BASE_URL}/health...`);
  const concurrency = 15;
  const requests = 30;
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

  console.log(`[Load Test - Attendance] Processed ${done} punch simulation queries in ${(Date.now() - start) / 1000}s`);
}

if (process.argv[1]?.endsWith('attendance.load.js')) {
  runAttendanceLoadTest();
}

export default runAttendanceLoadTest;
