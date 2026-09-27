import axios from 'axios';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000/api/v1';

async function testLeaveTypeCreation() {
  console.log('====================================================');
  console.log('🧪 TESTING LEAVE TYPE CREATION & REACTIVE RE-RENDER');
  console.log('====================================================\n');

  const results = {
    leaveTypeCreates: 'FAIL',
    appearsInList: 'FAIL',
    noManualRefreshNeeded: 'FAIL'
  };

  // 1. API Login
  console.log('1. Authenticating as COMPANY_ADMIN via API...');
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'reyazahmad40544@gmail.com',
    password: 'Temp@e68a02e6!'
  });
  const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const user = loginRes.data?.data?.user || loginRes.data?.user;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch current leave types count
  const initialTypesRes = await axios.get(`${API_URL}/leave/types`, { headers: authHeaders });
  const initialTypes = initialTypesRes.data?.data?.types || initialTypesRes.data?.data || initialTypesRes.data || [];
  console.log(`   Initial leave types count: ${initialTypes.length}`);

  // Test API Creation
  const testSuffix = Math.floor(Math.random() * 9000 + 1000);
  const testName = `Automation Leave ${testSuffix}`;
  const testCode = `AL${testSuffix.toString().slice(0, 3)}`;

  console.log(`\n2. Creating new leave type via API: "${testName}" (${testCode})...`);
  const createRes = await axios.post(`${API_URL}/leave/types`, {
    name: testName,
    code: testCode,
    description: 'Created for automation reactive validation',
    maxDaysPerYear: 14,
    isPaid: true,
    carryForward: true,
    maxCarryForward: 5
  }, { headers: authHeaders });

  console.log('   Create response status:', createRes.status);
  console.log('   Created leave type data:', createRes.data?.data?.name || createRes.data?.name);

  if (createRes.status === 201 || createRes.status === 200) {
    results.leaveTypeCreates = 'PASS';
  }

  // 2. Browser UI Test for Reactive Addition without refresh
  console.log('\n3. Launching Chromium browser for UI reactive verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('Leave types data') || txt.includes('Created:') || txt.includes('error')) {
      console.log('   [PAGE LOG]:', txt);
    }
  });

  // Inject session
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', t);
  }, { u: user, t: token });

  // Go to /leave/types
  console.log('   Navigating to /leave/types page...');
  await page.goto(`${BASE_URL}/leave/types`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Check if initial list contains our API-created item
  let pageText = await page.locator('body').innerText();
  if (pageText.includes(testName)) {
    console.log(`   ✅ API-created type "${testName}" is visible on initial load.`);
  }

  // Now create another item directly using the UI Modal!
  const uiTestSuffix = Math.floor(Math.random() * 9000 + 1000);
  const uiTestName = `UI Reactive Leave ${uiTestSuffix}`;
  const uiTestCode = `UL${uiTestSuffix.toString().slice(0, 3)}`;

  console.log(`\n4. Opening UI modal and creating: "${uiTestName}"...`);
  await page.click('button:has-text("Add Leave Type")');
  await page.waitForTimeout(500);

  // Fill modal form inputs
  await page.fill('input[placeholder*="Annual Leave"]', uiTestName);
  await page.fill('input[placeholder*="AL, CL"]', uiTestCode);
  
  // Submit the form
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  });

  // Wait for react-query mutation & reactive cache update without reloading the page
  console.log('   Awaiting reactive cache update without browser refresh...');
  await page.waitForTimeout(2500);

  pageText = await page.locator('body').innerText();
  if (pageText.includes(uiTestName)) {
    console.log(`   ✅ "${uiTestName}" immediately appeared in the table list without manual page reload!`);
    results.appearsInList = 'PASS';
    results.noManualRefreshNeeded = 'PASS';
  } else {
    console.error(`   ❌ "${uiTestName}" did not appear in the page text.`);
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('📊 FINAL TEST RESULTS:');
  console.log(`- Leave type creates: ${results.leaveTypeCreates}`);
  console.log(`- Appears in list: ${results.appearsInList}`);
  console.log(`- No manual refresh needed: ${results.noManualRefreshNeeded}`);
  console.log('====================================================\n');
}

testLeaveTypeCreation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
