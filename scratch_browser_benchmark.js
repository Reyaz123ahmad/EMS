import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runBenchmark() {
  console.log('🚀 Starting Browser-Based API Performance Benchmark...');

  const inventory = JSON.parse(fs.readFileSync('./endpoint_inventory.json', 'utf8'));
  console.log(`Loaded ${inventory.length} total endpoints from inventory.`);

  // Launch real Chromium browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Navigate to Login Page
  console.log('🌐 Navigating to http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  // 2. Perform Login from Browser UI
  console.log('🔑 Performing Browser Login...');
  await page.fill('input[type="email"], input[name="email"]', 'reyazahmadmath@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'Reyaz123@_Ahmad');
  
  // Submit login form
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/auth/login') || resp.url().includes('/auth')),
    page.click('button[type="submit"]')
  ]);

  const loginRes = await response.json();
  const token = loginRes?.data?.tokens?.accessToken || loginRes?.data?.token || loginRes?.token;
  console.log('✅ Authenticated successfully via browser. Token retrieved.');

  // 3. Navigate through major UI pages and record performance timings
  const pagesToVisit = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Employees', path: '/employees' },
    { name: 'Attendance Logs', path: '/attendance/logs' },
    { name: 'Shifts', path: '/attendance/shifts' },
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
      await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const loadTime = Date.now() - t0;
      console.log(`PAGE: ${p.name.padEnd(20)} | Time: ${loadTime}ms`);
      uiPageMetrics.push({ page: p.name, path: p.path, timeMs: loadTime });
    } catch (err) {
      console.log(`PAGE: ${p.name.padEnd(20)} | Error/Timeout: ${err.message}`);
    }
  }

  // 4. Run in-browser console fetch script across GET endpoints
  console.log('\n--- ⚡ MEASURING ALL API ENDPOINTS FROM BROWSER CONTEXT ---');
  const measuredResults = await page.evaluate(async ({ endpoints, token }) => {
    const results = [];
    // Measure GET endpoints and key query endpoints
    for (const e of endpoints) {
      // replace dynamic path params like :id, :employeeId, :companyId with sample or skip
      let path = e.apiPath;
      if (path.includes(':')) {
        // Skip unparameterized detail routes or use test UUID
        continue;
      }

      const t0 = performance.now();
      try {
        const res = await fetch(path, {
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
    return results;
  }, { endpoints: inventory.filter(e => e.method === 'GET'), token });

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
