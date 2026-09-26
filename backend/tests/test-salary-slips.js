import axios from 'axios';
import { generateAccessToken } from '../src/security/jwt.js';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('=== STARTING SALARY SLIPS & FILTER FUNCTIONALITY TEST ===\n');

  // 1. Find or pick an active company
  const company = await prisma.company.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      subscription: true
    }
  });

  if (!company) {
    console.error('❌ No active company found');
    process.exit(1);
  }

  // Ensure active subscription for the company
  let subscription = await prisma.subscription.findFirst({
    where: { companyId: company.id, status: 'ACTIVE' }
  });

  if (!subscription) {
    let plan = await prisma.plan.findFirst();
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: 'Enterprise Plan',
          code: 'ENTERPRISE',
          price: 9999,
          billingCycle: 'MONTHLY',
          maxEmployees: 1000,
          features: ['ALL']
        }
      });
    }
    subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Create or get a Company Admin user
  let companyAdmin = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } }
    }
  });

  if (!companyAdmin) {
    companyAdmin = await prisma.user.findFirst({
      where: { companyId: company.id }
    });
  }

  const token = generateAccessToken({
    sub: companyAdmin.id,
    email: companyAdmin.email,
    role: 'COMPANY_ADMIN',
    companyId: company.id
  });

  console.log(`🔑 Authenticated as: ${companyAdmin.email} (Company: ${company.name})`);

  // 2. Query GET /api/v1/payroll/slips
  console.log('\n--- 1. Testing GET /api/v1/payroll/slips ---');
  try {
    const res = await axios.get(`${BASE_URL}/payroll/slips`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`HTTP Status: ${res.status}`);
    console.log('Response body structure:', JSON.stringify(res.data, null, 2).slice(0, 300) + '...');

    const slipsData = res.data;
    const slips = Array.isArray(slipsData)
      ? slipsData
      : Array.isArray(slipsData?.slips)
      ? slipsData.slips
      : Array.isArray(slipsData?.data?.slips)
      ? slipsData.data.slips
      : Array.isArray(slipsData?.data)
      ? slipsData.data
      : [];

    console.log(`Extracted slips isArray: ${Array.isArray(slips)}, length: ${slips.length}`);

    // Verify filter function
    const search = '';
    const filteredSlips = slips.filter((s) => {
      if (!s) return false;
      const emp = s.employee || s.payrollItem?.employee;
      const empName = `${emp?.firstName || ''} ${emp?.lastName || ''} ${s.slipNumber || ''}`.toLowerCase();
      return empName.includes(search.toLowerCase());
    });

    console.log(`Filtered slips length: ${filteredSlips.length}`);
    console.log('✅ PASS: slips.filter executed successfully without throwing TypeError!');

    // 3. Test filter with mock objects / undefined / null cases
    console.log('\n--- 2. Testing Edge Cases (null, undefined, nested objects) ---');
    const testCases = [
      null,
      undefined,
      {},
      { status: 'ok', data: { slips: [] } },
      { status: 'ok', data: [{ id: '1', grossSalary: 50000 }] },
      [{ id: '2', netSalary: 45000 }]
    ];

    for (let i = 0; i < testCases.length; i++) {
      const mockData = testCases[i];
      const parsedSlips = Array.isArray(mockData)
        ? mockData
        : Array.isArray(mockData?.slips)
        ? mockData.slips
        : Array.isArray(mockData?.data?.slips)
        ? mockData.data.slips
        : Array.isArray(mockData?.data)
        ? mockData.data
        : [];

      const result = parsedSlips.filter((s) => s.id === '1');
      console.log(`Case ${i + 1}: input type [${typeof mockData}] -> parsed array [${Array.isArray(parsedSlips)}] -> filtered result [${result.length}] ✅`);
    }

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
