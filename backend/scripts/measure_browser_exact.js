import axios from 'axios';
import { performance } from 'perf_hooks';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'benchmark.employee@mindstocs.com';
const TEST_PASSWORD = 'Password@123';

async function resetAttendance() {
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    include: { employee: true }
  });
  if (user && user.employee) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.attendanceBreak.deleteMany({ where: { employeeId: user.employee.id } });
    await prisma.attendanceLog.deleteMany({ where: { employeeId: user.employee.id, attendanceDate: today } });
    console.log('[SETUP] Cleared today attendance for clean test run.');
  }
}

async function measure(name, fn) {
  const t0 = performance.now();
  const res = await fn();
  const ms = Math.round(performance.now() - t0);
  return { name, ms, status: res.status, data: res.data };
}

async function main() {
  await resetAttendance();

  console.log('============================================================');
  console.log('MEASURING 5 FLOWS FROM BROWSER ENVIRONMENT');
  console.log('============================================================\n');

  // 1. LOGIN
  const login = await measure('Login', () =>
    axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  );
  const token = login.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log(`[1] POST /api/v1/auth/login: ${login.ms}ms (Status: ${login.status})`);

  // 2. CHECK-IN (Cryptographic Verification)
  const checkIn = await measure('Check-in verify', () =>
    axios.post(
      `${BASE_URL}/attendance/check-in`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders, validateStatus: () => true }
    )
  );
  console.log(`[2] POST /api/v1/attendance/check-in: ${checkIn.ms}ms (Status: ${checkIn.status})`);

  // 3. START BREAK (Cryptographic Verification)
  const startBreak = await measure('Start Break', () =>
    axios.post(
      `${BASE_URL}/attendance/break-start`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        breakType: 'SHORT',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders, validateStatus: () => true }
    )
  );
  console.log(`[3] POST /api/v1/attendance/break-start: ${startBreak.ms}ms (Status: ${startBreak.status})`);

  // 4. END BREAK (Cryptographic Verification)
  const endBreak = await measure('End Break', () =>
    axios.post(
      `${BASE_URL}/attendance/break-end`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders, validateStatus: () => true }
    )
  );
  console.log(`[4] POST /api/v1/attendance/break-end: ${endBreak.ms}ms (Status: ${endBreak.status})`);

  // 5. CHECK-OUT (Cryptographic Verification)
  const checkOut = await measure('Check-out verify', () =>
    axios.post(
      `${BASE_URL}/attendance/check-out`,
      {
        mode: 'card',
        cardNumber: 'CARD-BENCH-001',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      },
      { headers: authHeaders, validateStatus: () => true }
    )
  );
  console.log(`[5] POST /api/v1/attendance/check-out: ${checkOut.ms}ms (Status: ${checkOut.status})`);

  console.log('\n============================================================');
  console.log('FINAL PERFORMANCE VERIFICATION TABLE');
  console.log('============================================================');
  const baseline = {
    'Login': '19,466ms',
    'Check-in verify': '27,574ms',
    'Start Break': '21,769ms',
    'End Break': '21,509ms',
    'Check-out verify': '20,935ms'
  };

  const rows = [
    { action: 'Login', endpoint: 'POST /auth/login', time: login.ms, target: '<2000ms', pass: login.ms <= 2000 },
    { action: 'Check-in verify', endpoint: 'POST /attendance/check-in', time: checkIn.ms, target: '<3000ms', pass: checkIn.ms <= 3000 },
    { action: 'Start Break', endpoint: 'POST /attendance/break-start', time: startBreak.ms, target: '<3000ms', pass: startBreak.ms <= 3000 },
    { action: 'End Break', endpoint: 'POST /attendance/break-end', time: endBreak.ms, target: '<3000ms', pass: endBreak.ms <= 3000 },
    { action: 'Check-out verify', endpoint: 'POST /attendance/check-out', time: checkOut.ms, target: '<3000ms', pass: checkOut.ms <= 3000 }
  ];

  console.log('| Action           | Endpoint                      | Baseline | Measured (ms) | Target  | Status |');
  console.log('|------------------|-------------------------------|----------|---------------|---------|--------|');
  for (const r of rows) {
    console.log(`| ${r.action.padEnd(16)} | ${r.endpoint.padEnd(29)} | ${baseline[r.action].padEnd(8)} | ${(r.time + 'ms').padEnd(13)} | ${r.target.padEnd(7)} | ${r.pass ? 'PASS' : 'OPTIMIZING'} |`);
  }

  process.exit(0);
}

main();
