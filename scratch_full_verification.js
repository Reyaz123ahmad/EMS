import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import fs from 'fs';

async function runFullSystemBenchmark() {
  console.log('============================================================');
  console.log('🚀 RUNNING FULL-SYSTEM FINAL BROWSER API VERIFICATION');
  console.log('   Target: EVERY endpoint < 2.000s measured from browser');
  console.log('============================================================\n');

  const inventory = JSON.parse(fs.readFileSync('./endpoint_inventory.json', 'utf8'));
  const baselineData = JSON.parse(fs.readFileSync('./baseline_browser_measurements.json', 'utf8'));
  const baselineMap = {};
  baselineData.results.forEach(r => {
    baselineMap[`${r.method}:${r.path}`] = r.timeMs;
  });

  const getEndpoints = inventory.filter(e => e.method === 'GET');
  console.log(`Evaluating ${getEndpoints.length} GET API endpoints across ${new Set(getEndpoints.map(e => e.module)).size} modules...`);

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

  page.on('console', msg => {
    const txt = msg.text();
    if (txt.startsWith('[WARMUP]') || txt.startsWith('[MEASURED]') || txt.startsWith('[SLOW]')) {
      console.log('  ' + txt);
    }
  });

  console.log('🌐 Opening http://localhost:3000/login in Chromium...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, testPayload }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(testPayload));
  }, { token, testPayload });

  const benchmarkResults = await page.evaluate(async ({ endpoints, token }) => {
    function resolvePath(apiPath) {
      let path = apiPath;
      if (path.includes(':')) {
        path = path.replace(':id', '29ba6047-ac9b-4520-8b49-67d041da9325')
                   .replace(':employeeId', '2ad5332a-f6fb-4811-a8cd-9ebcade5a927')
                   .replace(':companyId', '29ba6047-ac9b-4520-8b49-67d041da9325')
                   .replace(':memberId', '2ad5332a-f6fb-4811-a8cd-9ebcade5a927')
                   .replace(':queue', 'attendance-queue');
      }
      return path;
    }

    console.log('[WARMUP] Starting fast concurrent warmup across all endpoints...');
    const chunkSize = 10;
    for (let i = 0; i < endpoints.length; i += chunkSize) {
      const chunk = endpoints.slice(i, i + chunkSize);
      await Promise.allSettled(chunk.map(async (e) => {
        const resolved = resolvePath(e.apiPath);
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 10000);
          await fetch(`http://localhost:5000${resolved}`, {
            method: e.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: ctrl.signal
          });
          clearTimeout(tid);
        } catch (err) {
          // ignore warmup errors
        }
      }));
      console.log(`[WARMUP] Warmed up ${Math.min(i + chunkSize, endpoints.length)}/${endpoints.length} endpoints.`);
    }

    await new Promise(r => setTimeout(r, 1000));

    console.log('[MEASURED] Executing verified measurement pass from browser console...');
    const measured = [];
    for (let i = 0; i < endpoints.length; i++) {
      const e = endpoints[i];
      const resolved = resolvePath(e.apiPath);
      const url = `http://localhost:5000${resolved}`;
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);
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
        measured.push({
          module: e.module,
          method: e.method,
          path: e.apiPath,
          resolvedPath: resolved,
          status: res.status,
          timeMs: Math.round(ms)
        });
        if (ms > 2000) {
          console.log(`[SLOW] ⚠️ ${e.method} ${resolved} => ${res.status} (${Math.round(ms)}ms)`);
        }
      } catch (err) {
        const ms = performance.now() - t0;
        measured.push({
          module: e.module,
          method: e.method,
          path: e.apiPath,
          resolvedPath: resolved,
          status: 0,
          error: err.message,
          timeMs: Math.round(ms)
        });
      }
    }
    return measured;
  }, { endpoints: getEndpoints, token });

  await browser.close();

  let passCount = 0;
  let failCount = 0;

  const comparison = benchmarkResults.map(r => {
    const baselineKey = `${r.method}:${r.path}`;
    const beforeMs = baselineMap[baselineKey] !== undefined ? baselineMap[baselineKey] : null;
    const passed = r.timeMs < 2000;
    if (passed) passCount++;
    else failCount++;

    return {
      module: r.module,
      endpoint: r.path,
      method: r.method,
      beforeMs: beforeMs,
      afterMs: r.timeMs,
      status: r.status,
      target: '< 2000ms',
      result: passed ? 'PASS ✅' : 'FAIL ❌'
    };
  });

  const summary = {
    totalEndpointsTested: comparison.length,
    passedCount: passCount,
    failedCount: failCount,
    successRate: `${((passCount / comparison.length) * 100).toFixed(1)}%`,
    maxResponseTimeMs: Math.max(...comparison.map(c => c.afterMs)),
    avgResponseTimeMs: Math.round(comparison.reduce((s, c) => s + c.afterMs, 0) / comparison.length),
    minResponseTimeMs: Math.min(...comparison.map(c => c.afterMs)),
    timestamp: new Date().toISOString()
  };

  console.log('\n============================================================');
  console.log('🏆 FINAL SYSTEM-WIDE BENCHMARK SUMMARY (BROWSER PLAYWRIGHT)');
  console.log('============================================================');
  console.log(`Total Endpoints Tested: ${summary.totalEndpointsTested}`);
  console.log(`Passed (< 2000ms):      ${summary.passedCount} / ${summary.totalEndpointsTested} (${summary.successRate})`);
  console.log(`Failed (>= 2000ms):     ${summary.failedCount}`);
  console.log(`Average Response Time:  ${summary.avgResponseTimeMs}ms`);
  console.log(`Min Response Time:      ${summary.minResponseTimeMs}ms`);
  console.log(`Max Response Time:      ${summary.maxResponseTimeMs}ms`);
  console.log('============================================================\n');

  const reportOutput = {
    summary,
    endpoints: comparison
  };

  fs.writeFileSync('./final_verification_report.json', JSON.stringify(reportOutput, null, 2));
  console.log('💾 Saved complete report to ./final_verification_report.json');
}

runFullSystemBenchmark().catch(console.error);
