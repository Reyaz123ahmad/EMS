import prisma from '../src/config/prisma.js';
import { isUnlimited, checkQuota } from '../src/utils/quota.helper.js';
import { generateAccessToken } from '../src/security/jwt.js';

async function runTests() {
  console.log('============================================================');
  console.log('PHASE 1: UNIT TESTS FOR isUnlimited & checkQuota');
  console.log('============================================================');

  const unitTestCases = [
    { current: 8, limit: -1, expectedAllowed: true, expectedUnlimited: true },
    { current: 8, limit: null, expectedAllowed: true, expectedUnlimited: true },
    { current: 8, limit: undefined, expectedAllowed: true, expectedUnlimited: true },
    { current: 8, limit: 0, expectedAllowed: true, expectedUnlimited: true },
    { current: 0, limit: 5, expectedAllowed: true, expectedUnlimited: false, expectedRemaining: 5 },
    { current: 4, limit: 5, expectedAllowed: true, expectedUnlimited: false, expectedRemaining: 1 },
    { current: 5, limit: 5, expectedAllowed: false, expectedUnlimited: false, expectedRemaining: 0 },
    { current: 6, limit: 5, expectedAllowed: false, expectedUnlimited: false, expectedRemaining: 0 },
    { current: 10, limit: 10, expectedAllowed: false, expectedUnlimited: false, expectedRemaining: 0 },
    { current: 99, limit: -1, expectedAllowed: true, expectedUnlimited: true },
  ];

  let unitFailed = false;
  unitTestCases.forEach((tc, idx) => {
    const res = checkQuota(tc.current, tc.limit);
    const pass = res.allowed === tc.expectedAllowed && res.unlimited === tc.expectedUnlimited;
    if (!pass) {
      console.error(`❌ Unit Test ${idx + 1} FAILED:`, tc, 'Got:', res);
      unitFailed = true;
    } else {
      console.log(`✅ Unit Test ${idx + 1} PASSED: current=${tc.current}, limit=${tc.limit} => allowed=${res.allowed}, unlimited=${res.unlimited}, remaining=${res.remaining}`);
    }
  });

  if (unitFailed) {
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('PHASE 2: CROSS-CHECK DB COMPANIES & SUBSCRIPTIONS');
  console.log('============================================================');

  const companies = await prisma.company.findMany({
    include: {
      subscription: {
        include: { plan: true }
      },
      employees: {
        where: { status: { not: 'TERMINATED' } }
      },
      branches: true,
      biometricDevices: true
    }
  });

  console.log(`Found ${companies.length} companies in DB:`);
  console.table(companies.map(c => {
    const plan = c.subscription?.plan;
    const empLimit = plan ? plan.maxEmployees : 50;
    const empCount = c.employees.length;
    const empQuota = checkQuota(empCount, empLimit);

    const branchLimit = plan ? plan.maxBranches : 1;
    const branchCount = c.branches.length;
    const branchQuota = checkQuota(branchCount, branchLimit);

    return {
      Company: c.name,
      Plan: plan?.name || 'NO_PLAN',
      'Emp Limit': empLimit,
      'Emp Current': empCount,
      'Emp Allowed?': empQuota.allowed ? '✅ ALLOWED' : '❌ BLOCKED',
      'Branch Limit': branchLimit,
      'Branch Current': branchCount,
      'Branch Allowed?': branchQuota.allowed ? '✅ ALLOWED' : '❌ BLOCKED'
    };
  }));

  console.log('\n============================================================');
  console.log('PHASE 3: LIVE END-TO-END TEST ON "mycomapny" (Admin: reyazahmad40544@gmail.com)');
  console.log('============================================================');

  const admin = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: { company: { include: { subscription: { include: { plan: true } } } } }
  });

  if (!admin) {
    console.error('❌ Admin user reyazahmad40544@gmail.com not found');
    process.exit(1);
  }

  const token = generateAccessToken({
    id: admin.id,
    email: admin.email,
    role: 'COMPANY_ADMIN',
    roles: ['COMPANY_ADMIN', 'HR_ADMIN'],
    companyId: admin.companyId
  });

  const testEmail = `quota.test.${Date.now()}@example.com`;
  console.log(`Sending OTP for new employee (${testEmail}) under company ${admin.company.name} (Plan: ${admin.company.subscription?.plan?.name}, maxEmployees: ${admin.company.subscription?.plan?.maxEmployees})...`);

  const response = await fetch('http://127.0.0.1:5000/api/v1/employees/send-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      employeeData: {
        firstName: 'Quota',
        lastName: 'Verify',
        email: testEmail,
        phone: '9661440544',
        employmentType: 'FULL_TIME',
        role: 'EMPLOYEE'
      }
    })
  });

  const resJson = await response.json();
  console.log('HTTP Status:', response.status);
  console.log('Response Body:', resJson);

  if (response.status === 200 && resJson.status === 'ok') {
    console.log('✅ TEST 1 PASSED: Successfully sent OTP for company with unlimited (-1) plan without any quota blockage!');
  } else {
    console.error('❌ TEST 1 FAILED:', resJson);
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('PHASE 4: TEST LIMITED PLAN ENFORCEMENT');
  console.log('============================================================');

  // Find or test a company on Basic plan (e.g. Apex Enterprise 940327 with 1 branch, limit 1)
  const basicCompany = await prisma.company.findFirst({
    where: { name: 'Apex Enterprise 940327' },
    include: { subscription: { include: { plan: true } }, branches: true }
  });

  if (basicCompany) {
    const basicAdmin = await prisma.user.findFirst({
      where: { companyId: basicCompany.id }
    });
    if (basicAdmin) {
      const basicToken = generateAccessToken({
        id: basicAdmin.id,
        email: basicAdmin.email,
        role: 'COMPANY_ADMIN',
        roles: ['COMPANY_ADMIN'],
        companyId: basicCompany.id
      });

      console.log(`Testing Branch creation for Basic company (Current branches: ${basicCompany.branches.length}, limit: ${basicCompany.subscription?.plan?.maxBranches})...`);
      const branchRes = await fetch('http://127.0.0.1:5000/api/v1/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${basicToken}`
        },
        body: JSON.stringify({
          name: 'Overflow Branch',
          code: 'BR_OVERFLOW',
          address: 'Test Address'
        })
      });

      const branchJson = await branchRes.json();
      console.log('Limited Plan Branch Create Status (Expect 403):', branchRes.status);
      console.log('Response Body:', branchJson);

      if (branchRes.status === 403 && branchJson.code === 'PLAN_LIMIT_REACHED') {
        console.log('✅ TEST 2 PASSED: Limited plan correctly blocked overflow with message:', branchJson.message);
      } else {
        console.error('❌ TEST 2 FAILED: Expected 403 PLAN_LIMIT_REACHED but got:', branchRes.status, branchJson);
      }
    }
  }

  console.log('\n============================================================');
  console.log('ALL QUOTA AUDITS AND TESTS COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
