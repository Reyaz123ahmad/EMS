import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import fs from 'fs';

async function runBatch3Benchmark() {
  console.log('🚀 Running Batch 3 Browser Benchmark (Payroll & Overtime)...');

  const baselineData = JSON.parse(fs.readFileSync('./baseline_browser_measurements.json', 'utf8'));
  const baselineMap = {};
  baselineData.results.forEach(r => {
    baselineMap[`${r.method}:${r.path}`] = r.timeMs;
  });

  const batch3Endpoints = [
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/components' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/salary-structures/templates' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/templates' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/salary-structures' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/structures' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/structure/2ad5332a-f6fb-4811-a8cd-9ebcade5a927' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/employee/2ad5332a-f6fb-4811-a8cd-9ebcade5a927/structure' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/reimbursements' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/loans-advances' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/loans' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/tax-slabs' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/analytics' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/runs' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/slips/my' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/slips' },
    { module: 'payroll', method: 'GET', path: '/api/v1/payroll/stats' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/rules' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/my' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/my-records' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/records' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/report' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/stats' },
    { module: 'overtime', method: 'GET', path: '/api/v1/overtime/requests' }
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
  }, { endpoints: batch3Endpoints, token });

  await browser.close();

  const comparison = results.map(r => {
    let baselineKey = `${r.method}:${r.path}`;
    if (r.path.includes('/payroll/structure/')) {
      baselineKey = 'GET:/api/v1/payroll/structure/:employeeId';
    } else if (r.path.includes('/payroll/employee/')) {
      baselineKey = 'GET:/api/v1/payroll/employee/:employeeId/structure';
    }
    const before = baselineMap[baselineKey] ? `${baselineMap[baselineKey]}ms` : 'N/A';
    const after = `${r.timeMs}ms`;
    const passed = r.timeMs < 2000;
    return {
      Endpoint: r.path,
      Method: r.method,
      'Before (ms)': before,
      'After (ms)': after,
      Target: '< 2000ms',
      Status: passed ? 'PASS ✅' : 'FAIL ❌'
    };
  });

  console.log('\n============================================================');
  console.log('BATCH 3 MEASUREMENT REPORT (MEASURED FROM BROWSER)');
  console.log('============================================================');
  console.table(comparison);

  fs.writeFileSync('./batch3_report.json', JSON.stringify(comparison, null, 2));
  console.log('\nSaved report to ./batch3_report.json');
}

runBatch3Benchmark().catch(console.error);
