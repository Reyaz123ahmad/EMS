import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('--- STARTING PHASE 4D BACKEND API TESTS ---');
  let passed = 0;
  let failed = 0;

  const mockUserId = 'c32d6fcb-8e95-40ad-bc0b-036cd83a52a6';
  const mockCompanyId = '1432e74d-35ab-4f27-956a-4fcf11c821c9';

  const token = generateAccessToken({
    id: mockUserId,
    email: 'superadmin@edudibon.com',
    role: 'SUPER_ADMIN',
    companyId: mockCompanyId,
  });


  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log(`Ready with Super Admin Token! Company ID: ${mockCompanyId}`);

  // Helper test runner
  async function test(name, method, url, body = null, expectedStatus = 200) {
    try {
      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE_URL}${url}`, opts);
      const data = await res.json();
      const isOk = res.status === expectedStatus || (expectedStatus === 200 && (res.status === 200 || res.status === 201));
      if (isOk) {
        console.log(`✅ [PASS] ${method} ${url} -> ${res.status}`);
        passed++;
        return data;
      } else {
        console.error(`❌ [FAIL] ${method} ${url} -> Expected ${expectedStatus}, got ${res.status}:`, data);
        failed++;
        return data;
      }
    } catch (err) {
      console.error(`❌ [ERR] ${method} ${url} ->`, err.message);
      failed++;
      return null;
    }
  }

  // PART 1: Subscriptions
  console.log('\n--- TESTING SUBSCRIPTION MODULE ---');
  const plansRes = await test('Get Plans', 'GET', '/subscriptions/plans');
  const validPlanId = plansRes?.data?.[0]?.id || '11111111-2222-3333-4444-555555555555';

  await test('Get Current Subscription', 'GET', '/subscriptions/current');
  await test('Check Subscription Expiry', 'GET', '/subscriptions/check-expiry');
  await test('Get Subscription Stats', 'GET', '/subscriptions/stats');
  await test('Get Subscription History', 'GET', '/subscriptions/history');
  
  await test('Create Razorpay Order', 'POST', '/subscriptions/orders', {
    planId: validPlanId,
    billingCycle: 'yearly',
  });
  
  await test('Verify Payment', 'POST', '/subscriptions/verify', {
    razorpayOrderId: 'order_test_12345',
    razorpayPaymentId: 'pay_test_12345',
    razorpaySignature: 'sig_test_12345',
    planId: validPlanId,
    billingCycle: 'yearly',
  });

  await test('Renew Subscription', 'POST', '/subscriptions/renew', {
    planId: validPlanId,
    billingCycle: 'monthly',
  });

  await test('Cancel Subscription', 'POST', '/subscriptions/cancel', {
    reason: 'Testing cancellation endpoint',
  });

  // PART 2: Company Settings
  console.log('\n--- TESTING COMPANY SETTINGS MODULE ---');
  await test('Get Settings Schema', 'GET', '/companies/settings/schema');
  
  const compList = await test('Get Companies List', 'GET', '/companies');
  const targetCompId = compList?.data?.companies?.[0]?.id || mockCompanyId;

  await test('Get Attendance Settings', 'GET', `/companies/${targetCompId}/settings/attendance`);
  await test('Update Attendance Settings', 'PUT', `/companies/${targetCompId}/settings/attendance`, {
    modes: { face: true, card: true, finger: true },
    geofence: { enabled: true, radiusMeters: 100 },
    timeRules: { graceMinutes: 15, halfDayThresholdHours: 4, fullDayHours: 8 },
  });

  await test('Get Security Settings', 'GET', `/companies/${targetCompId}/settings/security`);
  await test('Update Security Settings', 'PUT', `/companies/${targetCompId}/settings/security`, {
    level: 'HIGH',
    layers: ['FACE_LIVENESS', 'DEVICE_ATTESTATION', 'GEO_FENCING'],
    deviceAttestation: { required: true },
    ipWhitelist: ['192.168.1.1/24', '10.0.0.1'],
  });

  await test('Get Leave Settings', 'GET', `/companies/${targetCompId}/settings/leave`);
  await test('Update Leave Settings', 'PUT', `/companies/${targetCompId}/settings/leave`, {
    yearStartMonth: 1,
    carryForwardAllowed: true,
    maxCarryForwardDays: 15,
  });

  await test('Get Payroll Settings', 'GET', `/companies/${targetCompId}/settings/payroll`);
  await test('Update Payroll Settings', 'PUT', `/companies/${targetCompId}/settings/payroll`, {
    payCycle: 'MONTHLY',
    payDay: 30,
    tdsDeduction: true,
    pfDeduction: true,
  });

  await test('Get Notification Settings', 'GET', `/companies/${targetCompId}/settings/notifications`);
  await test('Update Notification Settings', 'PUT', `/companies/${targetCompId}/settings/notifications`, {
    channels: { email: true, sms: false, push: true, inApp: true },
    events: { punchAlert: true, leaveApproved: true },
  });

  await test('Get General Settings', 'GET', `/companies/${targetCompId}/settings/general`);
  await test('Update General Settings', 'PUT', `/companies/${targetCompId}/settings/general`, {
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'YYYY-MM-DD',
    workWeekDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  });

  await test('Reset Settings', 'POST', `/companies/${targetCompId}/settings/reset`, {
    settingType: 'general',
  });

  // PART 3: Advanced Security
  console.log('\n--- TESTING ADVANCED SECURITY MODULE ---');
  await test('Get Security Dashboard', 'GET', '/security/dashboard');
  await test('Get Security Score', 'GET', '/security/security-score');
  await test('Get Security Events', 'GET', '/security/events');
  await test('Get Audit Logs', 'GET', '/security/audit-logs');
  await test('Export Audit Logs', 'GET', '/security/audit-logs/export');
  await test('Get Blocked Employees', 'GET', '/security/blocked-employees');

  // PART 4: Approvals Module
  console.log('\n--- TESTING APPROVALS MODULE ---');
  await test('Get Workflows List', 'GET', '/approvals/workflows');
  await test('Get Approval Stats', 'GET', '/approvals/stats');
  await test('Get Pending Approvals', 'GET', '/approvals/pending');
  await test('Get Approval History', 'GET', '/approvals/history');

  const wfCreated = await test('Create Workflow', 'POST', '/approvals/workflows', {
    name: 'Leave Approval Workflow',
    entityType: 'LEAVE',
    levels: [
      { level: 1, role: 'MANAGER', name: 'Direct Manager' },
      { level: 2, role: 'HR_ADMIN', name: 'HR Admin' },
    ],
    isActive: true,
  }, 201);

  const wfId = wfCreated?.data?.id;
  if (wfId) {
    await test('Get Workflow by ID', 'GET', `/approvals/workflows/${wfId}`);
    await test('Get Workflow by Entity Type', 'GET', `/approvals/workflows/type/LEAVE`);
    await test('Update Workflow', 'PUT', `/approvals/workflows/${wfId}`, {
      name: 'Updated Leave Workflow',
    });
  }

  // PART 5: Assets Module
  console.log('\n--- TESTING ASSETS MODULE ---');
  await test('Get Assets List', 'GET', '/assets');
  await test('Get Asset Stats', 'GET', '/assets/stats');
  await test('Get Asset Categories', 'GET', '/assets/categories');
  await test('Export Assets', 'GET', '/assets/export');

  await test('Create Asset Category', 'POST', '/assets/categories', {
    name: 'Electronics',
    description: 'Laptops, Monitors, Gadgets',
  }, 201);

  const assetCreated = await test('Create Asset', 'POST', '/assets', {
    name: 'MacBook Pro 16 M3',
    code: `MBP-${Date.now()}`,
    category: 'Electronics',
    description: 'Developer workstation',
    purchasePrice: 249999.00,
    condition: 'NEW',
    isActive: true,
  }, 201);

  const assetId = assetCreated?.data?.id;
  if (assetId) {
    await test('Get Asset by ID', 'GET', `/assets/${assetId}`);
    await test('Update Asset', 'PUT', `/assets/${assetId}`, {
      condition: 'EXCELLENT',
    });
    await test('Get Asset History', 'GET', `/assets/${assetId}/history`);
  }

  await test('Bulk Import Assets', 'POST', '/assets/bulk-import', {
    assets: [
      { name: 'Dell 27 Monitor', code: `MON-${Date.now()}-1`, category: 'Electronics', purchasePrice: 25000, condition: 'NEW' },
      { name: 'Logitech MX Master', code: `MOU-${Date.now()}-2`, category: 'Peripherals', purchasePrice: 8500, condition: 'NEW' },
    ],
  }, 201);

  // PART 6: Emergency Attendance Module
  console.log('\n--- TESTING EMERGENCY ATTENDANCE MODULE ---');
  await test('Get Emergency Attendance Requests', 'GET', '/emergency-attendance');
  await test('Get Emergency Attendance Stats', 'GET', '/emergency-attendance/stats');

  // PART 7: Queue Monitor Module
  console.log('\n--- TESTING QUEUE MONITOR MODULE ---');
  await test('Get Queue Stats', 'GET', '/admin/queues/stats');
  await test('Get Queue Health', 'GET', '/admin/queues/health');
  await test('Get Attendance Queue Jobs', 'GET', '/admin/queues/attendance-queue/jobs');
  await test('Pause Queue', 'POST', '/admin/queues/attendance-queue/pause');
  await test('Resume Queue', 'POST', '/admin/queues/attendance-queue/resume');
  await test('Clean Queue', 'POST', '/admin/queues/attendance-queue/clean', {
    gracePeriod: 0,
    status: 'completed',
    limit: 50,
  });

  console.log('\n========================================');
  console.log(`PHASE 4D TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
