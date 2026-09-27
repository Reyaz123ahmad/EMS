import { chromium } from 'playwright';
import axios from 'axios';

async function testLeaveEditAndDelete() {
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

  // 1. Create a test leave type first to edit & delete
  const uniqueId = Math.floor(Math.random() * 90000 + 10000);
  const initialName = `TestType ${uniqueId}`;
  const initialCode = `TT${uniqueId.toString().slice(0, 3)}`;

  console.log(`\n--- Step A: Creating "${initialName}" ---`);
  await page.click('button:has-text("Add Leave Type")');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder*="Annual Leave"]', initialName);
  await page.fill('input[placeholder*="AL, CL"]', initialCode);
  
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/leave/types') && resp.request().method() === 'POST'),
    page.click('button[type="submit"]:has-text("Create Type")')
  ]);

  await page.waitForSelector(`text=${initialName}`, { timeout: 10000 });
  console.log(`Created and visible: "${initialName}"`);

  // 2. Test Edit
  console.log(`\n--- Step B: Editing "${initialName}" ---`);
  const row = page.locator('tr', { hasText: initialName });
  await row.locator('button:has-text("Edit")').click();
  await page.waitForTimeout(500);

  const editedName = `EditedType ${uniqueId}`;
  console.log(`Updating name to "${editedName}"...`);
  await page.fill('input[placeholder*="Annual Leave"]', editedName);

  const [editResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/leave/types') && resp.request().method() === 'PUT'),
    page.click('button[type="submit"]:has-text("Save Changes")')
  ]);

  console.log(`Edit API status: ${editResponse.status()}`);
  if (editResponse.status() !== 200) {
    const errorBody = await editResponse.text();
    console.error(`Edit failed with body: ${errorBody}`);
  }

  await page.waitForSelector(`text=${editedName}`, { timeout: 10000 });
  console.log(`Successfully edited and reactively updated: "${editedName}"`);

  // 3. Test Delete
  console.log(`\n--- Step C: Deleting "${editedName}" ---`);
  const editedRow = page.locator('tr', { hasText: editedName });
  await editedRow.locator('button:has-text("Delete")').click();
  await page.waitForTimeout(500);

  // Check Confirm Dialog
  const dialogText = await page.locator('text=Delete Leave Type').isVisible();
  console.log(`Confirm dialog visible: ${dialogText}`);

  const [deleteResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/leave/types') && resp.request().method() === 'DELETE'),
    page.click('div[role="dialog"] button:has-text("Delete"), div.fixed button:has-text("Delete")')
  ]);

  console.log(`Delete API status: ${deleteResponse.status()}`);

  console.log(`Waiting for "${editedName}" to disappear from the table...`);
  await page.waitForSelector(`text=${editedName}`, { state: 'detached', timeout: 10000 });

  const isStillPresent = await page.locator(`text=${editedName}`).isVisible();
  console.log(`Is "${editedName}" still in table? ${isStillPresent ? 'YES' : 'NO'}`);

  await browser.close();

  if (!isStillPresent && editResponse.status() === 200 && deleteResponse.status() === 200) {
    console.log('\n====================================================');
    console.log('🎉 LEAVE TYPE EDIT & DELETE WITH SPINNER 100% PASS');
    console.log('====================================================\n');
  } else {
    throw new Error('Edit or Delete test failed!');
  }
}

testLeaveEditAndDelete().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
