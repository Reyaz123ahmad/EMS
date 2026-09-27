import axios from 'axios';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING EMPLOYEE EDIT VALIDATION & LEAVE PAGES');
  console.log('====================================================\n');

  const results = {
    employeeEditWorks: 'FAIL',
    leaveHistoryRenders: 'FAIL',
    leaveCalendarRenders: 'FAIL',
    leaveTypesRenders: 'FAIL',
    noMapErrors: 'PASS'
  };

  // 1. API Level tests
  console.log('1. Logging in via API as COMPANY_ADMIN...');
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'reyazahmad40544@gmail.com',
    password: 'Temp@e68a02e6!'
  });
  const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const user = loginRes.data?.data?.user || loginRes.data?.user;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch an existing employee
  const empsRes = await axios.get(`${API_URL}/employees?limit=5`, { headers: authHeaders });
  const employees = empsRes.data?.data?.employees || [];
  if (employees.length === 0) {
    throw new Error('No employees found to test edit.');
  }

  const targetEmp = employees[0];
  console.log(`   Found employee: ${targetEmp.firstName} ${targetEmp.lastName} (${targetEmp.id})`);

  // Test updating with an invalid department ID to verify explicit DEPARTMENT_NOT_FOUND code
  try {
    await axios.put(`${API_URL}/employees/${targetEmp.id}`, {
      departmentId: '00000000-0000-0000-0000-000000000000'
    }, { headers: authHeaders });
    console.log('   ❌ Expected error on invalid departmentId but succeeded.');
  } catch (err) {
    if (err.response?.data?.code === 'DEPARTMENT_NOT_FOUND' || err.response?.status === 400) {
      console.log(`   ✅ Correctly caught invalid department: code = ${err.response?.data?.code}`);
    }
  }

  // Test updating with valid data
  const updateRes = await axios.put(`${API_URL}/employees/${targetEmp.id}`, {
    firstName: targetEmp.firstName,
    lastName: targetEmp.lastName,
    phone: targetEmp.phone || '9876543210'
  }, { headers: authHeaders });

  if (updateRes.status === 200) {
    console.log('   ✅ Valid employee update succeeded via API!');
    results.employeeEditWorks = 'PASS';
  }

  // Test Leave History API
  console.log('\n2. Testing Leave History API endpoint...');
  const leaveHistoryRes = await axios.get(`${API_URL}/leave/history`, { headers: authHeaders });
  console.log(`   ✅ /leave/history returned status ${leaveHistoryRes.status} with data shape:`, Object.keys(leaveHistoryRes.data?.data || {}));

  // 2. Browser Level UI tests
  console.log('\n3. Launching Chromium browser for UI validation...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('data.map is not a function') || text.includes('.map is not a function')) {
      console.error(`❌ Console error caught: ${text}`);
      results.noMapErrors = 'FAIL';
    }
  });

  page.on('pageerror', (err) => {
    if (err.message.includes('.map is not a function')) {
      console.error(`❌ Page unhandled error caught: ${err.message}`);
      results.noMapErrors = 'FAIL';
    }
  });

  // Navigate to app & inject auth state
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', t);
  }, { u: user, t: token });

  // Test Leave History page
  console.log('   Testing /leave/history page render in browser...');
  await page.goto(`${BASE_URL}/leave/history`, { waitUntil: 'networkidle', timeout: 15000 });
  const historyText = await page.locator('body').innerText();
  if (historyText.includes('Leave') || historyText.includes('No records found') || historyText.includes('History') || historyText.includes('Duration')) {
    results.leaveHistoryRenders = 'PASS';
    console.log('   ✅ /leave/history rendered successfully without crash');
  }

  // Test Leave Calendar page
  console.log('   Testing /leave/calendar page render in browser...');
  await page.goto(`${BASE_URL}/leave/calendar`, { waitUntil: 'networkidle', timeout: 15000 });
  const calendarText = await page.locator('body').innerText();
  if (calendarText.includes('Calendar') || calendarText.includes('January') || calendarText.includes('September') || calendarText.includes('Sun') || calendarText.includes('Mon')) {
    results.leaveCalendarRenders = 'PASS';
    console.log('   ✅ /leave/calendar rendered successfully without crash');
  }

  // Test Leave Types page
  console.log('   Testing /leave/types page render in browser...');
  await page.goto(`${BASE_URL}/leave/types`, { waitUntil: 'networkidle', timeout: 15000 });
  const typesText = await page.locator('body').innerText();
  if (typesText.includes('Leave') || typesText.includes('Type') || typesText.includes('Annual') || typesText.includes('Sick')) {
    results.leaveTypesRenders = 'PASS';
    console.log('   ✅ /leave/types rendered successfully without crash');
  }

  // Test Edit Employee page in UI
  console.log(`   Testing /employees/${targetEmp.id}/edit page render in browser...`);
  await page.goto(`${BASE_URL}/employees/${targetEmp.id}/edit`, { waitUntil: 'networkidle', timeout: 15000 });
  const editEmpText = await page.locator('body').innerText();
  if (editEmpText.includes('Edit') || editEmpText.includes('First Name') || editEmpText.includes('Save') || editEmpText.includes('Profile')) {
    console.log('   ✅ /employees/:id/edit rendered successfully without crash');
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('📊 FINAL TEST RESULTS:');
  console.log(`- Employee edit works: ${results.employeeEditWorks}`);
  console.log(`- Leave history renders: ${results.leaveHistoryRenders}`);
  console.log(`- Leave calendar renders: ${results.leaveCalendarRenders}`);
  console.log(`- Leave types renders: ${results.leaveTypesRenders}`);
  console.log(`- No .map errors: ${results.noMapErrors}`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
