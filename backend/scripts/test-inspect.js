import { chromium } from 'playwright';
import axios from 'axios';

async function testInspect() {
  const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'reyazahmad40544@gmail.com',
    password: 'Temp@e68a02e6!'
  });
  const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const user = loginRes.data?.data?.user || loginRes.data?.user;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/login');
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', t);
  }, { u: user, t: token });

  await page.goto('http://localhost:3000/leave/types', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Add Leave Type")');
  await page.waitForTimeout(500);

  const buttons = await page.locator('button').allInnerTexts();
  console.log('Visible buttons on page:', buttons);

  // Fill form
  const testName = `Reactive Test ${Date.now()}`;
  await page.locator('input[placeholder*="Annual Leave"]').fill(testName);
  await page.locator('input[placeholder*="AL, CL"]').fill('RT');

  // Click the button with exact text "Create Type"
  const createBtn = page.locator('button', { hasText: 'Create Type' });
  console.log('Is Create Type button visible?', await createBtn.isVisible());
  await createBtn.click({ force: true });

  await page.waitForTimeout(2000);
  const text = await page.locator('body').innerText();
  console.log(`Did "${testName}" appear?`, text.includes(testName));

  await browser.close();
}

testInspect().catch(console.error);
