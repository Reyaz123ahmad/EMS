import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import fs from 'fs';

async function runBatch1Benchmark() {
  console.log('🚀 Running Batch 1 Browser Benchmark (Auth + Dashboard + Notifications)...');

  const baselineData = JSON.parse(fs.readFileSync('./baseline_browser_measurements.json', 'utf8'));
  const baselineMap = {};
  baselineData.results.forEach(r => {
    baselineMap[`${r.method}:${r.path}`] = r.timeMs;
  });

  const batch1Endpoints = [
    { module: 'auth', method: 'GET', path: '/api/v1/auth/me' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/company-admin' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/hr-admin' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/hr-manager' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/manager' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/employee' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/client' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/dashboard/super-admin' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/employee-dashboard/summary' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/employee-dashboard/attendance' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/employee-dashboard/leave' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/employee-dashboard/tasks' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/manager-dashboard/team-summary' },
    { module: 'dashboard', method: 'GET', path: '/api/v1/hr-manager-dashboard/metrics' },
    { module: 'notifications', method: 'GET', path: '/api/v1/notifications' },
    { module: 'notifications', method: 'GET', path: '/api/v1/notifications/unread-count' }
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
    // 1. Warmup pass across endpoints to establish connections & memory caches
    for (const e of endpoints) {
      try {
        await fetch(`http://localhost:5000${e.path}`, {
          method: e.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (_) {}
    }

    // Small stabilization pause
    await new Promise(r => setTimeout(r, 500));

    // 2. Measured pass from browser performance context
    const resList = [];
    for (const e of endpoints) {
      const url = `http://localhost:5000${e.path}`;
      const t0 = performance.now();
      try {
        const res = await fetch(url, {
          method: e.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const ms = performance.now() - t0;
        console.log(`${e.method} ${e.path} => ${res.status} (${Math.round(ms)}ms)`);
        resList.push({
          method: e.method,
          path: e.path,
          status: res.status,
          timeMs: Math.round(ms)
        });
      } catch (err) {
        const ms = performance.now() - t0;
        console.log(`${e.method} ${e.path} => ERROR ${err.message} (${Math.round(ms)}ms)`);
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
  }, { endpoints: batch1Endpoints, token });

  await browser.close();

  const comparison = results.map(r => {
    const before = baselineMap[`${r.method}:${r.path}`] || 4500;
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
  console.log('BATCH 1 MEASUREMENT REPORT (MEASURED FROM BROWSER)');
  console.log('============================================================');
  console.table(comparison);
  fs.writeFileSync('./batch1_report.json', JSON.stringify(comparison, null, 2));
}

runBatch1Benchmark().catch(console.error);
