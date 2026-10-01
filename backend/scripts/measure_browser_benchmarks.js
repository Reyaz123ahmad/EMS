import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'benchmark.employee@mindstocs.com';
const TEST_PASSWORD = 'Password@123';

async function measure(name, fn) {
  const t0 = performance.now();
  const res = await fn();
  const ms = Math.round(performance.now() - t0);
  return { name, ms, status: res.status, data: res.data };
}

async function main() {
  console.log('============================================================');
  console.log('MEASURING 5 FLOWS FROM BROWSER-EQUIVALENT NETWORK PIPELINE');
  console.log('============================================================\n');

  // 1. LOGIN
  console.log('1. Measuring Login (POST /api/v1/auth/login)...');
  const login = await measure('Login', () =>
    axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  );
  const token = login.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log(`-> Login Duration: ${login.ms}ms (Status: ${login.status})`);

  // 2. CHECK-IN (Cryptographic Verification)
  console.log('\n2. Measuring Check-in Verify (POST /api/v1/attendance/check-in)...');
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
  console.log(`-> Check-in Duration: ${checkIn.ms}ms (Status: ${checkIn.status})`);

  // 3. START BREAK (Cryptographic Verification)
  console.log('\n3. Measuring Start Break (POST /api/v1/attendance/break-start)...');
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
  console.log(`-> Start Break Duration: ${startBreak.ms}ms (Status: ${startBreak.status})`);

  // 4. END BREAK (Cryptographic Verification)
  console.log('\n4. Measuring End Break (POST /api/v1/attendance/break-end)...');
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
  console.log(`-> End Break Duration: ${endBreak.ms}ms (Status: ${endBreak.status})`);

  // 5. CHECK-OUT (Cryptographic Verification)
  console.log('\n5. Measuring Check-out Verify (POST /api/v1/attendance/check-out)...');
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
  console.log(`-> Check-out Duration: ${checkOut.ms}ms (Status: ${checkOut.status})`);

  console.log('\n============================================================');
  console.log('FINAL BENCHMARK TABLE');
  console.log('============================================================');
  console.log('| Action           | Endpoint                      | Baseline | Measured | Target  | Status |');
  console.log('|------------------|-------------------------------|----------|----------|---------|--------|');
  console.log(`| Login            | POST /auth/login              | 19,466ms | ${login.ms}ms | <2000ms | ${login.ms <= 2000 ? 'PASS' : 'FAIL'} |`);
  console.log(`| Check-in verify  | POST /attendance/check-in     | 27,574ms | ${checkIn.ms}ms | <3000ms | ${checkIn.ms <= 3000 ? 'PASS' : 'FAIL'} |`);
  console.log(`| Check-out verify | POST /attendance/check-out    | 20,935ms | ${checkOut.ms}ms | <3000ms | ${checkOut.ms <= 3000 ? 'PASS' : 'FAIL'} |`);
  console.log(`| Start Break      | POST /attendance/break-start  | 21,769ms | ${startBreak.ms}ms | <3000ms | ${startBreak.ms <= 3000 ? 'PASS' : 'FAIL'} |`);
  console.log(`| End Break        | POST /attendance/break-end    | 21,509ms | ${endBreak.ms}ms | <3000ms | ${endBreak.ms <= 3000 ? 'PASS' : 'FAIL'} |`);

  process.exit(0);
}

main();
