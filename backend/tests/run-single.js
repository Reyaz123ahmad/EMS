import prisma from '../src/config/prisma.js';
import env from '../src/config/env.js';
import { generateAccessToken } from '../src/security/jwt.js';

const API_BASE = 'http://localhost:5000/api/v1';

async function runAll() {
  console.log('--- STARTING ATTENDANCE FULL SUITE ---');

  let testCompany = await prisma.company.findFirst({
    include: { subscription: true, branches: true },
  });

  if (!testCompany) {
    testCompany = await prisma.company.create({
      data: {
        name: 'Test Enterprise Corp',
        slug: 'test-enterprise-' + Date.now(),
        email: `test-${Date.now()}@enterprise.com`,
        status: 'ACTIVE',
        attendanceSettings: { geoFencing: true, enabledModes: ['face', 'card', 'finger'] },
      },
      include: { subscription: true, branches: true },
    });
  } else {
    await prisma.company.update({
      where: { id: testCompany.id },
      data: {
        attendanceSettings: { geoFencing: true, enabledModes: ['face', 'card', 'finger'] },
      },
    });
  }

  // Subscription
  if (!testCompany.subscription) {
    let plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Enterprise Ultra',
          price: 4999,
          maxEmployees: 1000,
          maxBranches: 50,
          maxDevices: 100,
          features: {
            attendance: { face: true, card: true, finger: true, geoFencing: true, multiLayer: true },
            employees: true,
            leave: true,
            payroll: true,
          },
        },
      });
    }

    await prisma.subscription.create({
      data: {
        companyId: testCompany.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  let testBranch = await prisma.branch.findFirst({
    where: { companyId: testCompany.id },
  });

  if (!testBranch) {
    testBranch = await prisma.branch.create({
      data: {
        companyId: testCompany.id,
        name: 'Headquarters',
        code: 'HQ-01',
        latitude: 28.6139,
        longitude: 77.2090,
        geofenceRadius: 100,
        isGeofenceActive: true,
        address: '123 Connaught Place, New Delhi',
      },
    });
  }

  let testEmployee = await prisma.employee.findFirst({
    where: { companyId: testCompany.id },
  });

  if (!testEmployee) {
    testEmployee = await prisma.employee.create({
      data: {
        companyId: testCompany.id,
        branchId: testBranch.id,
        employeeCode: 'EMP-TEST-99',
        firstName: 'Alex',
        lastName: 'Biometric',
        email: `alex.test.${Date.now()}@enterprise.com`,
        status: 'ACTIVE',
      },
    });
  }

  await prisma.employee.update({
    where: { id: testEmployee.id },
    data: { branchId: testBranch.id },
  });

  await prisma.attendanceBreak.deleteMany({
    where: { employeeId: testEmployee.id },
  });
  await prisma.attendanceLog.deleteMany({
    where: { employeeId: testEmployee.id },
  });

  let testUser = await prisma.user.findFirst({
    where: { email: testEmployee.email },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        companyId: testCompany.id,
        email: testEmployee.email,
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
  }

  const authToken = generateAccessToken({
    id: testUser.id,
    employeeId: testEmployee.id,
    companyId: testCompany.id,
    email: testUser.email,
    role: 'EMPLOYEE',
  });

  const adminAuthToken = generateAccessToken({
    id: testUser.id,
    employeeId: testEmployee.id,
    companyId: testCompany.id,
    email: testUser.email,
    role: 'COMPANY_ADMIN',
  });

  // 1. Challenge
  console.log('1. Testing Liveness Challenge...');
  const res1 = await fetch(`${API_BASE}/attendance-security/liveness/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ employeeId: testEmployee.id }),
  });
  const json1 = await res1.json();
  console.log('Challenge Status:', res1.status, json1.status, 'challengeId:', json1.data?.challengeId);

  // 2. Verify
  console.log('2. Testing Liveness Verify...');
  const res2 = await fetch(`${API_BASE}/attendance-security/liveness/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      employeeId: testEmployee.id,
      challengeId: json1.data.challengeId,
      livenessScore: 0.94,
    }),
  });
  const json2 = await res2.json();
  console.log('Verify Status:', res2.status, json2.status, 'passed:', json2.data?.passed);

  // 3. Check-In Full Payload
  console.log('3. Testing Check-In Full Payload...');
  const res3 = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      mode: 'face',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      location: {
        lat: Number(testBranch.latitude),
        lng: Number(testBranch.longitude),
        accuracy: 10,
        source: 'gps',
        timestamp: Date.now(),
      },
      deviceInfo: {
        deviceId: 'device-abc-123',
        isMockLocation: false,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        platform: 'Android',
      },
      cardNumber: 'CARD-12345',
      remarks: 'Morning shift start',
      livenessScore: 0.95,
    }),
  });
  const json3 = await res3.json();
  console.log('Check-In Status:', res3.status, json3.status, 'checkInAt:', json3.data?.attendance?.checkInAt);

  // 4. Duplicate Check-In
  console.log('4. Testing Duplicate Check-In (Should block 400)...');
  const res4 = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      mode: 'face',
      location: { lat: Number(testBranch.latitude), lng: Number(testBranch.longitude), accuracy: 10 },
      deviceInfo: { isMockLocation: false },
    }),
  });
  const json4 = await res4.json();
  console.log('Duplicate Status (Expect 400):', res4.status, json4.message);

  // 5. Break Start
  console.log('5. Testing Break Start...');
  const res5 = await fetch(`${API_BASE}/attendance/break-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ breakType: 'TEA_BREAK', deviceInfo: { deviceId: 'test-device' } }),
  });
  const json5 = await res5.json();
  console.log('Break Start Status:', res5.status, json5.status, 'breakStartAt:', json5.data?.break?.breakStartAt);

  // 6. Break End
  console.log('6. Testing Break End...');
  const res6 = await fetch(`${API_BASE}/attendance/break-end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ deviceInfo: { deviceId: 'test-device' } }),
  });
  const json6 = await res6.json();
  console.log('Break End Status:', res6.status, json6.status, 'totalBreakMinutes:', json6.data?.break?.totalBreakMinutes);

  // 7. Check-Out Out of Geofence
  console.log('7. Testing Check-Out Out of Geofence (Should block 403)...');
  const res7 = await fetch(`${API_BASE}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      mode: 'face',
      location: { lat: 12.9716, lng: 77.5946, accuracy: 10, source: 'gps' },
      deviceInfo: { isMockLocation: false },
    }),
  });
  const json7 = await res7.json();
  console.log('Geofence Check-Out Status (Expect 403):', res7.status, json7.message);

  // 8. Check-Out Mock Location
  console.log('8. Testing Check-Out Mock Location (Should block 403)...');
  const res8 = await fetch(`${API_BASE}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      mode: 'face',
      location: { lat: Number(testBranch.latitude), lng: Number(testBranch.longitude), accuracy: 10 },
      deviceInfo: { isMockLocation: true },
    }),
  });
  const json8 = await res8.json();
  console.log('Mock Location Status (Expect 403):', res8.status, json8.message);

  // 9. Check-Out Full Payload
  console.log('9. Testing Check-Out Full Payload...');
  const res9 = await fetch(`${API_BASE}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      mode: 'face',
      location: { lat: Number(testBranch.latitude), lng: Number(testBranch.longitude), accuracy: 10 },
      deviceInfo: { isMockLocation: false },
      remarks: 'Shift conclusion',
    }),
  });
  const json9 = await res9.json();
  console.log('Check-Out Status:', res9.status, json9.status, 'checkOutAt:', json9.data?.attendance?.checkOutAt);

  // 10. Get Today Status
  console.log('10. Testing Get Today Status...');
  const res10 = await fetch(`${API_BASE}/attendance/today`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const json10 = await res10.json();
  console.log('Today Status:', res10.status, json10.status, 'checkOutAt exists:', Boolean(json10.data?.attendance?.checkOutAt));

  // 11. Get Logs
  console.log('11. Testing Get Logs (HR)...');
  const res11 = await fetch(`${API_BASE}/attendance/logs?limit=10&page=1`, {
    headers: { Authorization: `Bearer ${adminAuthToken}` },
  });
  const json11 = await res11.json();
  console.log('Logs Status:', res11.status, 'Total Logs:', json11.data?.logs?.length);

  // 12. Monthly Summary
  console.log('12. Testing Monthly Summary...');
  const now = new Date();
  const res12 = await fetch(`${API_BASE}/attendance/monthly-summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {
    headers: { Authorization: `Bearer ${adminAuthToken}` },
  });
  const json12 = await res12.json();
  console.log('Monthly Summary Status:', res12.status, 'Present count:', json12.data?.metrics?.present);

  // 13. Stats
  console.log('13. Testing Stats...');
  const res13 = await fetch(`${API_BASE}/attendance/stats`, {
    headers: { Authorization: `Bearer ${adminAuthToken}` },
  });
  const json13 = await res13.json();
  console.log('Stats Status:', res13.status, 'Total Employees:', json13.data?.totalEmployees);

  // 14. List Fraud Signals
  console.log('14. Testing List Fraud Signals...');
  const res14 = await fetch(`${API_BASE}/attendance/fraud-signals`, {
    headers: { Authorization: `Bearer ${adminAuthToken}` },
  });
  const json14 = await res14.json();
  console.log('Fraud Signals Status:', res14.status, 'Signal Count:', json14.data?.signals?.length);

  // 15. Review Fraud Signal
  console.log('15. Testing Review Fraud Signal...');
  let signalId = json14.data?.signals?.[0]?.id;
  if (!signalId) {
    const createdSig = await prisma.fraudSignal.create({
      data: {
        companyId: testCompany.id,
        signalType: 'MOCK_LOCATION',
        severity: 'HIGH',
        description: 'Simulated alert',
        reviewed: false,
      },
    });
    signalId = createdSig.id;
  }
  const res15 = await fetch(`${API_BASE}/attendance/fraud-signals/${signalId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuthToken}` },
    body: JSON.stringify({ status: 'RESOLVED', reviewNotes: 'Incident audited.' }),
  });
  const json15 = await res15.json();
  console.log('Review Signal Status:', res15.status, json15.status, 'reviewed:', json15.data?.signal?.reviewed);

  // 16. Unauthorized
  console.log('16. Testing Unauthorized...');
  const res16 = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'face' }),
  });
  console.log('Unauthorized Status (Expect 401):', res16.status);

  console.log('--- ALL 16 TESTS EXECUTED SUCCESSFULLY ---');
}

runAll().catch(console.error);
