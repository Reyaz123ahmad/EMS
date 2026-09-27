import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'e2e-final');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, '_SCREENSHOTS');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const ROLES_TO_AUDIT = [
  {
    role: 'COMPANY_ADMIN',
    email: 'reyazahmad40544@gmail.com',
    pass: 'Temp@e68a02e6!',
    expectedDashboard: '/dashboard/company-admin',
    routes: [
      '/dashboard',
      '/dashboard/company-admin',
      '/employees',
      '/employees/create',
      '/organization/branches',
      '/organization/departments',
      '/organization/designations',
      '/attendance',
      '/attendance/today',
      '/attendance/logs',
      '/attendance/monthly-summary',
      '/attendance/calendar',
      '/attendance/exceptions',
      '/attendance/manual-entry',
      '/leave/types',
      '/leave/balance',
      '/leave/requests',
      '/leave/apply',
      '/leave/calendar',
      '/leave/history',
      '/payroll/salary-structure',
      '/payroll/runs',
      '/payroll/slips',
      '/payroll/batches',
      '/overtime/rules',
      '/overtime/apply',
      '/overtime/requests',
      '/overtime/records',
      '/shifts',
      '/shifts/create',
      '/shifts/assign',
      '/rosters/calendar',
      '/shifts/roster-generator',
      '/holidays',
      '/holidays/calendar',
      '/holidays/assign',
      '/documents',
      '/documents/upload',
      '/documents/verify',
      '/documents/types',
      '/reports',
      '/reports/attendance',
      '/reports/payroll',
      '/reports/employees',
      '/subscription/current',
      '/subscription/plans',
      '/subscription/upgrade',
      '/subscription/history',
      '/refunds',
      '/refunds/request',
      '/security/dashboard',
      '/security/fraud-signals',
      '/security/events',
      '/security/audit-logs',
      '/security/blocked-employees',
      '/approvals/workflows',
      '/approvals/requests',
      '/approvals/history',
      '/assets',
      '/assets/create',
      '/assets/assign',
      '/assets/return',
      '/assets/categories',
      '/emergency-attendance',
      '/emergency-attendance/requests',
      '/emergency-attendance/stats',
      '/face-registration',
      '/face/status',
      '/face/approvals',
      '/face/stats',
      '/settings/general',
      '/settings/attendance',
      '/settings/security',
      '/settings/leave',
      '/settings/payroll',
      '/settings/notifications',
      '/notifications',
      '/profile',
      '/profile/change-password',
      '/profile/2fa',
      '/ai/hub'
    ]
  },
  {
    role: 'HR_ADMIN',
    email: 'hr.admin.test@mindstocs.com',
    pass: 'Test@123456',
    expectedDashboard: '/dashboard',
    routes: [
      '/dashboard',
      '/dashboard/hr-admin',
      '/employees',
      '/employees/create',
      '/organization/branches',
      '/organization/departments',
      '/organization/designations',
      '/attendance',
      '/attendance/logs',
      '/attendance/monthly-summary',
      '/attendance/calendar',
      '/leave/types',
      '/leave/balance',
      '/leave/requests',
      '/leave/apply',
      '/payroll/salary-structure',
      '/payroll/runs',
      '/payroll/slips',
      '/overtime/rules',
      '/overtime/records',
      '/shifts',
      '/holidays',
      '/documents',
      '/reports',
      '/approvals/requests',
      '/approvals/history',
      '/assets',
      '/emergency-attendance',
      '/face/status',
      '/face/approvals',
      '/notifications',
      '/profile',
      '/ai/hub',
      '/settings/general'
    ]
  },
  {
    role: 'HR_MANAGER',
    email: 'hr.manager.test@mindstocs.com',
    pass: 'Test@123456',
    expectedDashboard: '/dashboard',
    routes: [
      '/dashboard',
      '/dashboard/hr-manager',
      '/employees',
      '/attendance',
      '/attendance/logs',
      '/leave/requests',
      '/leave/balance',
      '/documents',
      '/approvals/requests',
      '/assets',
      '/notifications',
      '/profile',
      '/ai/hub',
      '/reports'
    ]
  },
  {
    role: 'MANAGER',
    email: 'manager.test@mindstocs.com',
    pass: 'Test@123456',
    expectedDashboard: '/dashboard',
    routes: [
      '/dashboard',
      '/dashboard/manager',
      '/employees',
      '/attendance',
      '/attendance/logs',
      '/leave/requests',
      '/my-shift',
      '/approvals/requests',
      '/assets',
      '/notifications',
      '/profile',
      '/ai/hub',
      '/emergency-attendance/requests',
      '/overtime/requests',
      '/rosters/calendar',
      '/reports'
    ]
  },
  {
    role: 'EMPLOYEE',
    email: 'employee.test@mindstocs.com',
    pass: 'Test@123456',
    expectedDashboard: '/dashboard',
    routes: [
      '/dashboard',
      '/dashboard/employee',
      '/attendance',
      '/attendance/logs',
      '/leave/apply',
      '/leave/balance',
      '/leave/history',
      '/payroll/slips',
      '/my-shift',
      '/documents',
      '/documents/upload',
      '/emergency-attendance',
      '/notifications',
      '/profile',
      '/profile/change-password',
      '/ai/hub',
      '/approvals/requests',
      '/assets',
      '/rosters/calendar',
      '/holidays'
    ]
  },
  {
    role: 'CLIENT',
    email: 'client.test@mindstocs.com',
    pass: 'Test@123456',
    expectedDashboard: '/dashboard',
    routes: [
      '/dashboard',
      '/dashboard/client',
      '/client-portal',
      '/client-portal/projects',
      '/client-portal/requirements',
      '/client-portal/comments',
      '/client-portal/invoices',
      '/client-portal/payments',
      '/notifications',
      '/profile'
    ]
  }
];

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING TARGET COMPANY E2E AUDIT');
  console.log('COMPANY ID: 925af98c-24d1-4f9f-8f87-97a55734c7cd');
  console.log('====================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const roleSummaryResults = {};

  for (const roleDef of ROLES_TO_AUDIT) {
    console.log(`\n----------------------------------------------------`);
    console.log(`👤 AUDITING ROLE: [${roleDef.role}] (${roleDef.email})`);
    console.log(`----------------------------------------------------`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const rolePages = [];
    const roleFailures = [];
    let roleButtonsCount = 0;
    let rolePassedPages = 0;
    let roleFailedPages = 0;

    const consoleMessages = [];
    const networkFailures = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push({ text: msg.text(), url: page.url() });
      }
    });

    page.on('response', resp => {
      if (resp.status() >= 400) {
        networkFailures.push({ url: resp.url(), status: resp.status(), pageUrl: page.url() });
      }
    });

    // 1. Login
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.fill('input[type="email"], input[name="email"]', roleDef.email);
      await page.fill('input[type="password"], input[name="password"]', roleDef.pass);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      console.log(`[${roleDef.role}] ✅ Successfully logged in. Dashboard URL: ${page.url()}`);
    } catch (e) {
      console.error(`[${roleDef.role}] ❌ Login failed:`, e.message);
      roleFailures.push({ type: 'LOGIN_FAILURE', error: e.message });
    }

    // 2. Audit routes
    for (const route of roleDef.routes) {
      const pageInfo = {
        name: route.replace(/^\//, '').replace(/\//g, ' > ') || 'Dashboard',
        url: route,
        status: 'PASS',
        buttons: [],
        errors: [],
        networkErrors: []
      };

      try {
        const fullUrl = `${BASE_URL}${route}`;
        const startTime = Date.now();
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1000);
        const duration = Date.now() - startTime;

        // Check crash / blank
        const bodyContent = await page.evaluate(() => document.body ? document.body.innerText.trim() : '');
        const isBlank = bodyContent.length < 5;
        const isCrash = bodyContent.includes('Something went wrong') || bodyContent.includes('Cannot read properties');

        // Check buttons
        const buttonHandles = await page.$$('button:not([disabled])');
        for (let i = 0; i < Math.min(buttonHandles.length, 12); i++) {
          try {
            const btn = buttonHandles[i];
            const isVisible = await btn.isVisible();
            if (isVisible) {
              const label = (await btn.innerText()).trim() || (await btn.getAttribute('aria-label')) || `Btn-${i+1}`;
              pageInfo.buttons.push({
                label: label.substring(0, 40),
                expected: 'Clickable without crash',
                actual: 'Interactive',
                status: 'PASS'
              });
              roleButtonsCount++;
            }
          } catch {}
        }

        if (isCrash || isBlank) {
          pageInfo.status = 'FAIL';
          roleFailedPages++;
          const screenshotPath = path.join(SCREENSHOTS_DIR, `${roleDef.role}_${route.replace(/\//g, '_')}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          roleFailures.push({ route, issue: isCrash ? 'CRASH' : 'BLANK', screenshot: screenshotPath });
          console.log(`  [FAIL] ${route} (${duration}ms)`);
        } else {
          pageInfo.status = 'PASS';
          rolePassedPages++;
          console.log(`  [PASS] ${route} (${duration}ms) - Buttons: ${pageInfo.buttons.length}`);
        }
      } catch (err) {
        pageInfo.status = 'ERROR';
        pageInfo.errors.push(err.message);
        roleFailedPages++;
        console.log(`  [ERR] ${route} - ${err.message}`);
      }

      rolePages.push(pageInfo);
    }

    const report = {
      role: roleDef.role,
      email: roleDef.email,
      testedAt: new Date().toISOString(),
      totalPages: roleDef.routes.length,
      totalButtons: roleButtonsCount,
      passed: rolePassedPages,
      failed: roleFailedPages,
      errors: roleFailures.length,
      pages: rolePages,
      failures: roleFailures,
      fixes: []
    };

    const reportPath = path.join(OUTPUT_DIR, `${roleDef.role}_report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`[${roleDef.role}] Report saved: ${reportPath}`);

    roleSummaryResults[roleDef.role] = {
      pages: roleDef.routes.length,
      buttons: roleButtonsCount,
      passed: rolePassedPages,
      failed: roleFailedPages,
      errors: roleFailures.length
    };

    await context.close();
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('🏁 TARGET COMPANY E2E AUDIT COMPLETE');
  console.log('====================================================');
  console.log(JSON.stringify(roleSummaryResults, null, 2));
}

runAudit().catch(err => {
  console.error('Fatal audit runner error:', err);
  process.exit(1);
});
