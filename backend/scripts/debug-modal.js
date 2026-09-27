import { chromium } from 'playwright';
import axios from 'axios';

async function testModal() {
  const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'reyazahmad40544@gmail.com',
    password: 'Temp@e68a02e6!'
  });
  const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const user = loginRes.data?.data?.user || loginRes.data?.user;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('response', resp => {
    if (resp.url().includes('/leave/types')) {
      console.log(`RESPONSE [${resp.status()}] ${resp.request().method()} ${resp.url()}`);
    }
  });

  await page.goto('http://localhost:3000/login');
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', t);
  }, { u: user, t: token });

  await page.goto('http://localhost:3000/leave/types', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Clicking Add Leave Type button...');
  await page.click('button:has-text("Add Leave Type")');
  await page.waitForTimeout(500);

  const testName = `Reactive Leave ${Date.now()}`;
  console.log(`Filling name: ${testName}`);
  
  await page.locator('input[placeholder*="Annual Leave"]').fill(testName);
  await page.locator('input[placeholder*="AL, CL"]').fill('RL');

  console.log('Clicking submit button inside modal...');
  await page.click('button[type="submit"]:has-text("Create Type")');

  await page.waitForTimeout(2500);

  const bodyText = await page.locator('body').innerText();
  console.log(`Did "${testName}" appear on page?`, bodyText.includes(testName));

  await browser.close();
}

testModal().catch(console.error);
