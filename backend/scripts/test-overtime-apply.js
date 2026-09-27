import { chromium } from 'playwright';
import axios from 'axios';

async function testOvertimeApply() {
  console.log('1. Logging in as EMPLOYEE (employee.test@mindstocs.com)...');
  const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'employee.test@mindstocs.com',
    password: 'Temp@e68a02e6!'
  });
  const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const user = loginRes.data?.data?.user || loginRes.data?.user;

  console.log('2. Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/login');
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', t);
  }, { u: user, t: token });

  console.log('3. Navigating to Overtime Apply page (/overtime/apply)...');
  await page.goto('http://localhost:3000/overtime/apply', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Pick a unique date so no collision with existing requests
  const dayOffset = Math.floor(Math.random() * 25) + 1;
  const targetDate = new Date(2026, 8, dayOffset).toISOString().split('T')[0];
  const testReason = `Urgent task completion ${Date.now()}`;

  console.log(`Filling overtime claim for date: ${targetDate}, minutes: 90, reason: "${testReason}"...`);
  await page.fill('input[type="date"]', targetDate);
  await page.fill('input[type="number"]', '90');
  await page.fill('textarea', testReason);

  console.log('Submitting overtime claim...');
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/overtime/') && resp.request().method() === 'POST'),
    page.click('button[type="submit"]:has-text("Submit Overtime Claim")')
  ]);

  console.log(`Apply API response status: ${response.status()}`);
  const responseBody = await response.text();
  console.log(`Apply API response body: ${responseBody}`);

  if (response.status() !== 200 && response.status() !== 201) {
    throw new Error(`Failed to apply overtime: ${responseBody}`);
  }

  console.log('4. Waiting for redirect to requests list and checking presence of overtime request...');
  await page.waitForURL('**/overtime/requests', { timeout: 10000 });
  await page.waitForSelector(`text=${testReason}`, { timeout: 10000 });

  const pageText = await page.locator('body').innerText();
  const isPresent = pageText.includes(testReason);

  console.log(`Did overtime request appear in requests list? ${isPresent ? 'YES' : 'NO'}`);

  await browser.close();

  if (isPresent && (response.status() === 200 || response.status() === 201)) {
    console.log('\n====================================================');
    console.log('🎉 OVERTIME CLAIM & LISTING VERIFIED 100% PASS');
    console.log('====================================================\n');
  } else {
    throw new Error('Overtime apply test failed!');
  }
}

testOvertimeApply().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
