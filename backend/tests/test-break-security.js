import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';
import { FaceClient } from '../src/integrations/face/face.client.js';
import { encryptData } from '../src/security/encryption.js';

async function testBreakSecurity() {
  console.log('=== TEST BREAK START & END BIOMETRIC SECURITY ===\n');

  const branchId = 'f74c6719-d57a-4237-9a61-85fa9e9c7dc7';
  const companyId = '925af98c-24d1-4f9f-8f87-97a55734c7cd';

  // 1. Get employee and ensure face enrollment
  const employee = await prisma.employee.findFirst({
    where: { companyId },
    include: { user: true }
  });

  if (!employee) {
    console.error('Employee not found');
    return;
  }

  // Create valid registered face embedding for testing
  const enrolledFacePhoto = 'data:image/jpeg;base64,' + Buffer.from('TEST_ENROLLED_FACE_REYAZ_987654321').toString('base64');
  const enrolledEmbedding = await FaceClient.generateEmbedding(enrolledFacePhoto);
  const encryptedEmbedding = encryptData(enrolledEmbedding, true);

  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      faceEmbedding: encryptedEmbedding,
      faceRegisteredAt: new Date(),
      branchId
    }
  });

  console.log(`Enrolled face template for employee ${employee.employeeCode}`);

  const token = generateAccessToken({
    id: employee.userId,
    email: employee.user.email,
    companyId: employee.companyId,
    role: 'EMPLOYEE'
  });

  // 2. Clear today's attendance & check-in first
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.attendanceBreak.deleteMany({
    where: { employeeId: employee.id }
  });
  await prisma.attendanceLog.deleteMany({
    where: { employeeId: employee.id, attendanceDate: { gte: today } }
  });

  console.log('Performing check-in...');
  const checkinRes = await fetch('http://localhost:5000/api/v1/attendance/check-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'face',
      photo: enrolledFacePhoto,
      livenessScore: 0.95,
      location: { lat: 15.89659559, lng: 73.81949, accuracy: 25 },
      deviceInfo: { isMockLocation: false }
    })
  });
  const checkinData = await checkinRes.json();
  console.log('Check-in status:', checkinRes.status);
  if (checkinRes.status !== 200) {
    console.error('Check-in failed:', checkinData);
    return;
  }

  // 3. Test Break Start with FAILED Liveness (< 0.75)
  console.log('\n--- 1. Testing Break Start with Low Liveness (< 0.75) ---');
  const lowLivenessRes = await fetch('http://localhost:5000/api/v1/attendance/break-start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'face',
      breakType: 'SHORT',
      photo: enrolledFacePhoto,
      livenessScore: 0.50,
      location: { lat: 15.89659559, lng: 73.81949, accuracy: 25 },
      deviceInfo: { isMockLocation: false }
    })
  });
  const lowLivenessData = await lowLivenessRes.json();
  console.log('Low liveness response status:', lowLivenessRes.status);
  console.log('Low liveness error message:', lowLivenessData.message);
  const passLowLivenessBlock = lowLivenessRes.status === 403;
  console.log('Result:', passLowLivenessBlock ? 'PASS (Correctly blocked spoof)' : 'FAIL');

  // 4. Test Break Start with WRONG Face (Friend's face)
  console.log('\n--- 2. Testing Break Start with Mismatched Face ---');
  const wrongFacePhoto = 'data:image/jpeg;base64,' + Buffer.from('TEST_IMPOSTER_FACE_FRIEND_1122334455').toString('base64');
  const wrongFaceRes = await fetch('http://localhost:5000/api/v1/attendance/break-start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'face',
      breakType: 'SHORT',
      photo: wrongFacePhoto,
      livenessScore: 0.95,
      location: { lat: 15.89659559, lng: 73.81949, accuracy: 25 },
      deviceInfo: { isMockLocation: false }
    })
  });
  const wrongFaceData = await wrongFaceRes.json();
  console.log('Mismatched face response status:', wrongFaceRes.status);
  console.log('Mismatched face error message:', wrongFaceData.message);
  const passWrongFaceBlock = wrongFaceRes.status === 403;
  console.log('Result:', passWrongFaceBlock ? 'PASS (Correctly rejected imposter)' : 'FAIL');

  // 5. Test Break Start with VALID Face & Liveness
  console.log('\n--- 3. Testing Break Start with VALID Face & Liveness ---');
  const validStartRes = await fetch('http://localhost:5000/api/v1/attendance/break-start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'face',
      breakType: 'SHORT',
      photo: enrolledFacePhoto,
      livenessScore: 0.96,
      location: { lat: 15.89659559, lng: 73.81949, accuracy: 25 },
      deviceInfo: { isMockLocation: false }
    })
  });
  const validStartData = await validStartRes.json();
  console.log('Valid break start response status:', validStartRes.status);
  console.log('Valid break start response:', JSON.stringify(validStartData, null, 2));
  const passValidStart = validStartRes.status === 200;

  // Check DB for Break Start record
  const breakRecordStart = await prisma.attendanceBreak.findFirst({
    where: { employeeId: employee.id, breakEndAt: null }
  });
  console.log('\nDB Record after Break Start:');
  console.log({
    id: breakRecordStart?.id,
    breakStartAt: breakRecordStart?.breakStartAt,
    breakPhotoUrl: !!breakRecordStart?.breakPhotoUrl,
    breakStartPhotoUrl: !!breakRecordStart?.breakStartPhotoUrl,
    breakLivenessScore: breakRecordStart?.breakLivenessScore,
    breakFaceMatchScore: breakRecordStart?.breakFaceMatchScore
  });

  // 6. Test Break End with WRONG Face (Friend's face)
  console.log('\n--- 4. Testing Break End with Mismatched Face ---');
  const wrongEndRes = await fetch('http://localhost:5000/api/v1/attendance/break-end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'face',
      photo: wrongFacePhoto,
      livenessScore: 0.95,
      location: { lat: 15.89659559, lng: 73.81949, accuracy: 25 },
      deviceInfo: { isMockLocation: false }
    })
  });
  const wrongEndData = await wrongEndRes.json();
  console.log('Break end mismatch status:', wrongEndRes.status);
  console.log('Break end mismatch message:', wrongEndData.message);
  const passWrongEndBlock = wrongEndRes.status === 403;
  console.log('Result:', passWrongEndBlock ? 'PASS (Correctly rejected imposter on break end)' : 'FAIL');

  // 7. Test Break End with VALID Face & Liveness
  console.log('\n--- 5. Testing Break End with VALID Face & Liveness ---');
  const validEndRes = await fetch('http://localhost:5000/api/v1/attendance/break-end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'face',
      photo: enrolledFacePhoto,
      livenessScore: 0.98,
      location: { lat: 15.89659559, lng: 73.81949, accuracy: 25 },
      deviceInfo: { isMockLocation: false }
    })
  });
  const validEndData = await validEndRes.json();
  console.log('Valid break end status:', validEndRes.status);
  console.log('Valid break end response:', JSON.stringify(validEndData, null, 2));
  const passValidEnd = validEndRes.status === 200;

  // Check DB for Break End record
  const breakRecordEnd = await prisma.attendanceBreak.findUnique({
    where: { id: breakRecordStart.id }
  });
  console.log('\nDB Record after Break End:');
  console.log({
    id: breakRecordEnd?.id,
    breakStartAt: breakRecordEnd?.breakStartAt,
    breakEndAt: breakRecordEnd?.breakEndAt,
    breakStartPhotoUrl: !!breakRecordEnd?.breakStartPhotoUrl,
    breakLivenessScore: breakRecordEnd?.breakLivenessScore,
    breakFaceMatchScore: breakRecordEnd?.breakFaceMatchScore,
    breakEndPhotoUrl: !!breakRecordEnd?.breakEndPhotoUrl,
    breakEndLivenessScore: breakRecordEnd?.breakEndLivenessScore,
    breakEndFaceMatchScore: breakRecordEnd?.breakEndFaceMatchScore,
    totalBreakMinutes: breakRecordEnd?.totalBreakMinutes
  });

  console.log('\n=== SUMMARY OF RESULTS ===');
  console.log('Break Start Liveness Guard:', passLowLivenessBlock ? 'PASS' : 'FAIL');
  console.log('Break Start Face Match Guard:', passWrongFaceBlock ? 'PASS' : 'FAIL');
  console.log('Break Start Valid Execution:', passValidStart ? 'PASS' : 'FAIL');
  console.log('Break End Face Match Guard:', passWrongEndBlock ? 'PASS' : 'FAIL');
  console.log('Break End Valid Execution:', passValidEnd ? 'PASS' : 'FAIL');
  console.log('DB Security Fields Filled:', (breakRecordEnd.breakEndPhotoUrl && breakRecordEnd.breakEndLivenessScore && breakRecordEnd.breakEndFaceMatchScore) ? 'PASS' : 'FAIL');

  await prisma.$disconnect();
}

testBreakSecurity().catch(console.error);
