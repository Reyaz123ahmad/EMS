import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'benchmark.employee@mindstocs.com';
const TEST_PASSWORD = 'Password@123';

async function measureEndpoint(name, requestFn) {
  const start = performance.now();
  try {
    const res = await requestFn();
    const duration = Math.round(performance.now() - start);
    return { name, duration, status: res.status, data: res.data, success: true };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return {
      name,
      duration,
      status: err.response?.status || 500,
      error: err.response?.data?.message || err.message,
      success: false
    };
  }
}

async function benchmark() {
  console.log('============================================================');
  console.log('BENCHMARKING 5 TARGET FLOWS');
  console.log('============================================================\n');

  // 1. MEASURE LOGIN (Warm & Fast)
  console.log('1. Measuring Login (POST /api/v1/auth/login)...');
  const loginResult = await measureEndpoint('Login', () =>
    axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  );
  console.log(`-> Login: ${loginResult.duration}ms | Status: ${loginResult.status}`);

  if (!loginResult.success) {
    console.error('Login failed, exiting:', loginResult.error);
    return;
  }

  const token = loginResult.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. MEASURE CHECK-IN (Cryptographic Verification)
  console.log('\n2. Measuring Check-in Verify (POST /api/v1/attendance/check-in)...');
  const checkInResult = await measureEndpoint('Check-in verify', () =>
    axios.post(
      `${BASE_URL}/attendance/check-in`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders }
    )
  );
  console.log(`-> Check-in verify: ${checkInResult.duration}ms | Status: ${checkInResult.status} | Msg: ${checkInResult.data?.message || checkInResult.error}`);

  // 3. MEASURE START BREAK (Cryptographic Verification)
  console.log('\n3. Measuring Start Break (POST /api/v1/attendance/break-start)...');
  const breakStartResult = await measureEndpoint('Start Break', () =>
    axios.post(
      `${BASE_URL}/attendance/break-start`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        breakType: 'SHORT',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders }
    )
  );
  console.log(`-> Start Break: ${breakStartResult.duration}ms | Status: ${breakStartResult.status} | Msg: ${breakStartResult.data?.message || breakStartResult.error}`);

  // 4. MEASURE END BREAK (Cryptographic Verification)
  console.log('\n4. Measuring End Break (POST /api/v1/attendance/break-end)...');
  const breakEndResult = await measureEndpoint('End Break', () =>
    axios.post(
      `${BASE_URL}/attendance/break-end`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders }
    )
  );
  console.log(`-> End Break: ${breakEndResult.duration}ms | Status: ${breakEndResult.status} | Msg: ${breakEndResult.data?.message || breakEndResult.error}`);

  // 5. MEASURE CHECK-OUT (Cryptographic Verification)
  console.log('\n5. Measuring Check-out Verify (POST /api/v1/attendance/check-out)...');
  const checkOutResult = await measureEndpoint('Check-out verify', () =>
    axios.post(
      `${BASE_URL}/attendance/check-out`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders }
    )
  );
  console.log(`-> Check-out verify: ${checkOutResult.duration}ms | Status: ${checkOutResult.status} | Msg: ${checkOutResult.data?.message || checkOutResult.error}`);

  console.log('\n============================================================');
  console.log('RESULTS FOR TARGET PERFORMANCE CRITERIA');
  console.log('============================================================');
  const results = [
    { action: 'Login', endpoint: 'POST /auth/login', time: loginResult.duration, target: '<2000ms', pass: loginResult.duration <= 2000 },
    { action: 'Check-in verify', endpoint: 'POST /attendance/check-in', time: checkInResult.duration, target: '<3000ms', pass: checkInResult.duration <= 3000 },
    { action: 'Start Break', endpoint: 'POST /attendance/break-start', time: breakStartResult.duration, target: '<3000ms', pass: breakStartResult.duration <= 3000 },
    { action: 'End Break', endpoint: 'POST /attendance/break-end', time: breakEndResult.duration, target: '<3000ms', pass: breakEndResult.duration <= 3000 },
    { action: 'Check-out verify', endpoint: 'POST /attendance/check-out', time: checkOutResult.duration, target: '<3000ms', pass: checkOutResult.duration <= 3000 }
  ];

  console.log('| Action           | Endpoint                      | Measured (ms) | Target  | Status |');
  console.log('|------------------|-------------------------------|---------------|---------|--------|');
  for (const r of results) {
    console.log(`| ${r.action.padEnd(16)} | ${r.endpoint.padEnd(29)} | ${r.time.toString().padEnd(13)} | ${r.target.padEnd(7)} | ${r.pass ? 'PASS' : 'OPTIMIZING'} |`);
  }
}

benchmark();
