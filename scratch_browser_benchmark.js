import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import fs from 'fs';

async function runBenchmark() {
  console.log('🚀 Starting Browser-Based API Performance Benchmark...');

  const inventory = JSON.parse(fs.readFileSync('./endpoint_inventory.json', 'utf8'));
  console.log(`Loaded ${inventory.length} total endpoints from inventory.`);

  // Generate test admin token
  const testPayload = {
    userId: '2ad5332a-f6fb-4811-a8cd-9ebcade5a927',
    email: 'admin@mindstocs.com',
    roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'],
    companyId: '29ba6047-ac9b-4520-8b49-67d041da9325',
    permissions: ['*']
  };
  const secret = 'mindstocs_ems_access_secret_reyaz_ahmad_jackson_sir_project_2026';
  const token = jwt.sign(testPayload, secret, { expiresIn: '24h', issuer: 'mindstocs_ems', audience: 'mindstocs_ems-api' });
  console.log('🔑 Generated benchmark authorization token.');

  // Launch real Chromium browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Forward console messages
  page.on('console', msg => {
    if (msg.text().startsWith('[BENCHMARK]')) {
      console.log(msg.text());
    }
  });

  // Navigate to root to initialize browser origin context
  console.log('🌐 Opening http://localhost:3000 in Chromium...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });

  // Set token in localStorage inside the browser context
  await page.evaluate(({ token, testPayload }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: testPayload.userId,
      email: testPayload.email,
      roles: testPayload.roles,
      companyId: testPayload.companyId
    }));
  }, { token, testPayload });

  // 1. Measure major UI page rendering and initial network fetches
  const pagesToVisit = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Employees', path: '/employees' },
    { name: 'Attendance Logs', path: '/attendance/logs' },
    { name: 'Shift Roster', path: '/attendance/shift-roster' },
    { name: 'Leave Applications', path: '/leave/applications' },
    { name: 'Payroll Run', path: '/payroll/run' },
    { name: 'Salary Structures', path: '/payroll/salary-structures' },
    { name: 'Projects', path: '/projects' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
    { name: 'Notifications', path: '/notifications' }
  ];

  console.log('\n--- 🧭 MEASURING UI PAGES FROM BROWSER NETWORK ---');
  const uiPageMetrics = [];

  for (const p of pagesToVisit) {
    const t0 = Date.now();
    try {
      await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(200);
      const loadTime = Date.now() - t0;
      console.log(`PAGE: ${p.name.padEnd(22)} | Time: ${loadTime}ms`);
      uiPageMetrics.push({ page: p.name, path: p.path, timeMs: loadTime });
    } catch (err) {
      console.log(`PAGE: ${p.name.padEnd(22)} | Note: ${err.message.split('\n')[0]}`);
    }
  }

  // 2. Measure endpoints directly in browser console with concurrency 6
  console.log('\n--- ⚡ MEASURING ALL API ENDPOINTS FROM BROWSER CONTEXT ---');
  const getEndpoints = inventory.filter(e => e.method === 'GET');

  const measuredResults = await page.evaluate(async ({ endpoints, token }) => {
    const results = [];
    const concurrency = 6;
    let index = 0;

    async function worker() {
      while (index < endpoints.length) {
        const i = index++;
        const e = endpoints[i];
        let path = e.apiPath;
        if (path.includes(':')) {
          path = path.replace(':id', '29ba6047-ac9b-4520-8b49-67d041da9325')
                     .replace(':employeeId', '2e0e717c-3e1b-4f29-9dc6-51e01e533d3f')
                     .replace(':companyId', '29ba6047-ac9b-4520-8b49-67d041da9325');
        }

        const url = `http://localhost:5000${path}`;
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
          results.push({
            module: e.module,
            method: e.method,
            path: e.apiPath,
            status: res.status,
            timeMs: Math.round(ms)
          });
          if (i % 25 === 0 || ms > 2000) {
            console.log(`[BENCHMARK] ${e.method} ${path} -> ${res.status} (${Math.round(ms)}ms) [${i+1}/${endpoints.length}]`);
          }
        } catch (err) {
          const ms = performance.now() - t0;
          results.push({
            module: e.module,
            method: e.method,
            path: e.apiPath,
            status: 0,
            error: err.message,
            timeMs: Math.round(ms)
          });
        }
      }
    }

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    return results;
  }, { endpoints: getEndpoints, token });

  await browser.close();

  // Sort by slowest first
  measuredResults.sort((a, b) => b.timeMs - a.timeMs);

  console.log(`\n✅ Completed measurement of ${measuredResults.length} endpoints from browser.`);
  fs.writeFileSync('./baseline_browser_measurements.json', JSON.stringify({
    measuredAt: new Date().toISOString(),
    uiPages: uiPageMetrics,
    totalMeasured: measuredResults.length,
    results: measuredResults
  }, null, 2));

  // Print top 30 slowest
  console.log('\n============================================================');
  console.log('TOP 30 SLOWEST ENDPOINTS (MEASURED FROM BROWSER)');
  console.log('============================================================');
  console.table(measuredResults.slice(0, 30).map(r => ({
    Path: r.path,
    Method: r.method,
    Status: r.status,
    'Time (ms)': r.timeMs,
    Severity: r.timeMs > 10000 ? '🚨 Critical' : r.timeMs > 5000 ? '⚠️ High' : r.timeMs > 2000 ? '🟡 Medium' : '🟢 OK'
  })));
}

runBenchmark().catch(err => {
  console.error('Benchmark error:', err);
});
