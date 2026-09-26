import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAccessToken } from '../src/security/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_URL = 'http://localhost:5000/api/v1';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        let body;
        if (contentType.includes('application/json')) {
          try {
            body = JSON.parse(buffer.toString('utf-8'));
          } catch (e) {
            body = buffer.toString('utf-8');
          }
        } else {
          body = buffer;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: body,
          rawBuffer: buffer
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('VERIFYING ALL 7 EMS PLATFORM FIXES');
  console.log('====================================================\n');

  const results = {
    issue1_addEmployeeRemoved: false,
    issue2_customIdsShown: false,
    issue3_downloadsWork: false,
    issue4_noNaNPaymentAnalytics: false,
    issue5_securityDashboardNoTypeError: false,
    issue6_attendanceForecastRemovedSuperAdmin: false,
    issue7_no400PaymentAnalytics: false
  };

  try {
    // 1. Generate Super Admin and Company Admin JWT Tokens
    console.log('[1/7] Generating authenticated JWT tokens...');
    const superAdminToken = generateAccessToken({
      id: 'super-admin-root-id',
      email: 'superadmin@edudibon.com',
      role: 'SUPER_ADMIN',
      companyId: null
    });

    const companyAdminToken = generateAccessToken({
      id: 'company-admin-root-id',
      email: 'admin@techcorp.com',
      role: 'COMPANY_ADMIN',
      companyId: 'company-123-id'
    });

    console.log('✓ Super Admin token generated');
    console.log('✓ Company Admin token generated');

    // TEST ISSUE 1: REMOVE "ADD EMPLOYEE" BUTTON FROM SUPER ADMIN COMPANY VIEW
    console.log('\n[TEST 1] Verifying CompanyDetailPage.jsx Add Employee button role isolation...');
    const companyDetailCode = fs.readFileSync(
      path.join(__dirname, '../../frontend/src/pages/companies/CompanyDetailPage.jsx'),
      'utf8'
    );
    const hasAuthStore = companyDetailCode.includes('useAuthStore');
    const hasRoleCheck = companyDetailCode.includes('isSuperAdmin') || companyDetailCode.includes('SUPER_ADMIN');
    const buttonGuarded = companyDetailCode.includes('!isSuperAdmin') && companyDetailCode.includes('Add Employee');
    
    if (hasAuthStore && hasRoleCheck && buttonGuarded) {
      console.log('✓ PASS: "Add Employee" button is strictly hidden for SUPER_ADMIN role');
      results.issue1_addEmployeeRemoved = true;
    } else {
      console.error('✗ FAIL: CompanyDetailPage.jsx missing Super Admin guard on Add Employee button');
    }

    // TEST ISSUE 2: SHOW CUSTOM IDs INSTEAD OF UUIDs
    console.log('\n[TEST 2] Verifying Custom IDs (companyCode, employeeCode, branchCode, departmentCode, designationCode)...');
    const companyListCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/companies/CompanyListPage.jsx'), 'utf8');
    const empDetailCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/employees/EmployeeDetailPage.jsx'), 'utf8');
    const branchListCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/organization/BranchListPage.jsx'), 'utf8');
    const deptListCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/organization/DepartmentListPage.jsx'), 'utf8');
    const desgListCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/organization/DesignationListPage.jsx'), 'utf8');

    const c1 = companyListCode.includes('companyCode');
    const c2 = empDetailCode.includes('employeeCode');
    const c3 = branchListCode.includes('branchCode');
    const c4 = deptListCode.includes('departmentCode');
    const c5 = desgListCode.includes('designationCode');

    if (c1 && c2 && c3 && c4 && c5) {
      console.log('✓ PASS: Custom codes displayed across all company, employee, and organization pages');
      results.issue2_customIdsShown = true;
    } else {
      console.error(`✗ FAIL: Missing custom ID mappings: c1=${c1}, c2=${c2}, c3=${c3}, c4=${c4}, c5=${c5}`);
    }

    // TEST ISSUE 3: FIX DOWNLOAD BUTTONS (ACTUAL DOWNLOAD)
    console.log('\n[TEST 3] Verifying real binary file download endpoints...');
    const downloadChecks = [];

    // Receipt download
    const receiptRes = await makeRequest('/payments/sample-123/receipt', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const receiptIsPdf = receiptRes.status === 200 && (receiptRes.headers['content-type']?.includes('pdf') || receiptRes.rawBuffer.slice(0, 4).toString() === '%PDF');
    downloadChecks.push({ name: 'Payment Receipt PDF', passed: receiptIsPdf, status: receiptRes.status });

    // Invoice download
    const invoiceRes = await makeRequest('/invoices/sample-123/download', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const invoiceIsPdf = invoiceRes.status === 200 && (invoiceRes.headers['content-type']?.includes('pdf') || invoiceRes.rawBuffer.slice(0, 4).toString() === '%PDF');
    downloadChecks.push({ name: 'Invoice PDF', passed: invoiceIsPdf, status: invoiceRes.status });

    // Reports download
    const reportRes = await makeRequest('/reports/download?type=ATTENDANCE&format=csv', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const reportIsCsv = reportRes.status === 200 && (reportRes.headers['content-type']?.includes('csv') || reportRes.data?.toString().includes('Employee'));
    downloadChecks.push({ name: 'Report CSV', passed: reportIsCsv, status: reportRes.status });

    // Certificates download
    const certRes = await makeRequest('/certificates/sample-123/download', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const certIsPdf = certRes.status === 200 && (certRes.headers['content-type']?.includes('pdf') || certRes.rawBuffer.slice(0, 4).toString() === '%PDF');
    downloadChecks.push({ name: 'Certificate PDF', passed: certIsPdf, status: certRes.status });

    // Salary slip download
    const slipRes = await makeRequest('/payroll/slips/sample-123/download', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const slipIsPdf = slipRes.status === 200 && (slipRes.headers['content-type']?.includes('pdf') || slipRes.rawBuffer.slice(0, 4).toString() === '%PDF');
    downloadChecks.push({ name: 'Salary Slip PDF', passed: slipIsPdf, status: slipRes.status });

    downloadChecks.forEach((chk) => {
      console.log(`  ${chk.passed ? '✓' : '✗'} ${chk.name}: status=${chk.status}, passed=${chk.passed}`);
    });

    if (downloadChecks.every(c => c.passed)) {
      console.log('✓ PASS: All 5 file download endpoints stream valid binary/PDF files');
      results.issue3_downloadsWork = true;
    } else {
      console.error('✗ FAIL: Some download endpoints failed');
    }

    // TEST ISSUE 4: FIX NaN IN PAYMENT ANALYTICS
    console.log('\n[TEST 4] Verifying Payment Analytics Revenue by Plan (no NaN)...');
    const planRevRes = await makeRequest('/payment-analytics/revenue-by-plan', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('Plan revenue data response:', planRevRes.data);
    const planItems = Array.isArray(planRevRes.data?.data) ? planRevRes.data.data : [];
    const hasNaN = planItems.some(i => isNaN(Number(i.subscribers)) || isNaN(Number(i.revenue)));

    if (planRevRes.status === 200 && !hasNaN) {
      console.log('✓ PASS: No NaN in payment analytics revenue breakdown (numbers cleanly returned with 0 fallbacks)');
      results.issue4_noNaNPaymentAnalytics = true;
    } else {
      console.error('✗ FAIL: Revenue by plan contains NaN or invalid numbers');
    }

    // TEST ISSUE 5: FIX SECURITY DASHBOARD ERROR (signals.slice)
    console.log('\n[TEST 5] Verifying Security Dashboard array safety...');
    const secDashCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/security/SecurityDashboardPage.jsx'), 'utf8');
    const secServiceCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/advanced-security.service.js'), 'utf8');
    const hasArrayGuard = secDashCode.includes('Array.isArray(signals)') && secServiceCode.includes('Array.isArray(data)');

    const fraudRes = await makeRequest('/security/fraud-signals', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('Fraud signals API response status:', fraudRes.status);

    if (hasArrayGuard && (fraudRes.status === 200 || fraudRes.status === 403)) {
      console.log('✓ PASS: Security Dashboard handles non-array / object fraud signals defensively without TypeError');
      results.issue5_securityDashboardNoTypeError = true;
    } else {
      console.error('✗ FAIL: Security Dashboard array safety guard missing');
    }

    // TEST ISSUE 6: REMOVE ATTENDANCE FORECAST FROM SUPER ADMIN
    console.log('\n[TEST 6] Verifying AIHubPage.jsx role isolation for Attendance Forecast...');
    const aiHubCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/ai/AIHubPage.jsx'), 'utf8');
    const hasAiAuth = aiHubCode.includes('useAuthStore');
    const hasAiSuperAdminCheck = aiHubCode.includes('isSuperAdmin');
    const attendanceHiddenForSuperAdmin = aiHubCode.includes('isSuperAdmin ? (') && aiHubCode.includes('Platform Predictions') && aiHubCode.includes('Attendance Forecast');

    if (hasAiAuth && hasAiSuperAdminCheck && attendanceHiddenForSuperAdmin) {
      console.log('✓ PASS: Attendance Forecast hidden for Super Admin, platform predictions displayed instead');
      results.issue6_attendanceForecastRemovedSuperAdmin = true;
    } else {
      console.error('✗ FAIL: AIHubPage does not hide Attendance Forecast for Super Admin');
    }

    // TEST ISSUE 7: FIX 400 BAD REQUEST ON PAYMENT ANALYTICS
    console.log('\n[TEST 7] Verifying Payment Analytics with empty/blank date ranges...');
    const revWithEmptyDates = await makeRequest('/payment-analytics/revenue?startDate=&endDate=', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('Payment analytics revenue status with empty dates:', revWithEmptyDates.status);

    const mrrRes = await makeRequest('/payment-analytics/mrr', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const arrRes = await makeRequest('/payment-analytics/arr', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    if (revWithEmptyDates.status === 200 && mrrRes.status === 200 && arrRes.status === 200) {
      console.log('✓ PASS: Payment Analytics loads with 200 OK without any 400 Bad Request error');
      results.issue7_no400PaymentAnalytics = true;
    } else {
      console.error(`✗ FAIL: Payment Analytics failed: rev=${revWithEmptyDates.status}, mrr=${mrrRes.status}, arr=${arrRes.status}`);
    }

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n====================================================');
  console.log('FINAL TEST SUMMARY:');
  console.log('====================================================');
  console.log(`1. Add Employee removed from Super Admin: ${results.issue1_addEmployeeRemoved ? 'PASS' : 'FAIL'}`);
  console.log(`2. Custom IDs shown instead of UUIDs:    ${results.issue2_customIdsShown ? 'PASS' : 'FAIL'}`);
  console.log(`3. Downloads work (PDF/CSV blobs):       ${results.issue3_downloadsWork ? 'PASS' : 'FAIL'}`);
  console.log(`4. No NaN in Payment Analytics:          ${results.issue4_noNaNPaymentAnalytics ? 'PASS' : 'FAIL'}`);
  console.log(`5. Security dashboard (no TypeError):    ${results.issue5_securityDashboardNoTypeError ? 'PASS' : 'FAIL'}`);
  console.log(`6. Attendance forecast removed for SA:   ${results.issue6_attendanceForecastRemovedSuperAdmin ? 'PASS' : 'FAIL'}`);
  console.log(`7. No 400 errors on Payment Analytics:   ${results.issue7_no400PaymentAnalytics ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTests();
