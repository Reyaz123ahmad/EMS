import { chromium } from 'playwright';

async function testSuperAdminDashboard() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reyazahmadmath@gmail.com', password: 'Reyaz123@_Ahmad' })
  });
  const loginData = await loginRes.json();
  const { user, accessToken, refreshToken } = loginData.data;

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ user, accessToken, refreshToken }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }, { user, accessToken, refreshToken });

  await page.goto('http://localhost:3000/dashboard/super-admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const text = await page.innerText('body');
  console.log('--- Page text snippet ---');
  console.log(text.slice(0, 300));
  console.log('--- End snippet ---');
  const hasError = text.includes('Something went wrong') || text.includes('Unknown field');
  console.log('Super Admin Dashboard Error on Screen:', hasError);
  console.log('Super Admin Dashboard Rendered Successfully:', text.includes('Super Admin Platform Dashboard') && text.includes('Total Tenants'));

  await browser.close();
}

testSuperAdminDashboard().catch(console.error);
