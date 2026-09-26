import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../src/security/jwt.js';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function testLiveness() {
  console.log('=== STARTING LIVENESS VERIFICATION INTEGRATION TEST ===\n');

  // Find a test user (either specific user or any active user with employee)
  let testUser = await prisma.user.findFirst({
    where: {
      id: 'b8c4e6e9-9f3e-43b7-9e6c-cbb7eea9233b'
    },
    include: {
      employee: true,
      userRoles: { include: { role: true } }
    }
  });

  if (!testUser) {
    testUser = await prisma.user.findFirst({
      where: {
        employee: { isNot: null }
      },
      include: {
        employee: true,
        userRoles: { include: { role: true } }
      }
    });
  }

  if (!testUser) {
    throw new Error('No user found to test liveness verification.');
  }

  console.log(`Testing with User: ${testUser.email} (ID: ${testUser.id})`);
  console.log(`Associated Employee: ${testUser.employee?.firstName} ${testUser.employee?.lastName} (Employee ID: ${testUser.employee?.id})\n`);

  const token = generateAccessToken({
    id: testUser.id,
    email: testUser.email,
    role: testUser.userRoles?.[0]?.role?.name || 'EMPLOYEE',
    companyId: testUser.companyId
  });

  // 1. Create Liveness Challenge via API
  console.log('[1/3] Calling POST /attendance-security/liveness/challenge...');
  const challengeRes = await axios.post(
    `${API_URL}/attendance-security/liveness/challenge`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const challengeData = challengeRes.data?.data;
  console.log('✅ Challenge created successfully:', challengeData);
  if (!challengeData?.challengeId) {
    throw new Error('No challengeId returned by server.');
  }

  // 2. Submit Verification via API
  console.log('\n[2/3] Calling POST /attendance-security/liveness/verify...');
  const verifyRes = await axios.post(
    `${API_URL}/attendance-security/liveness/verify`,
    {
      challengeId: challengeData.challengeId,
      livenessScore: 0.94,
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD'
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const verifyData = verifyRes.data?.data;
  console.log('✅ Verification result:', verifyData);

  // 3. Verify Database Record
  console.log('\n[3/3] Inspecting DB LivenessVerification record...');
  const dbVerification = await prisma.livenessVerification.findUnique({
    where: { id: verifyData.verificationId },
    include: { employee: true }
  });

  console.log(`Record in DB: Verification ID ${dbVerification.id}, Employee ID: ${dbVerification.employeeId}`);
  console.log(`Employee Name: ${dbVerification.employee.firstName} ${dbVerification.employee.lastName}`);
  console.log(`Liveness Score: ${dbVerification.livenessScore}, Passed: ${dbVerification.challengePassed}`);

  const passed = dbVerification.employeeId === testUser.employee.id && dbVerification.isLive;

  console.log('\n========================================');
  console.log(`TEST RESULTS:`);
  console.log(`Liveness verification works: ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`No foreign key error: ${passed ? 'PASS' : 'FAIL'}`);
  console.log('========================================\n');

  await prisma.$disconnect();
  process.exit(passed ? 0 : 1);
}

testLiveness().catch(async (err) => {
  console.error('❌ Liveness test failed:', err.response?.data || err.message);
  await prisma.$disconnect();
  process.exit(1);
});
