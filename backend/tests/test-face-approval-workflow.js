import prisma from '../src/config/prisma.js';
import { faceRegistrationService } from '../src/modules/face-registration/face-registration.service.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';
import * as faceService from '../src/services/face.service.js';
import { decryptData } from '../src/security/encryption.js';

async function runApprovalWorkflowTests() {
  console.log('====================================================');
  console.log('FACE REGISTRATION APPROVAL WORKFLOW INTEGRATION TEST');
  console.log('====================================================\n');

  // Load face models
  await faceService.loadModels();

  // Find company
  const company = await prisma.company.findFirst();
  if (!company) throw new Error('No test company found');
  const companyId = company.id;

  // Find or create Company Admin
  let adminEmployee = await prisma.employee.findFirst({
    where: {
      companyId,
      user: { userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } } }
    },
    include: { user: { include: { userRoles: { include: { role: true } } } } }
  });

  if (!adminEmployee) {
    adminEmployee = await prisma.employee.findFirst({ where: { companyId } });
  }

  // Find or create Standard Employee
  let regularEmployee = await prisma.employee.findFirst({
    where: {
      companyId,
      id: { not: adminEmployee.id }
    },
    include: { user: { include: { userRoles: { include: { role: true } } } } }
  });

  if (!regularEmployee) {
    regularEmployee = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: `EMP-TEST-${Date.now().toString().slice(-4)}`,
        firstName: 'Test',
        lastName: 'Employee',
        email: `test.employee.${Date.now()}@example.com`,
        joiningDate: new Date()
      },
      include: { user: { include: { userRoles: { include: { role: true } } } } }
    });
  }

  // Create mock realistic base64 image (1x1 transparent PNG or canvas)
  const canvasMod = await import('canvas');
  const { createCanvas } = canvasMod.default || canvasMod;
  const testCanvas = createCanvas(200, 200);
  const ctx = testCanvas.getContext('2d');
  ctx.fillStyle = '#f0c080';
  ctx.beginPath();
  ctx.arc(100, 100, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(80, 85, 8, 0, Math.PI * 2); // left eye
  ctx.arc(120, 85, 8, 0, Math.PI * 2); // right eye
  ctx.fill();
  ctx.beginPath();
  ctx.arc(100, 130, 20, 0, Math.PI); // smile
  ctx.stroke();

  const testPhotoBase64 = testCanvas.toDataURL('image/jpeg', 0.9);

  // Mock embedding vector for deterministic testing
  const mockVector = new Array(128).fill(0).map((_, i) => Math.sin(i * 0.45));
  const norm = Math.sqrt(mockVector.reduce((sum, v) => sum + v * v, 0));
  const normalizedVector = mockVector.map(v => v / norm);

  // Set mock embedding provider for deterministic testing
  faceService.setEmbeddingProvider(async () => normalizedVector);

  console.log(`Company ID: ${companyId}`);
  console.log(`Admin Employee ID: ${adminEmployee.id}`);
  console.log(`Regular Employee ID: ${regularEmployee.id}\n`);

  // Clean previous requests for regularEmployee
  await prisma.faceRegistrationRequest.deleteMany({
    where: { employeeId: regularEmployee.id }
  });
  await prisma.employee.update({
    where: { id: regularEmployee.id },
    data: { faceEmbedding: null, faceRegisteredAt: null, facePhotoUrl: null }
  });

  // ----------------------------------------------------
  // TEST 1: Company Admin Direct Registration (No Approval)
  // ----------------------------------------------------
  console.log('--- TEST 1: COMPANY ADMIN DIRECT REGISTRATION ---');
  const adminRegResult = await faceRegistrationService.registerFace({
    employeeId: adminEmployee.id,
    companyId,
    photo: testPhotoBase64,
    livenessScore: 0.96,
    registeredBy: adminEmployee.userId || adminEmployee.id,
    role: 'COMPANY_ADMIN'
  });

  console.log('Admin Registration Result:', adminRegResult);
  console.log(`Requires Approval: ${adminRegResult.requiresApproval} (Expected: false)`);
  console.log(`Face Registered: ${adminRegResult.registered} (Expected: true)`);

  const refreshedAdmin = await prisma.employee.findUnique({
    where: { id: adminEmployee.id }
  });
  const adminHasFace = Boolean(refreshedAdmin?.faceEmbedding && refreshedAdmin?.faceRegisteredAt);
  console.log(`Admin Employee DB Face Enrolled: ${adminHasFace} (Expected: true)`);

  if (adminRegResult.requiresApproval || !adminHasFace) {
    throw new Error('TEST 1 FAILED: Company Admin should register face directly without approval');
  }
  console.log('✅ TEST 1 PASSED: Company Admin registered directly.\n');

  // ----------------------------------------------------
  // TEST 2: Regular Employee Registration (Requires Approval)
  // ----------------------------------------------------
  console.log('--- TEST 2: REGULAR EMPLOYEE REGISTRATION (REQUIRES APPROVAL) ---');
  const empRegResult = await faceRegistrationService.registerFace({
    employeeId: regularEmployee.id,
    companyId,
    photo: testPhotoBase64,
    livenessScore: 0.95,
    registeredBy: regularEmployee.userId || regularEmployee.id,
    role: 'EMPLOYEE'
  });

  console.log('Employee Registration Result:', empRegResult);
  console.log(`Requires Approval: ${empRegResult.requiresApproval} (Expected: true)`);
  console.log(`Pending Request ID: ${empRegResult.requestId}`);

  const refreshedEmpBeforeApproval = await prisma.employee.findUnique({
    where: { id: regularEmployee.id }
  });
  const empHasFaceBeforeApproval = Boolean(refreshedEmpBeforeApproval?.faceEmbedding && refreshedEmpBeforeApproval?.faceRegisteredAt);
  console.log(`Employee DB Face Enrolled Before Approval: ${empHasFaceBeforeApproval} (Expected: false)`);

  if (!empRegResult.requiresApproval || empHasFaceBeforeApproval) {
    throw new Error('TEST 2 FAILED: Employee face should NOT be enrolled before approval');
  }
  console.log('✅ TEST 2 PASSED: Employee registration created PENDING request without saving face directly.\n');

  // ----------------------------------------------------
  // TEST 3: Check Employee Status (PENDING) & Attendance Blocked
  // ----------------------------------------------------
  console.log('--- TEST 3: EMPLOYEE STATUS & ATTENDANCE BLOCKING ---');
  const empStatusPending = await faceRegistrationService.getMyStatus({
    employeeId: regularEmployee.id,
    companyId
  });
  console.log('Employee Status Query:', empStatusPending);
  console.log(`Status: ${empStatusPending.status} (Expected: PENDING)`);

  let attendanceBlocked = false;
  try {
    await attendanceService.matchFace(regularEmployee.id, testPhotoBase64);
  } catch (attErr) {
    console.log(`Attendance matchFace rejected: "${attErr.message}" (Expected rejection)`);
    if (attErr.code === 'NO_FACE_REGISTERED' || attErr.message.includes('No face registered')) {
      attendanceBlocked = true;
    }
  }

  if (empStatusPending.status !== 'PENDING' || !attendanceBlocked) {
    throw new Error('TEST 3 FAILED: Pending employee should have PENDING status and attendance blocked');
  }
  console.log('✅ TEST 3 PASSED: Employee status is PENDING and attendance is securely blocked.\n');

  // ----------------------------------------------------
  // TEST 4: HR Admin Approves Request
  // ----------------------------------------------------
  console.log('--- TEST 4: HR ADMIN APPROVES FACE REGISTRATION ---');
  const pendingList = await faceRegistrationService.listPendingRequests({
    companyId,
    status: 'PENDING'
  });
  console.log(`Pending Requests Count in DB: ${pendingList.total}`);

  const approveResult = await faceRegistrationService.approveFaceRegistration({
    requestId: empRegResult.requestId,
    approvedBy: adminEmployee.userId || adminEmployee.id,
    companyId
  });

  console.log('Approval Result:', approveResult);

  const refreshedEmpAfterApproval = await prisma.employee.findUnique({
    where: { id: regularEmployee.id }
  });
  const empHasFaceAfterApproval = Boolean(refreshedEmpAfterApproval?.faceEmbedding && refreshedEmpAfterApproval?.faceRegisteredAt);
  console.log(`Employee DB Face Enrolled After Approval: ${empHasFaceAfterApproval} (Expected: true)`);

  const empStatusApproved = await faceRegistrationService.getMyStatus({
    employeeId: regularEmployee.id,
    companyId
  });
  console.log(`Employee Status After Approval: ${empStatusApproved.status} (Expected: APPROVED)`);

  if (!empHasFaceAfterApproval || empStatusApproved.status !== 'APPROVED') {
    throw new Error('TEST 4 FAILED: Employee face was not enrolled after HR approval');
  }
  console.log('✅ TEST 4 PASSED: HR successfully approved face registration.\n');

  // ----------------------------------------------------
  // TEST 5: Employee Attendance Face Match Works After Approval
  // ----------------------------------------------------
  console.log('--- TEST 5: EMPLOYEE FACE ATTENDANCE AFTER APPROVAL ---');
  const matchAfterApproval = await attendanceService.matchFace(regularEmployee.id, testPhotoBase64);
  console.log('Attendance matchFace Result:', matchAfterApproval);
  console.log(`Match Passed: ${matchAfterApproval.passed} (Expected: true)`);
  console.log(`Similarity: ${(matchAfterApproval.similarity * 100).toFixed(2)}%`);

  if (!matchAfterApproval.passed) {
    throw new Error('TEST 5 FAILED: Employee attendance should pass after approval');
  }
  console.log('✅ TEST 5 PASSED: Employee can mark attendance after approval.\n');

  // ----------------------------------------------------
  // TEST 6: Rejection Workflow Test
  // ----------------------------------------------------
  console.log('--- TEST 6: REJECTION WORKFLOW ---');
  // Clean up employee face
  await prisma.employee.update({
    where: { id: regularEmployee.id },
    data: { faceEmbedding: null, faceRegisteredAt: null, facePhotoUrl: null }
  });

  // Submit request 2
  const empReq2 = await faceRegistrationService.registerFace({
    employeeId: regularEmployee.id,
    companyId,
    photo: testPhotoBase64,
    livenessScore: 0.92,
    registeredBy: regularEmployee.id,
    role: 'EMPLOYEE'
  });

  const rejectResult = await faceRegistrationService.rejectFaceRegistration({
    requestId: empReq2.requestId,
    rejectedBy: adminEmployee.id,
    companyId,
    reason: 'Photo is blurry and lighting is insufficient'
  });

  console.log('Reject Result:', rejectResult);

  const empStatusRejected = await faceRegistrationService.getMyStatus({
    employeeId: regularEmployee.id,
    companyId
  });
  console.log(`Status After Rejection: ${empStatusRejected.status} (Expected: REJECTED)`);
  console.log(`Rejection Reason: "${empStatusRejected.rejectionReason}"`);

  const refreshedEmpAfterRejection = await prisma.employee.findUnique({
    where: { id: regularEmployee.id }
  });
  const empHasFaceAfterRejection = Boolean(refreshedEmpAfterRejection?.faceEmbedding);
  console.log(`Employee DB Face Enrolled After Rejection: ${empHasFaceAfterRejection} (Expected: false)`);

  if (empStatusRejected.status !== 'REJECTED' || empHasFaceAfterRejection) {
    throw new Error('TEST 6 FAILED: Rejection workflow failed');
  }
  console.log('✅ TEST 6 PASSED: Rejection workflow verified.\n');

  // Restore original embedding provider
  faceService.resetEmbeddingProvider();

  console.log('====================================================');
  console.log('ALL FACE APPROVAL WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runApprovalWorkflowTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
