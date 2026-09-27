import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"], input[name="email"]', 'reyazahmad40544@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'Temp@e68a02e6!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Post-login URL:', page.url());

  await page.goto('http://localhost:3000/leave/history');
  await page.waitForTimeout(2000);
  console.log('Leave history URL:', page.url());
  console.log('Leave history body sample:', (await page.locator('body').innerText()).slice(0, 300));

  await page.goto('http://localhost:3000/leave/calendar');
  await page.waitForTimeout(2000);
  console.log('Leave calendar URL:', page.url());
  console.log('Leave calendar body sample:', (await page.locator('body').innerText()).slice(0, 300));

  await browser.close();
}

check();
