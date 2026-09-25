import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runFaceRegistrationTests() {
  console.log('--- STARTING FACE REGISTRATION TEST SUITE ---');

  // 1. Setup seed company & employee
  let company = await prisma.company.findFirst();
  let employee = await prisma.employee.findFirst({
    where: { companyId: company.id }
  });

  const token = generateAccessToken({
    id: employee.userId || 'test-user-id',
    sub: employee.userId || 'test-user-id',
    email: employee.email || 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId: company.id
  });


  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const samplePhoto = 'data:image/jpeg;base64,' + Buffer.from('face_mock_biometric_probe_sample_data').toString('base64');

  // TEST 1: Register Face (Full Payload)
  console.log('1. Testing Register Face (Full Payload)...');
  const regRes = await fetch(`${BASE_URL}/face/register`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      photo: samplePhoto,
      livenessScore: 0.96
    })
  });
  const regData = await regRes.json();
  console.log('Register Face Status:', regRes.status, regData.status, 'Message:', regData.message);
  if (regRes.status !== 201) {
    throw new Error(`Register Face failed: ${JSON.stringify(regData)}`);
  }

  // TEST 2: Liveness Failure Check (Expect 400 when score < 0.85)
  console.log('2. Testing Liveness Failure (Score 0.60 - Expect 400)...');
  const failLivenessRes = await fetch(`${BASE_URL}/face/register`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      photo: samplePhoto,
      livenessScore: 0.60
    })
  });
  const failLivenessData = await failLivenessRes.json();
  console.log('Liveness Failure Status (Expect 400):', failLivenessRes.status, failLivenessData.message);
  if (failLivenessRes.status !== 400) {
    throw new Error(`Liveness score below threshold did not return 400`);
  }

  // TEST 3: Verify Face (Probe Photo Match)
  console.log('3. Testing Verify Face (Cosine Similarity)...');
  const verifyRes = await fetch(`${BASE_URL}/face/verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      photo: samplePhoto
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify Face Status:', verifyRes.status, 'Matched:', verifyData.data?.matched, 'Score:', verifyData.data?.score);
  if (verifyRes.status !== 200 || !verifyData.data?.matched) {
    throw new Error(`Verify Face failed: ${JSON.stringify(verifyData)}`);
  }

  // TEST 4: Get Face Status
  console.log('4. Testing Get Face Status...');
  const statusRes = await fetch(`${BASE_URL}/face/status/${employee.id}`, {
    method: 'GET',
    headers: authHeaders
  });
  const statusData = await statusRes.json();
  console.log('Face Status:', statusRes.status, 'Registered:', statusData.data?.registered);

  // TEST 5: List Employees With Face
  console.log('5. Testing List Employees With Face...');
  const withFaceRes = await fetch(`${BASE_URL}/face/with-face?page=1&limit=10`, {
    method: 'GET',
    headers: authHeaders
  });
  const withFaceData = await withFaceRes.json();
  console.log('With Face Status:', withFaceRes.status, 'Count:', withFaceData.data?.employees?.length);

  // TEST 6: Face Stats
  console.log('6. Testing Face Registration Stats...');
  const statsRes = await fetch(`${BASE_URL}/face/stats`, {
    method: 'GET',
    headers: authHeaders
  });
  const statsData = await statsRes.json();
  console.log('Stats Status:', statsRes.status, 'Coverage:', statsData.data?.percentage + '%');

  // TEST 7: Export Embeddings
  console.log('7. Testing Export Face Embeddings...');
  const exportRes = await fetch(`${BASE_URL}/face/export`, {
    method: 'GET',
    headers: authHeaders
  });
  const exportData = await exportRes.json();
  console.log('Export Status:', exportRes.status, 'Exported Count:', exportData.data?.count);

  // TEST 8: Delete / Reset Face
  console.log('8. Testing Delete / Reset Face...');
  const deleteRes = await fetch(`${BASE_URL}/face/delete`, {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      reason: 'Automated test biometric reset'
    })
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Face Status:', deleteRes.status, 'Deleted:', deleteData.data?.deleted);

  console.log('--- FACE REGISTRATION SUITE COMPLETED SUCCESSFULLY ---');
}

export default runFaceRegistrationTests;
