import { generateAccessToken } from '../src/security/jwt.js';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('====================================================');
  console.log('--- STARTING PHASE 5B BACKEND API INTEGRATION TESTS ---');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  // 1. Ensure Subscription Plans exist
  let defaultPlan = await prisma.subscriptionPlan.findFirst();
  if (!defaultPlan) {
    defaultPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise Plan',
        price: 9999,
        billingCycle: 'monthly',
        features: { payroll: true, attendance: true, biometric: true },
        maxEmployees: 500,
        maxBranches: 10,
        maxDevices: 10,
        maxStorageGB: 100,
        securityLevel: 'high',
        isActive: true,
      },
    });
  }

  let upgradePlan = await prisma.subscriptionPlan.findFirst({
    where: { id: { not: defaultPlan.id } },
  });
  if (!upgradePlan) {
    upgradePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Ultimate Unlimited Plan',
        price: 19999,
        billingCycle: 'monthly',
        features: { payroll: true, attendance: true, biometric: true, customReports: true },
        maxEmployees: 1000,
        maxBranches: 20,
        maxDevices: 20,
        maxStorageGB: 500,
        securityLevel: 'high',
        isActive: true,
      },
    });
  }

  // 2. Find or create test company with active subscription
  let company = await prisma.company.findFirst({
    include: { subscription: true }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'MindTech Global Solutions',
        companyCode: 'MIND-2026-0001',
        domain: `mindtech-${Date.now()}.com`,
        status: 'ACTIVE'
      }
    });
  } else if (!company.companyCode) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: { companyCode: `COMP-2026-${Date.now().toString().slice(-4)}`, status: 'ACTIVE' }
    });
  }

  // Ensure subscription is active and linked to plan
  let subscription = await prisma.subscription.findUnique({
    where: { companyId: company.id }
  });
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: defaultPlan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 86400000),
        trialEndsAt: new Date(Date.now() + 365 * 86400000),
        autoRenew: true
      }
    });
  } else {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: defaultPlan.id,
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 365 * 86400000),
        trialEndsAt: new Date(Date.now() + 365 * 86400000)
      }
    });
  }

  // 3. Ensure test PaymentTransaction exists
  let testTx = await prisma.paymentTransaction.findFirst({
    where: { subscriptionId: subscription.id }
  });
  if (!testTx) {
    testTx = await prisma.paymentTransaction.create({
      data: {
        subscriptionId: subscription.id,
        razorpayOrderId: `order_mock_${Date.now()}`,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        amount: 9999,
        currency: 'INR',
        status: 'SUCCESS'
      }
    });
  }

  // 4. Ensure test Client & Project exist
  let testClient = await prisma.client.findFirst({
    where: { companyId: company.id }
  });
  if (!testClient) {
    testClient = await prisma.client.create({
      data: {
        companyId: company.id,
        name: 'Nexus Corp Representative',
        email: 'rep@nexuscorp.com',
        companyName: 'Nexus Corp Global',
        isActive: true
      }
    });
  }

  let testProject = await prisma.project.findFirst({
    where: { companyId: company.id }
  });
  if (!testProject) {
    testProject = await prisma.project.create({
      data: {
        companyId: company.id,
        clientId: testClient.id,
        name: 'Enterprise Cloud Transition',
        description: 'Migration to modern scalable microservices',
        status: 'ACTIVE',
        budget: 750000
      }
    });
  }

  // 5. Ensure test Invoice exists
  let testInvoice = await prisma.invoice.findFirst({
    where: { subscriptionId: subscription.id }
  });
  if (!testInvoice) {
    testInvoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}`,
        amount: 9999,
        tax: 1799.82,
        total: 11798.82,
        status: 'PAID',
        paidAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000)
      }
    });
  }

  const mockAdminId = 'c32d6fcb-8e95-40ad-bc0b-036cd83a52a6';
  const mockCompanyId = company.id;

  const superAdminToken = generateAccessToken({
    id: mockAdminId,
    email: 'superadmin@edudibon.com',
    role: 'SUPER_ADMIN',
    companyId: mockCompanyId,
  });

  const companyAdminToken = generateAccessToken({
    id: mockAdminId,
    email: 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId: mockCompanyId,
  });

  const clientToken = generateAccessToken({
    id: mockAdminId,
    email: 'client@partner.com',
    role: 'CLIENT',
    companyId: mockCompanyId,
  });

  async function test(name, method, url, body = null, token = superAdminToken, expectedStatus = 200) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
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
        console.error(`❌ [FAIL] ${method} ${url} -> Expected ${expectedStatus}, got ${res.status}:`, JSON.stringify(data));
        failed++;
        return data;
      }
    } catch (err) {
      console.error(`❌ [ERR] ${method} ${url} ->`, err.message);
      failed++;
      return null;
    }
  }

  // 1. Unique ID Generator & Access By ID or Code
  console.log('\n--- PART 1: CUSTOM UNIQUE ID SYSTEM ---');
  const companiesRes = await test('List companies with customCode search', 'GET', '/companies?limit=5');
  const sampleCompany = companiesRes?.data?.companies?.[0] || company;
  if (sampleCompany?.id) {
    await test('Fetch Company by UUID', 'GET', `/companies/${sampleCompany.id}`);
    if (sampleCompany.companyCode) {
      await test('Fetch Company by companyCode', 'GET', `/companies/${sampleCompany.companyCode}`);
      await test('Search Company by companyCode', 'GET', `/companies?companyCode=${sampleCompany.companyCode}`);
    }
  }

  const empRes = await test('List Employees with code filter', 'GET', '/employees?limit=5', null, companyAdminToken);
  const sampleEmp = empRes?.data?.employees?.[0];
  if (sampleEmp?.id) {
    await test('Fetch Employee by UUID', 'GET', `/employees/${sampleEmp.id}`, null, companyAdminToken);
    if (sampleEmp.employeeCode) {
      await test('Fetch Employee by employeeCode', 'GET', `/employees/${sampleEmp.employeeCode}`, null, companyAdminToken);
    }
  }

  const brRes = await test('List Branches', 'GET', '/branches', null, companyAdminToken);
  const sampleBranch = brRes?.data?.branches?.[0];
  if (sampleBranch?.id) {
    await test('Fetch Branch by UUID', 'GET', `/branches/${sampleBranch.id}`, null, companyAdminToken);
    if (sampleBranch.branchCode) {
      await test('Fetch Branch by branchCode', 'GET', `/branches/${sampleBranch.branchCode}`, null, companyAdminToken);
    }
  }

  const deptRes = await test('List Departments', 'GET', '/departments', null, companyAdminToken);
  const sampleDept = deptRes?.data?.departments?.[0];
  if (sampleDept?.id) {
    await test('Fetch Department by UUID', 'GET', `/departments/${sampleDept.id}`, null, companyAdminToken);
    if (sampleDept.departmentCode) {
      await test('Fetch Department by departmentCode', 'GET', `/departments/${sampleDept.departmentCode}`, null, companyAdminToken);
    }
  }

  const desgRes = await test('List Designations', 'GET', '/designations', null, companyAdminToken);
  const sampleDesg = desgRes?.data?.designations?.[0];
  if (sampleDesg?.id) {
    await test('Fetch Designation by UUID', 'GET', `/designations/${sampleDesg.id}`, null, companyAdminToken);
    if (sampleDesg.designationCode) {
      await test('Fetch Designation by designationCode', 'GET', `/designations/${sampleDesg.designationCode}`, null, companyAdminToken);
    }
  }

  // 2. Refunds Flow
  console.log('\n--- PART 2: REFUND LIFECYCLE ---');
  await test('Get Refund Stats', 'GET', '/refunds/stats', null, companyAdminToken);
  await test('List Company Refunds', 'GET', '/refunds', null, companyAdminToken);
  await test('List All Refunds (Super Admin)', 'GET', '/refunds/all', null, superAdminToken);

  // System Issue Refund
  const systemRefundRes = await test('Super Admin System Issue Refund', 'POST', '/refunds/system-issue', {
    companyId: mockCompanyId,
    paymentId: testTx.id,
    amount: 500,
    description: 'SLA uptime breach compensation credit'
  }, superAdminToken);

  const createdRefundId = systemRefundRes?.data?.id;
  if (createdRefundId) {
    await test('Get Refund Details', 'GET', `/refunds/${createdRefundId}`, null, superAdminToken);
  }

  // Create a FAILED refund to test retry
  const failedRefund = await prisma.refundRequest.create({
    data: {
      paymentId: testTx.id,
      companyId: mockCompanyId,
      amount: 250,
      reason: 'Network disconnect during initial attempt',
      refundType: 'SYSTEM_ISSUE',
      status: 'FAILED',
      requestedBy: 'SYSTEM_ADMIN'
    }
  });
  await test('Retry Gateway Refund', 'POST', `/refunds/${failedRefund.id}/retry`, null, superAdminToken);

  // 3. Payment Failure Handling & Webhooks
  console.log('\n--- PART 3: PAYMENTS & WEBHOOKS ---');
  await test('Report Payment Failure', 'POST', '/payments/failure', {
    paymentId: testTx.id,
    reason: 'Insufficient funds on credit card'
  }, companyAdminToken);

  await test('Retry Payment Transaction', 'POST', '/payments/retry', {
    paymentId: testTx.id
  }, companyAdminToken);

  await test('Payment History', 'GET', '/payments/history', null, companyAdminToken);

  await test('Process Webhook (Public)', 'POST', '/payments/webhook', {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_webhook_test_01',
          amount: 500000,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  }, '');

  // 4. Subscriptions, Trials & Proration
  console.log('\n--- PART 4: SUBSCRIPTION, TRIALS & PRORATION ---');
  await test('Start Subscription Trial', 'POST', '/subscriptions/trial/start', {
    companyId: mockCompanyId,
    planId: defaultPlan.id
  }, superAdminToken);

  await test('Extend Subscription Trial', 'POST', '/subscriptions/trial/extend', {
    companyId: mockCompanyId,
    days: 7
  }, superAdminToken);

  await test('Calculate Proration Difference', 'POST', '/subscriptions/proration/calculate', {
    newPlanId: upgradePlan.id,
    changeType: 'UPGRADE'
  }, companyAdminToken);

  await test('Apply Proration Upgrade', 'POST', '/subscriptions/proration/apply', {
    newPlanId: upgradePlan.id,
    changeType: 'UPGRADE'
  }, companyAdminToken);

  // 5. Invoices & Tax
  console.log('\n--- PART 5: INVOICES & TAX ---');
  const invoicesRes = await test('List Invoices', 'GET', '/invoices', null, companyAdminToken);
  const sampleInv = invoicesRes?.data?.invoices?.[0] || testInvoice;
  if (sampleInv?.id) {
    await test('Download Invoice PDF', 'GET', `/invoices/${sampleInv.id}/download`, null, companyAdminToken);
    await test('Send Invoice Email', 'POST', `/invoices/${sampleInv.id}/send-email`, null, companyAdminToken);
  }

  // 6. Payment Analytics
  console.log('\n--- PART 6: PAYMENT ANALYTICS ---');
  await test('Get Revenue Analytics', 'GET', '/payment-analytics/revenue', null, companyAdminToken);
  await test('Get MRR', 'GET', '/payment-analytics/mrr', null, companyAdminToken);
  await test('Get ARR', 'GET', '/payment-analytics/arr', null, companyAdminToken);
  await test('Get Churn Rate', 'GET', '/payment-analytics/churn', null, companyAdminToken);
  await test('Get Payment Success Rate', 'GET', '/payment-analytics/success-rate', null, companyAdminToken);
  await test('Get Refund Rate', 'GET', '/payment-analytics/refund-rate', null, companyAdminToken);
  await test('Get Payment Method Stats', 'GET', '/payment-analytics/payment-methods', null, companyAdminToken);
  await test('Get Revenue by Plan', 'GET', '/payment-analytics/revenue-by-plan', null, companyAdminToken);

  // 7. Coupons & Discounts
  console.log('\n--- PART 7: COUPONS & DISCOUNTS ---');
  const newCouponCode = `TEST${Date.now().toString().slice(-4)}`;
  const createdCoupon = await test('Create Coupon', 'POST', '/coupons', {
    code: newCouponCode,
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxUses: 50,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 30 * 86400000).toISOString()
  }, superAdminToken);

  await test('List Coupons', 'GET', '/coupons', null, superAdminToken);
  await test('Validate Coupon Code', 'POST', '/coupons/validate', {
    code: newCouponCode,
    planId: defaultPlan.id
  }, companyAdminToken);
  await test('Apply Coupon Code', 'POST', '/coupons/apply', {
    code: newCouponCode,
    planId: defaultPlan.id,
    companyId: mockCompanyId
  }, companyAdminToken);
  await test('Get Coupon Stats', 'GET', '/coupons/stats', null, superAdminToken);

  if (createdCoupon?.data?.id) {
    await test('Update Coupon', 'PUT', `/coupons/${createdCoupon.data.id}`, {
      discountValue: 25,
      maxUses: 100
    }, superAdminToken);
    await test('Delete Coupon', 'DELETE', `/coupons/${createdCoupon.data.id}`, null, superAdminToken);
  }

  // 8. Client Portal
  console.log('\n--- PART 8: CLIENT PORTAL ---');
  await test('Get Client Dashboard', 'GET', '/client-portal/dashboard', null, clientToken);
  const clientProjects = await test('Get Client Projects', 'GET', '/client-portal/projects', null, clientToken);
  const sampleProj = Array.isArray(clientProjects?.data) ? clientProjects.data[0] : (clientProjects?.data?.projects?.[0] || testProject);
  if (sampleProj?.id) {
    await test('Get Client Project Detail', 'GET', `/client-portal/projects/${sampleProj.id}`, null, clientToken);
    await test('Create Requirement', 'POST', '/client-portal/requirements', {
      projectId: sampleProj.id,
      title: 'Real-time biometric punch sync optimization',
      description: 'Require punch events to sync in under 500ms over WebSocket connection',
      priority: 'HIGH'
    }, clientToken);
    await test('Post Discussion Comment', 'POST', '/client-portal/comments', {
      projectId: sampleProj.id,
      content: 'Deliverables verified and accepted for Sprint 4.'
    }, clientToken);
  }
  await test('Get Client Invoices', 'GET', '/client-portal/invoices', null, clientToken);
  await test('Get Client Payments', 'GET', '/client-portal/payments', null, clientToken);

  console.log('\n====================================================');
  console.log(`--- TEST RESULTS: Passed: ${passed}, Failed: ${failed} ---`);
  console.log('====================================================');
}

run();
