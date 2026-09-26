import { PrismaClient } from '@prisma/client';
import { faceRegistrationService } from '../src/modules/face-registration/face-registration.service.js';
import { faceMatchService } from '../src/modules/attendance-security/attendance-security.service.js';
import { decryptData } from '../src/security/encryption.js';
import { cosineSimilarity } from '../src/utils/face-similarity.js';
import { FaceClient } from '../src/integrations/face/face.client.js';

const prisma = new PrismaClient();

async function runFaceTests() {
  console.log('====================================================');
  console.log('🔒 BIOMETRIC FACE MATCHING & ANTI-SPOOFING TESTS');
  console.log('====================================================\n');

  // Find or create test employee
  let testEmployee = await prisma.employee.findFirst({
    where: { status: 'ACTIVE' },
    include: { company: true }
  });

  if (!testEmployee) {
    throw new Error('No active employee found for face testing.');
  }

  console.log(`Test Subject: ${testEmployee.firstName} ${testEmployee.lastName} (ID: ${testEmployee.id})`);
  console.log(`Company: ${testEmployee.company?.name || testEmployee.companyId}\n`);

  // Distinct Face Image Payloads
  const personAFacePhoto1 = 'data:image/jpeg;base64,' + Buffer.from('PERSON_A_SUBJECT_ENROLLMENT_FACE_LANDMARKS_DATA_FRAME_1_PRIMARY_BIOMETRIC_PROFILE').toString('base64');
  const personAFacePhoto2 = 'data:image/jpeg;base64,' + Buffer.from('PERSON_A_SUBJECT_ENROLLMENT_FACE_LANDMARKS_DATA_FRAME_1_PRIMARY_BIOMETRIC_PROFILE').toString('base64');
  const personBFacePhoto = 'data:image/jpeg;base64,' + Buffer.from('PERSON_B_COMPLETELY_DIFFERENT_INDIVIDUAL_FACIAL_STRUCTURE_UNAUTHORIZED_PROXY').toString('base64');
  const corruptPayload = 'data:image/jpeg;base64,invalid';

  // 1. TEST: Register Face for Employee
  console.log('[1/5] Registering master face biometric profile for employee...');
  const regResult = await faceRegistrationService.registerFace({
    employeeId: testEmployee.id,
    companyId: testEmployee.companyId,
    photo: personAFacePhoto1,
    livenessScore: 0.95
  });

  console.log('✅ Registration completed:', regResult.message);

  // 2. TEST: Check DB Encrypted Embedding
  console.log('\n[2/5] Checking DB faceEmbedding encryption & persistence...');
  const updatedEmp = await prisma.employee.findUnique({
    where: { id: testEmployee.id }
  });

  const hasEmbedding = Boolean(updatedEmp.faceEmbedding && updatedEmp.faceEmbedding.length > 50);
  const decryptedVector = decryptData(updatedEmp.faceEmbedding, true);
  const isValidVector = Array.isArray(decryptedVector) && decryptedVector.length === 512;

  console.log(`DB Encrypted Length: ${updatedEmp.faceEmbedding?.length} characters`);
  console.log(`Decrypted Dimensions: ${decryptedVector?.length} floats`);
  console.log(`Embedding in DB: ${hasEmbedding && isValidVector ? 'PASS' : 'FAIL'}`);

  // 3. TEST: Match with SAME person
  console.log('\n[3/5] Testing face match with SAME person (Authorized)...');
  const samePersonMatch = await faceMatchService.matchFace(updatedEmp, personAFacePhoto2);
  console.log('Same Person Match Result:', samePersonMatch);
  const samePersonPass = samePersonMatch.passed === true && samePersonMatch.score >= 0.90;
  console.log(`Same person match: ${samePersonPass ? 'PASS' : 'FAIL'} (Score: ${Math.round(samePersonMatch.score * 100)}%, Threshold: ${Math.round(samePersonMatch.threshold * 100)}%)`);

  // 4. TEST: Match with DIFFERENT person
  console.log('\n[4/5] Testing face match with DIFFERENT person / Friend (Unauthorized Proxy)...');
  const differentPersonMatch = await faceMatchService.matchFace(updatedEmp, personBFacePhoto);
  console.log('Different Person Match Result:', differentPersonMatch);
  const differentPersonPass = differentPersonMatch.passed === false && differentPersonMatch.score < 0.90;
  console.log(`Different person match rejected: ${differentPersonPass ? 'PASS' : 'FAIL'} (Score: ${Math.round(differentPersonMatch.score * 100)}%, Reason: ${differentPersonMatch.reason})`);

  // 5. TEST: Match with No Face / Corrupt image
  console.log('\n[5/5] Testing match with corrupt / empty face payload...');
  const corruptMatch = await faceMatchService.matchFace(updatedEmp, corruptPayload);
  console.log('Corrupt Image Match Result:', corruptMatch);
  const corruptPass = corruptMatch.passed === false;
  console.log(`Corrupt payload rejected: ${corruptPass ? 'PASS' : 'FAIL'} (Reason: ${corruptMatch.reason})`);

  console.log('\n====================================================');
  console.log('TEST SUMMARY:');
  console.log(`1. Face embedding stored in DB: ${hasEmbedding && isValidVector ? 'PASS' : 'FAIL'}`);
  console.log(`2. Same person match (Score >= 90%): ${samePersonPass ? 'PASS' : 'FAIL'}`);
  console.log(`3. Different person match rejected (Score < 90%): ${differentPersonPass ? 'PASS' : 'FAIL'}`);
  console.log(`4. No face / corrupt payload rejected: ${corruptPass ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');

  const allPassed = hasEmbedding && isValidVector && samePersonPass && differentPersonPass && corruptPass;
  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

runFaceTests().catch(async (err) => {
  console.error('Fatal face testing error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
