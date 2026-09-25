import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runFingerAttendanceTests() {
  console.log('--- STARTING FINGER ATTENDANCE TEST SUITE ---');

  // 1. Setup seed data
  let company = await prisma.company.findFirst();
  let employee = await prisma.employee.findFirst({
    where: { companyId: company.id }
  });
  let device = await prisma.biometricDevice.findFirst({
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

  const sampleTemplate = Buffer.from('ISO_MINUTIAE_FINGERPRINT_SAMPLE_VECTOR_9988').toString('base64');

  // TEST 1: Enroll Fingerprint Template (Full Payload)
  console.log('1. Testing Enroll Fingerprint Template...');
  const enrollRes = await fetch(`${BASE_URL}/finger/enroll`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      fingerIndex: 1, // Right Index
      template: sampleTemplate,
      templateFormat: 'ISO',
      deviceId: device?.id || null
    })
  });
  const enrollData = await enrollRes.json();
  console.log('Enroll Status:', enrollRes.status, 'Enrolled:', enrollData.data?.enrolled, 'Format:', enrollData.data?.templateFormat);
  if (enrollRes.status !== 201) {
    throw new Error(`Enroll Fingerprint failed: ${JSON.stringify(enrollData)}`);
  }

  // TEST 2: Get Employee Enrolled Fingers
  console.log('2. Testing Get Employee Enrolled Fingers...');
  const getEnrollRes = await fetch(`${BASE_URL}/finger/enroll/${employee.id}`, {
    method: 'GET',
    headers: authHeaders
  });
  const getEnrollData = await getEnrollRes.json();
  console.log('Get Enrolled Fingers Status:', getEnrollRes.status, 'Count:', getEnrollData.data?.length);

  // TEST 3: Hardware Device Push Punch
  if (device?.apiKey) {
    console.log('3. Testing Hardware Fingerprint Push Punch (x-api-key Auth)...');
    const punchRes = await fetch(`${BASE_URL}/finger/punch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': device.apiKey
      },
      body: JSON.stringify({
        employeeId: employee.id,
        fingerIndex: 1,
        punchType: 'CHECK_IN',
        verification: 'FINGERPRINT',
        punchedAt: new Date().toISOString()
      })
    });
    const punchData = await punchRes.json();
    console.log('Finger Push Punch Status:', punchRes.status, 'Received:', punchData.data?.received);
  }

  // TEST 4: Hardware Template Sync
  if (device) {
    console.log('4. Testing Device Template Synchronization...');
    const syncRes = await fetch(`${BASE_URL}/finger/sync/${device.id}`, {
      method: 'POST',
      headers: authHeaders
    });
    const syncData = await syncRes.json();
    console.log('Sync Status:', syncRes.status, 'Synced Templates:', syncData.data?.templatesCount);
  }

  // TEST 5: Finger Stats
  console.log('5. Testing Fingerprint Statistics...');
  const statsRes = await fetch(`${BASE_URL}/finger/stats`, {
    method: 'GET',
    headers: authHeaders
  });
  const statsData = await statsRes.json();
  console.log('Finger Stats Status:', statsRes.status, 'Total Enrollments:', statsData.data?.totalEnrollments);

  // TEST 6: List Finger Punches
  console.log('6. Testing List Finger Punches...');
  const punchesRes = await fetch(`${BASE_URL}/finger/punches?page=1&limit=10`, {
    method: 'GET',
    headers: authHeaders
  });
  const punchesData = await punchesRes.json();
  console.log('Punches List Status:', punchesRes.status, 'Total Punches:', punchesData.data?.pagination?.total);

  // TEST 7: Delete Enrolled Finger
  console.log('7. Testing Delete Enrolled Fingerprint...');
  const delRes = await fetch(`${BASE_URL}/finger/enroll/${employee.id}/1`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const delData = await delRes.json();
  console.log('Delete Finger Status:', delRes.status, 'Deleted:', delData.data?.deleted);

  console.log('--- FINGER ATTENDANCE SUITE COMPLETED SUCCESSFULLY ---');
}

export default runFingerAttendanceTests;
