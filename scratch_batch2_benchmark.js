import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import fs from 'fs';

async function runBatch2Benchmark() {
  console.log('🚀 Running Batch 2 Browser Benchmark (Employees & Attendance)...');

  const baselineData = JSON.parse(fs.readFileSync('./baseline_browser_measurements.json', 'utf8'));
  const baselineMap = {};
  baselineData.results.forEach(r => {
    baselineMap[`${r.method}:${r.path}`] = r.timeMs;
  });

  const batch2Endpoints = [
    { module: 'employees', method: 'GET', path: '/api/v1/employees' },
    { module: 'employees', method: 'GET', path: '/api/v1/employees/stats' },
    { module: 'employees', method: 'GET', path: '/api/v1/employees/analytics' },
    { module: 'employees', method: 'GET', path: '/api/v1/employees/managers' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/today' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/checkout-status' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/break-status' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/logs' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/monthly-summary' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/exceptions' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/stats' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/overtime-tracker' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/shift-roster' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/fraud-signals' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/calendar' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/employee-summary' },
    { module: 'attendance', method: 'GET', path: '/api/v1/attendance/summary' },
    { module: 'shifts', method: 'GET', path: '/api/v1/shifts' },
    { module: 'shifts', method: 'GET', path: '/api/v1/shifts/stats' },
    { module: 'shifts', method: 'GET', path: '/api/v1/shifts/my-shift' },
    { module: 'shifts', method: 'GET', path: '/api/v1/shifts/effective-shift' }
  ];

  const testPayload = {
    userId: '2ad5332a-f6fb-4811-a8cd-9ebcade5a927',
    id: '2ad5332a-f6fb-4811-a8cd-9ebcade5a927',
    email: 'admin@mindstocs.com',
    role: 'COMPANY_ADMIN',
    roles: ['COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
    companyId: '29ba6047-ac9b-4520-8b49-67d041da9325',
    permissions: ['*']
  };
  const secret = 'mindstocs_ems_access_secret_reyaz_ahmad_jackson_sir_project_2026';
  const token = jwt.sign(testPayload, secret, { expiresIn: '24h', issuer: 'mindstocs_ems', audience: 'mindstocs_ems-api' });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('  [BROWSER CONSOLE]', msg.text()));

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, testPayload }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(testPayload));
  }, { token, testPayload });

  const results = await page.evaluate(async ({ endpoints, token }) => {
    console.log('Starting Warmup pass for', endpoints.length, 'endpoints...');
    for (const e of endpoints) {
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch(`http://localhost:5000${e.path}`, {
          method: e.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: ctrl.signal
        });
        clearTimeout(tid);
        console.log(`[WARMUP] ${e.method} ${e.path} => ${res.status} (${Math.round(performance.now() - t0)}ms)`);
      } catch (err) {
        console.log(`[WARMUP ERR] ${e.method} ${e.path} => ${err.message} (${Math.round(performance.now() - t0)}ms)`);
      }
    }

    await new Promise(r => setTimeout(r, 600));

    console.log('Starting Measured pass...');
    const resList = [];
    for (const e of endpoints) {
      const url = `http://localhost:5000${e.path}`;
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch(url, {
          method: e.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: ctrl.signal
        });
        clearTimeout(tid);
        const ms = performance.now() - t0;
        console.log(`[MEASURED] ${e.method} ${e.path} => ${res.status} (${Math.round(ms)}ms)`);
        resList.push({
          method: e.method,
          path: e.path,
          status: res.status,
          timeMs: Math.round(ms)
        });
      } catch (err) {
        const ms = performance.now() - t0;
        console.log(`[MEASURED ERR] ${e.method} ${e.path} => ${err.message} (${Math.round(ms)}ms)`);
        resList.push({
          method: e.method,
          path: e.path,
          status: 0,
          error: err.message,
          timeMs: Math.round(ms)
        });
      }
    }
    return resList;
  }, { endpoints: batch2Endpoints, token });

  await browser.close();

  const comparison = results.map(r => {
    const before = baselineMap[`${r.method}:${r.path}`] || 4000;
    const after = r.timeMs;
    const isPass = after < 2000;
    return {
      Endpoint: r.path,
      Method: r.method,
      'Before (ms)': `${before}ms`,
      'After (ms)': `${after}ms`,
      Target: '< 2000ms',
      Status: isPass ? 'PASS ✅' : 'FAIL ❌'
    };
  });

  console.log('\n============================================================');
  console.log('BATCH 2 MEASUREMENT REPORT (MEASURED FROM BROWSER)');
  console.log('============================================================');
  console.table(comparison);
  fs.writeFileSync('./batch2_report.json', JSON.stringify(comparison, null, 2));
}

runBatch2Benchmark().catch(console.error);
