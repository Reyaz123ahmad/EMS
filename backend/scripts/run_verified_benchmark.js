import axios from 'axios';
import { performance } from 'perf_hooks';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'benchmark.employee@mindstocs.com';
const TEST_PASSWORD = 'Password@123';

async function resetTodayAttendance() {
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    include: { employee: true }
  });
  if (user && user.employee) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.attendanceBreak.deleteMany({ where: { employeeId: user.employee.id } });
    await prisma.attendanceLog.deleteMany({ where: { employeeId: user.employee.id, attendanceDate: today } });
    console.log('[SETUP] Cleared today attendance for benchmark employee.');
  }
}

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

async function run() {
  console.log('============================================================');
  console.log('STARTING COMPLETE 5-FLOW PERFORMANCE BENCHMARK');
  console.log('============================================================\n');

  await resetTodayAttendance();

  // 1. MEASURE LOGIN
  console.log('\n[1/5] Measuring Login (POST /api/v1/auth/login)...');
  const loginResult = await measureEndpoint('Login', () =>
    axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  );
  console.log(`-> Login Duration: ${loginResult.duration}ms | Status: ${loginResult.status}`);

  if (!loginResult.success) {
    console.error('Login failed! Aborting remaining tests.');
    process.exit(1);
  }

  const token = loginResult.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. MEASURE CHECK-IN CRYPTOGRAPHIC VERIFY
  console.log('\n[2/5] Measuring Check-in Verify (POST /api/v1/attendance/check-in)...');
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
  console.log(`-> Check-in Duration: ${checkInResult.duration}ms | Status: ${checkInResult.status}`);

  // 3. MEASURE START BREAK CRYPTOGRAPHIC VERIFY
  console.log('\n[3/5] Measuring Start Break (POST /api/v1/attendance/break-start)...');
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
  console.log(`-> Start Break Duration: ${breakStartResult.duration}ms | Status: ${breakStartResult.status}`);

  // 4. MEASURE END BREAK CRYPTOGRAPHIC VERIFY
  console.log('\n[4/5] Measuring End Break (POST /api/v1/attendance/break-end)...');
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
  console.log(`-> End Break Duration: ${breakEndResult.duration}ms | Status: ${breakEndResult.status}`);

  // 5. MEASURE CHECK-OUT CRYPTOGRAPHIC VERIFY
  console.log('\n[5/5] Measuring Check-out Verify (POST /api/v1/attendance/check-out)...');
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
  console.log(`-> Check-out Duration: ${checkOutResult.duration}ms | Status: ${checkOutResult.status}`);

  console.log('\n============================================================');
  console.log('FINAL BENCHMARK RESULTS');
  console.log('============================================================');

  const baselineMap = {
    'Login': '19,466ms',
    'Check-in verify': '27,574ms',
    'Start Break': '21,769ms',
    'End Break': '21,509ms',
    'Check-out verify': '20,935ms'
  };

  const results = [
    { action: 'Login', endpoint: 'POST /auth/login', time: loginResult.duration, target: '<2000ms', pass: loginResult.duration <= 2000 },
    { action: 'Check-in verify', endpoint: 'POST /attendance/check-in', time: checkInResult.duration, target: '<3000ms', pass: checkInResult.duration <= 3000 },
    { action: 'Check-out verify', endpoint: 'POST /attendance/check-out', time: checkOutResult.duration, target: '<3000ms', pass: checkOutResult.duration <= 3000 },
    { action: 'Start Break', endpoint: 'POST /attendance/break-start', time: breakStartResult.duration, target: '<3000ms', pass: breakStartResult.duration <= 3000 },
    { action: 'End Break', endpoint: 'POST /attendance/break-end', time: breakEndResult.duration, target: '<3000ms', pass: breakEndResult.duration <= 3000 }
  ];

  console.log('| Action           | Endpoint                      | Baseline | Measured (ms) | Target  | Status |');
  console.log('|------------------|-------------------------------|----------|---------------|---------|--------|');
  for (const r of results) {
    const base = baselineMap[r.action] || '-';
    console.log(`| ${r.action.padEnd(16)} | ${r.endpoint.padEnd(29)} | ${base.padEnd(8)} | ${(r.time + 'ms').padEnd(13)} | ${r.target.padEnd(7)} | ${r.pass ? 'PASS' : 'FAIL'} |`);
  }

  process.exit(0);
}

run();
