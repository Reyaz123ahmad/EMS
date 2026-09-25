import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runDevicesTests() {
  console.log('--- STARTING BIOMETRIC DEVICES & PUNCHES TEST SUITE ---');

  // 1. Setup seed data
  let company = await prisma.company.findFirst({
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  });

  if (company.subscription?.plan) {
    await prisma.subscriptionPlan.update({
      where: { id: company.subscription.plan.id },
      data: {
        features: {
          attendance: { face: true, card: true, finger: true, geoFencing: true, multiLayer: true },
          employees: true,
          leave: true,
          payroll: true,
          overtime: true,
          reports: true,
          documents: true,
          onboarding: true
        }
      }
    });
  }

  let employee = await prisma.employee.findFirst({
    where: { companyId: company.id }
  });

  const token = generateAccessToken({
    id: employee.userId || 'test-user-id',
    sub: employee.userId || 'test-user-id',
    email: employee.email || 'hr@company.com',
    role: 'HR_ADMIN',
    companyId: company.id
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  let registeredDeviceId = null;
  let deviceApiKey = null;
  const serialNumber = `ZKT-TEST-${Date.now().toString().slice(-6)}`;

  // TEST 1: Register Biometric Device (Full Payload)
  console.log('1. Testing Register Biometric Device...');
  const createRes = await fetch(`${BASE_URL}/biometric/devices`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Automated Test Fingerprint Terminal',
      serialNumber,
      deviceType: 'FINGERPRINT',
      ipAddress: '192.168.1.220',
      port: 4370
    })
  });
  const createData = await createRes.json();
  console.log('Create Device Status:', createRes.status, createData.status, 'API Key exists:', Boolean(createData.data?.apiKey));
  if (createRes.status !== 201) {
    throw new Error(`Create Device failed: ${JSON.stringify(createData)}`);
  }
  registeredDeviceId = createData.data?.id;
  deviceApiKey = createData.data?.apiKey;

  // TEST 2: List Biometric Devices
  console.log('2. Testing List Devices...');
  const listRes = await fetch(`${BASE_URL}/biometric/devices?page=1&limit=10`, {
    method: 'GET',
    headers: authHeaders
  });
  const listData = await listRes.json();
  console.log('List Devices Status:', listRes.status, 'Total Devices:', listData.data?.total);

  // TEST 3: Get Device Details & Heartbeat Status
  console.log('3. Testing Get Device Status...');
  const statusRes = await fetch(`${BASE_URL}/biometric/devices/${registeredDeviceId}/status`, {
    method: 'GET',
    headers: authHeaders
  });
  const statusData = await statusRes.json();
  console.log('Device Status:', statusRes.status, 'Online:', statusData.data?.isOnline);

  // TEST 4: Push Punch via Device Header Auth (Valid API Key)
  console.log('4. Testing Device Push Punch (x-api-key Auth)...');
  const pushRes = await fetch(`${BASE_URL}/biometric/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': deviceApiKey
    },
    body: JSON.stringify({
      employeeId: employee.id,
      punchType: 'CHECK_OUT',
      verification: 'FINGERPRINT',
      punchedAt: new Date().toISOString(),
      rawPayload: { sensorQuality: 99 }
    })
  });
  const pushData = await pushRes.json();
  console.log('Device Push Status:', pushRes.status, 'Received:', pushData.data?.received, 'Processed:', pushData.data?.processed);
  if (pushRes.status !== 201) {
    throw new Error(`Device Push failed: ${JSON.stringify(pushData)}`);
  }

  // TEST 5: Push Punch with Invalid Device API Key (Expect 401)
  console.log('5. Testing Device Push with Invalid API Key (Expect 401)...');
  const invalidPushRes = await fetch(`${BASE_URL}/biometric/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'invalid_fake_key_998877'
    },
    body: JSON.stringify({
      employeeId: employee.id,
      punchType: 'AUTO'
    })
  });
  console.log('Invalid Key Status (Expect 401):', invalidPushRes.status);
  if (invalidPushRes.status !== 401) {
    throw new Error('Invalid device key did not return 401');
  }

  // TEST 6: List Device Punches
  console.log('6. Testing List Device Punches...');
  const punchesRes = await fetch(`${BASE_URL}/biometric/punches?page=1&limit=10`, {
    method: 'GET',
    headers: authHeaders
  });
  const punchesData = await punchesRes.json();
  console.log('Punches List Status:', punchesRes.status, 'Count:', punchesData.data?.punches?.length);

  // TEST 7: Get Device Punch Stats
  console.log('7. Testing Get Device Punch Stats...');
  const statsRes = await fetch(`${BASE_URL}/biometric/stats`, {
    method: 'GET',
    headers: authHeaders
  });
  const statsData = await statsRes.json();
  console.log('Punch Stats Status:', statsRes.status, 'Total Punches:', statsData.data?.total);

  // TEST 8: Regenerate Device API Key
  console.log('8. Testing Regenerate Device API Key...');
  const regenRes = await fetch(`${BASE_URL}/biometric/devices/${registeredDeviceId}/regenerate-key`, {
    method: 'POST',
    headers: authHeaders
  });
  const regenData = await regenRes.json();
  console.log('Regenerate API Key Status:', regenRes.status, 'New Key differs:', regenData.data?.apiKey !== deviceApiKey);

  console.log('--- BIOMETRIC DEVICES SUITE COMPLETED SUCCESSFULLY ---');
}

export default runDevicesTests;
