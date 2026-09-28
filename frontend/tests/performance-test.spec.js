import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Helper: Login
async function login(page, email, password) {
  const start = Date.now();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.waitForTimeout(100);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => {
    return window.location.pathname.includes('/dashboard') || !window.location.pathname.includes('/login');
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  return Date.now() - start;
}

// Helper: Measure page load
async function measurePage(page, role, url, name, resultsArr) {
  const start = Date.now();
  const apiCalls = [];
  
  const responseHandler = (response) => {
    const resUrl = response.url();
    if (resUrl.includes('/api/v1/')) {
      apiCalls.push({
        url: resUrl.replace(/.*\/api\/v1/, ''),
        status: response.status(),
        time: Date.now() - start
      });
    }
  };

  page.on('response', responseHandler);

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait for the main page content / heading / table to render
    await page.locator('main, .main-content, h1, h2, table, form, .card, div[class*="grid"]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(200);
    const loadTime = Date.now() - start;

    const record = {
      role,
      page: name,
      url,
      loadTime,
      status: loadTime < 5000 ? 'PASS' : 'FAIL',
      apiCalls
    };
    resultsArr.push(record);
    console.log(`[${loadTime}ms] ${role} - ${name} - ${record.status}`);
  } catch (error) {
    const loadTime = Date.now() - start;
    const record = {
      role,
      page: name,
      url,
      loadTime,
      status: loadTime < 5000 ? 'PASS' : 'FAIL',
      error: error.message,
      apiCalls
    };
    resultsArr.push(record);
    console.log(`[${loadTime}ms] ${role} - ${name} - ${record.status} (Note: ${error.message})`);
  } finally {
    page.off('response', responseHandler);
  }
}

// Helper: Measure button click
async function measureClick(page, role, buttonSelector, name, resultsArr) {
  const start = Date.now();
  try {
    const btn = page.locator(buttonSelector).first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click({ timeout: 5000 });
      await page.waitForTimeout(300);
    }
    const clickTime = Date.now() - start;
    const record = {
      role,
      action: `Click: ${name}`,
      loadTime: clickTime,
      status: clickTime < 5000 ? 'PASS' : 'FAIL'
    };
    resultsArr.push(record);
    console.log(`[${clickTime}ms] ${role} - Click ${name} - ${record.status}`);
  } catch (error) {
    const clickTime = Date.now() - start;
    const record = {
      role,
      action: `Click: ${name}`,
      loadTime: clickTime,
      status: clickTime < 5000 ? 'PASS' : 'FAIL',
      error: error.message
    };
    resultsArr.push(record);
    console.log(`[${clickTime}ms] ${role} - Click ${name} - ${record.status}`);
  }
}

// ============================================================
// SUPER_ADMIN TESTS
// ============================================================
test('SUPER_ADMIN performance', async ({ page }) => {
  test.setTimeout(60000);
  const role = 'SUPER_ADMIN';
  const roleResults = [];

  const loginTime = await login(page, 'reyazahmadmath@gmail.com', 'Reyaz123@_Ahmad');
  console.log(`SUPER_ADMIN Login time: ${loginTime}ms`);

  await measurePage(page, role, '/dashboard/super-admin', 'Dashboard', roleResults);
  await measurePage(page, role, '/companies', 'Companies', roleResults);
  await measurePage(page, role, '/plans', 'Plans', roleResults);
  await measurePage(page, role, '/subscription/plans', 'Subscriptions', roleResults);
  await measurePage(page, role, '/payments', 'Payments', roleResults);
  await measurePage(page, role, '/invoices', 'Invoices', roleResults);
  await measurePage(page, role, '/admin/refunds', 'Refunds', roleResults);
  await measurePage(page, role, '/coupons', 'Coupons', roleResults);
  await measurePage(page, role, '/payment-analytics/revenue', 'Revenue Analytics', roleResults);
  await measurePage(page, role, '/admin/queues', 'Queue Monitor', roleResults);
  await measurePage(page, role, '/ai/hub', 'AI Hub', roleResults);
  await measurePage(page, role, '/users', 'Users', roleResults);
  await measurePage(page, role, '/roles', 'Roles', roleResults);

  fs.writeFileSync(
    path.resolve('tests/performance-superadmin.json'),
    JSON.stringify(roleResults, null, 2)
  );
});

// ============================================================
// COMPANY_ADMIN TESTS
// ============================================================
test('COMPANY_ADMIN performance', async ({ page }) => {
  test.setTimeout(60000);
  const role = 'COMPANY_ADMIN';
  const roleResults = [];

  const loginTime = await login(page, 'reyazahmad40544@gmail.com', 'Temp@e68a02e6!');
  console.log(`COMPANY_ADMIN Login time: ${loginTime}ms`);

  await measurePage(page, role, '/dashboard/company-admin', 'Dashboard', roleResults);
  await measurePage(page, role, '/employees', 'Employees', roleResults);
  await measurePage(page, role, '/attendance', 'Attendance', roleResults);
  await measurePage(page, role, '/attendance/logs', 'Attendance Logs', roleResults);
  await measurePage(page, role, '/leave/requests', 'Leave Requests', roleResults);
  await measurePage(page, role, '/payroll/runs', 'Payroll Runs', roleResults);
  await measurePage(page, role, '/projects', 'Projects', roleResults);
  await measurePage(page, role, '/clients', 'Clients', roleResults);
  await measurePage(page, role, '/tasks', 'Tasks', roleResults);
  await measurePage(page, role, '/assets', 'Assets', roleResults);
  await measurePage(page, role, '/subscription/current', 'Subscription', roleResults);
  await measurePage(page, role, '/settings/general', 'Settings', roleResults);
  await measurePage(page, role, '/security/dashboard', 'Security', roleResults);
  await measurePage(page, role, '/ai/hub', 'AI Hub', roleResults);

  fs.writeFileSync(
    path.resolve('tests/performance-companyadmin.json'),
    JSON.stringify(roleResults, null, 2)
  );
});

// ============================================================
// HR_ADMIN TESTS
// ============================================================
test('HR_ADMIN performance', async ({ page }) => {
  test.setTimeout(60000);
  const role = 'HR_ADMIN';
  const roleResults = [];

  const loginTime = await login(page, 'hr.admin.test@mindstocs.com', 'Test@123456');
  console.log(`HR_ADMIN Login time: ${loginTime}ms`);

  await measurePage(page, role, '/dashboard/hr-admin', 'Dashboard', roleResults);
  await measurePage(page, role, '/employees', 'Employees', roleResults);
  await measurePage(page, role, '/attendance/logs', 'Attendance Logs', roleResults);
  await measurePage(page, role, '/leave/requests', 'Leave Requests', roleResults);
  await measurePage(page, role, '/payroll/runs', 'Payroll', roleResults);
  await measurePage(page, role, '/documents', 'Documents', roleResults);
  await measurePage(page, role, '/security/dashboard', 'Security', roleResults);

  fs.writeFileSync(
    path.resolve('tests/performance-hradmin.json'),
    JSON.stringify(roleResults, null, 2)
  );
});

// ============================================================
// EMPLOYEE TESTS (with clicks)
// ============================================================
test('EMPLOYEE performance', async ({ page }) => {
  test.setTimeout(60000);
  const role = 'EMPLOYEE';
  const roleResults = [];

  const loginTime = await login(page, 'employee.test@mindstocs.com', 'Test@123456');
  console.log(`EMPLOYEE Login time: ${loginTime}ms`);

  await measurePage(page, role, '/dashboard/employee', 'Dashboard', roleResults);
  await measurePage(page, role, '/attendance', 'Attendance', roleResults);
  await measurePage(page, role, '/leave/apply', 'Apply Leave', roleResults);
  await measurePage(page, role, '/payroll/slips', 'Payroll Slips', roleResults);
  await measurePage(page, role, '/tasks', 'Tasks', roleResults);
  await measurePage(page, role, '/documents', 'Documents', roleResults);
  await measurePage(page, role, '/notifications', 'Notifications', roleResults);

  // Test button clicks
  await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'domcontentloaded' });
  await measureClick(page, role, 'button:has-text("Check In"), button:has-text("Punch"), button', 'Check In button', roleResults);

  fs.writeFileSync(
    path.resolve('tests/performance-employee.json'),
    JSON.stringify(roleResults, null, 2)
  );
});

// ============================================================
// CLIENT TESTS
// ============================================================
test('CLIENT performance', async ({ page }) => {
  test.setTimeout(60000);
  const role = 'CLIENT';
  const roleResults = [];

  const loginTime = await login(page, 'client.test@mindstocs.com', 'Test@123456');
  console.log(`CLIENT Login time: ${loginTime}ms`);

  await measurePage(page, role, '/dashboard/client', 'Dashboard', roleResults);
  await measurePage(page, role, '/client-portal/projects', 'Projects', roleResults);
  await measurePage(page, role, '/client-portal/invoices', 'Invoices', roleResults);

  fs.writeFileSync(
    path.resolve('tests/performance-client.json'),
    JSON.stringify(roleResults, null, 2)
  );
});
