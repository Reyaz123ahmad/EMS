import { chromium } from 'playwright';
import axios from 'axios';

async function testReactiveLeaveCreation() {
  console.log('1. Logging in as COMPANY_ADMIN...');
  const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'reyazahmad40544@gmail.com',
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

  await page.goto('http://localhost:3000/leave/types', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const initialCount = await page.locator('tbody tr').count();
  console.log(`Initial rows in table: ${initialCount}`);

  console.log('Clicking "+ Add Leave Type"...');
  await page.click('button:has-text("Add Leave Type")');
  await page.waitForTimeout(500);

  const uniqueSuffix = Math.floor(Math.random() * 90000 + 10000);
  const newTypeName = `Reactive Type ${uniqueSuffix}`;
  const newTypeCode = `RT${uniqueSuffix.toString().slice(0, 3)}`;

  console.log(`Filling form with: "${newTypeName}" (${newTypeCode})...`);
  await page.fill('input[placeholder*="Annual Leave"]', newTypeName);
  await page.fill('input[placeholder*="AL, CL"]', newTypeCode);

  console.log('Submitting creation form...');
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/leave/types') && resp.request().method() === 'POST'),
    page.click('button[type="submit"]:has-text("Create Type")')
  ]);

  console.log(`Create API response status: ${response.status()}`);

  console.log(`Waiting for "${newTypeName}" to appear in the table...`);
  await page.waitForSelector(`text=${newTypeName}`, { timeout: 10000 });

  const newCount = await page.locator('tbody tr').count();
  const pageText = await page.locator('body').innerText();
  const isPresent = pageText.includes(newTypeName);

  console.log(`New rows in table: ${newCount} (Expected: ${initialCount + 1})`);
  console.log(`Did "${newTypeName}" appear in the table? ${isPresent ? 'YES' : 'NO'}`);

  await browser.close();

  if (isPresent) {
    console.log('\n====================================================');
    console.log('🎉 REACTIVE LEAVE TYPE CREATION VERIFIED 100% PASS');
    console.log('====================================================\n');
  } else {
    throw new Error('Leave type did not appear reactively!');
  }
}

testReactiveLeaveCreation().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
