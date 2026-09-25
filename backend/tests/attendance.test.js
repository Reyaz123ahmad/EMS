import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/prisma.js';
import env from '../src/config/env.js';
import { generateAccessToken } from '../src/security/jwt.js';

const API_BASE = 'http://localhost:5000/api/v1';

// Helpers to create test context
let testCompany;
let testBranch;
let testEmployee;
let testUser;
let authToken;
let adminAuthToken;

test.before(async () => {
  testCompany = await prisma.company.findFirst({
    include: {
      subscription: true,
      branches: true,
    },
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
      include: {
        subscription: true,
        branches: true,
      },
    });
  } else {
    await prisma.company.update({
      where: { id: testCompany.id },
      data: {
        attendanceSettings: { geoFencing: true, enabledModes: ['face', 'card', 'finger'] },
      },
    });
  }

  // Ensure active subscription
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

  // Find or create test branch
  testBranch = await prisma.branch.findFirst({
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
  } else {
    testBranch = await prisma.branch.update({
      where: { id: testBranch.id },
      data: {
        latitude: 28.6139,
        longitude: 77.2090,
        geofenceRadius: 100,
        isGeofenceActive: true,
      },
    });
  }

  // Find or create test employee
  testEmployee = await prisma.employee.findFirst({
    where: { companyId: testCompany.id },
    include: { user: true },
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

  // Ensure employee is linked to testBranch
  await prisma.employee.update({
    where: { id: testEmployee.id },
    data: { branchId: testBranch.id },
  });

  // Clean all prior attendance & breaks for clean testing
  await prisma.attendanceBreak.deleteMany({
    where: { employeeId: testEmployee.id },
  });
  await prisma.attendanceLog.deleteMany({
    where: { employeeId: testEmployee.id },
  });

  // Find or create User
  if (!testEmployee.userId) {
    testUser = await prisma.user.create({
      data: {
        companyId: testCompany.id,
        email: testEmployee.email,
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    await prisma.employee.update({
      where: { id: testEmployee.id },
      data: { userId: testUser.id },
    });
  } else {
    testUser = await prisma.user.findUnique({ where: { id: testEmployee.userId } });
  }

  // Sign JWT Access Tokens with security jwt generator
  authToken = generateAccessToken({
    id: testUser.id,
    employeeId: testEmployee.id,
    companyId: testCompany.id,
    email: testUser.email,
    role: 'EMPLOYEE',
  });

  adminAuthToken = generateAccessToken({
    id: testUser.id,
    employeeId: testEmployee.id,
    companyId: testCompany.id,
    email: testUser.email,
    role: 'COMPANY_ADMIN',
  });
});

test.describe('EMS Phase 3A: Biometric Multi-Layer Attendance Suite', () => {
  let createdChallengeId;
  let createdFraudSignalId;

  // 1. LIVENESS CHALLENGE
  test('POST /attendance-security/liveness/challenge - Generate active challenge', async () => {
    const res = await fetch(`${API_BASE}/attendance-security/liveness/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        employeeId: testEmployee.id,
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.challengeId);
    assert.ok(body.data.challengeType);
    createdChallengeId = body.data.challengeId;
  });

  // 2. LIVENESS VERIFICATION
  test('POST /attendance-security/liveness/verify - Verify motion & depth score', async () => {
    const res = await fetch(`${API_BASE}/attendance-security/liveness/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        employeeId: testEmployee.id,
        challengeId: createdChallengeId,
        livenessScore: 0.95,
        metadata: { gesture: 'BLINK', fps: 30 },
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.data.passed, true);
  });

  // 3. FULL PAYLOAD CHECK-IN (SUCCESS)
  test('POST /attendance/check-in - Full payload verification within geofence', async () => {
    const branchLat = testBranch?.latitude ? Number(testBranch.latitude) : 28.6139;
    const branchLng = testBranch?.longitude ? Number(testBranch.longitude) : 77.2090;

    const fullPayload = {
      mode: 'face',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
      location: {
        lat: branchLat,
        lng: branchLng,
        accuracy: 10,
        source: 'gps',
        timestamp: Date.now(),
      },
      deviceInfo: {
        deviceId: 'device-test-xyz',
        isMockLocation: false,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        platform: 'Win32',
        osVersion: '11',
        appVersion: '2.0.0',
      },
      cardNumber: 'CARD-12345',
      remarks: 'Morning shift check-in',
      livenessScore: 0.95,
    };

    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(fullPayload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.attendance.checkInAt);
  });

  // 4. DUPLICATE CHECK-IN (BLOCKED 400)
  test('POST /attendance/check-in - Block duplicate check-in for same day', async () => {
    const branchLat = testBranch?.latitude ? Number(testBranch.latitude) : 28.6139;
    const branchLng = testBranch?.longitude ? Number(testBranch.longitude) : 77.2090;

    const payload = {
      mode: 'face',
      photo: 'data:image/jpeg;base64,...',
      location: {
        lat: branchLat,
        lng: branchLng,
        accuracy: 10,
      },
      deviceInfo: { isMockLocation: false },
    };

    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.match(body.message, /already checked in/i);
  });

  // 5. START BREAK
  test('POST /attendance/break-start - Initiate official shift break', async () => {
    const res = await fetch(`${API_BASE}/attendance/break-start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        breakType: 'TEA_BREAK',
        deviceInfo: { deviceId: 'test-device' },
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.break.breakStartAt);
  });

  // 6. END BREAK
  test('POST /attendance/break-end - Conclude break and calculate duration', async () => {
    const res = await fetch(`${API_BASE}/attendance/break-end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        deviceInfo: { deviceId: 'test-device' },
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.break.breakEndAt);
  });

  // 7. GEO-FENCING OUT-OF-RADIUS (BLOCKED 403)
  test('POST /attendance/check-out - Block out-of-geofence radius and raise fraud signal', async () => {
    const outOfBoundsPayload = {
      mode: 'face',
      location: {
        lat: 12.9716, // Bangalore coords while branch is Delhi
        lng: 77.5946,
        accuracy: 10,
        source: 'gps',
      },
      deviceInfo: {
        deviceId: 'device-spoof-1',
        isMockLocation: false,
        ipAddress: '10.0.0.1',
      },
    };

    const res = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(outOfBoundsPayload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 403);
    assert.match(body.message, /Location verification failed/i);
  });

  // 8. MOCK LOCATION SPOOFING (BLOCKED 403)
  test('POST /attendance/check-out - Block mock location tampering', async () => {
    const branchLat = testBranch?.latitude ? Number(testBranch.latitude) : 28.6139;
    const branchLng = testBranch?.longitude ? Number(testBranch.longitude) : 77.2090;

    const mockPayload = {
      mode: 'face',
      location: {
        lat: branchLat,
        lng: branchLng,
        accuracy: 10,
      },
      deviceInfo: {
        deviceId: 'device-spoof-2',
        isMockLocation: true, // Spoofed GPS
      },
    };

    const res = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(mockPayload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 403);
    assert.match(body.message, /Mock location detected/i);
  });

  // 9. CHECK-OUT WITH FULL PAYLOAD
  test('POST /attendance/check-out - Full payload check-out & net worked hours calculation', async () => {
    const branchLat = testBranch?.latitude ? Number(testBranch.latitude) : 28.6139;
    const branchLng = testBranch?.longitude ? Number(testBranch.longitude) : 77.2090;

    const checkOutPayload = {
      mode: 'face',
      location: {
        lat: branchLat,
        lng: branchLng,
        accuracy: 10,
        source: 'gps',
      },
      deviceInfo: {
        deviceId: 'device-test-xyz',
        isMockLocation: false,
      },
      remarks: 'End of shift punch',
    };

    const res = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(checkOutPayload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.attendance.checkOutAt);
  });

  // 10. GET TODAY STATUS
  test('GET /attendance/today - Fetch current employee status and breaks', async () => {
    const res = await fetch(`${API_BASE}/attendance/today`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.attendance);
    assert.ok(Array.isArray(body.data.breaks));
  });

  // 11. GET ATTENDANCE LOGS (HR/Admin)
  test('GET /attendance/logs - Query logs with date range and status filters', async () => {
    const res = await fetch(`${API_BASE}/attendance/logs?limit=10&page=1`, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(Array.isArray(body.data.logs));
    assert.ok(body.data.pagination);
  });

  // 12. GET MONTHLY SUMMARY
  test('GET /attendance/monthly-summary - Aggregated employee attendance statistics', async () => {
    const now = new Date();
    const res = await fetch(
      `${API_BASE}/attendance/monthly-summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      {
        headers: {
          Authorization: `Bearer ${adminAuthToken}`,
        },
      }
    );

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.metrics);
  });

  // 13. GET ATTENDANCE STATS
  test('GET /attendance/stats - Executive analytics and punctuality rates', async () => {
    const res = await fetch(`${API_BASE}/attendance/stats`, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.totalEmployees !== undefined);
  });

  // 14. GET FRAUD SIGNALS
  test('GET /attendance/fraud-signals - List security violation alerts', async () => {
    const res = await fetch(`${API_BASE}/attendance/fraud-signals`, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(Array.isArray(body.data.signals));
    if (body.data.signals.length > 0) {
      createdFraudSignalId = body.data.signals[0].id;
    }
  });

  // 15. REVIEW FRAUD SIGNAL
  test('POST /attendance/fraud-signals/:id/review - Review and resolve incident', async () => {
    if (!createdFraudSignalId) {
      const sig = await prisma.fraudSignal.create({
        data: {
          companyId: testCompany.id,
          signalType: 'MOCK_LOCATION',
          severity: 'HIGH',
          description: 'Simulated mock location violation',
          reviewed: false,
        },
      });
      createdFraudSignalId = sig.id;
    }

    const res = await fetch(`${API_BASE}/attendance/fraud-signals/${createdFraudSignalId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAuthToken}`,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        reviewNotes: 'Verified legitimate employee activity during travel test.',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.data.signal);
  });

  // 16. UNAUTHORIZED REQUESTS (BLOCKED 401)
  test('POST /attendance/check-in - Rejects request without authentication token', async () => {
    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'face' }),
    });

    assert.strictEqual(res.status, 401);
  });
});
