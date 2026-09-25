import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';
import { biometricCardsService } from '../src/modules/biometric-cards/biometric-cards.service.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runCardsTests() {
  console.log('--- STARTING BIOMETRIC CARDS TEST SUITE ---');

  // 1. Setup seed data
  let company = await prisma.company.findFirst();
  let employee = await prisma.employee.findFirst({
    where: { companyId: company.id },
    include: { branch: true }
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

  let generatedCardId = null;
  let generatedCardNumber = null;
  let validQRData = null;

  // TEST 1: Generate QR Card (Full Payload)
  console.log('1. Testing Generate Card with QR & PDF...');
  const expDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const genRes = await fetch(`${BASE_URL}/biometric/cards/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      cardType: 'QR',
      expiresAt: expDate
    })
  });
  const genData = await genRes.json();
  console.log('Generate Card Status:', genRes.status, genData.status, 'Card Number:', genData.data?.cardNumber);
  if (genRes.status !== 201 && genRes.status !== 200) {
    throw new Error(`Generate Card failed: ${JSON.stringify(genData)}`);
  }
  generatedCardId = genData.data?.id;
  generatedCardNumber = genData.data?.cardNumber;

  // Generate QR Data string
  validQRData = biometricCardsService.generateQRData(employee, company, generatedCardNumber, expDate);

  // TEST 2: Assign Physical Card (RFID)
  console.log('2. Testing Assign Physical RFID Card...');
  const assignRes = await fetch(`${BASE_URL}/biometric/cards/assign`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      employeeId: employee.id,
      cardNumber: `RFID-${Date.now().toString().slice(-6)}`,
      cardType: 'RFID'
    })
  });
  const assignData = await assignRes.json();
  console.log('Assign Card Status:', assignRes.status, assignData.status, 'Assigned Number:', assignData.data?.cardNumber);
  if (assignRes.status !== 201) {
    throw new Error(`Assign Card failed: ${JSON.stringify(assignData)}`);
  }

  // TEST 3: List Cards with Filters
  console.log('3. Testing List Cards with Filters...');
  const listRes = await fetch(`${BASE_URL}/biometric/cards?cardType=QR&page=1&limit=10`, {
    method: 'GET',
    headers: authHeaders
  });
  const listData = await listRes.json();
  console.log('List Cards Status:', listRes.status, 'Total Cards:', listData.data?.total);

  // TEST 4: Public Verify QR (Valid HMAC Signature)
  console.log('4. Testing Public QR Verification (Valid Signature)...');
  const verifyValidRes = await fetch(`${BASE_URL}/biometric/cards/verify-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrData: validQRData
    })
  });
  const verifyValidData = await verifyValidRes.json();
  console.log('Verify Valid QR Status:', verifyValidRes.status, 'Valid:', verifyValidData.data?.valid);
  if (!verifyValidData.data?.valid) {
    throw new Error(`Verify valid QR failed: ${JSON.stringify(verifyValidData)}`);
  }

  // TEST 5: Public Verify QR (Tampered Data / Signature Mismatch)
  console.log('5. Testing Public QR Verification (Tampered Data - Expect 400)...');
  const tamperedPayload = JSON.parse(validQRData);
  tamperedPayload.employeeId = 'tampered-fake-uuid';
  const verifyTamperedRes = await fetch(`${BASE_URL}/biometric/cards/verify-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrData: JSON.stringify(tamperedPayload)
    })
  });
  const verifyTamperedData = await verifyTamperedRes.json();
  console.log('Verify Tampered QR Status (Expect 400):', verifyTamperedRes.status, verifyTamperedData.message);
  if (verifyTamperedRes.status !== 400) {
    throw new Error(`Tampered QR did not block with 400!`);
  }

  // TEST 6: Card QR Scan Attendance
  console.log('6. Testing Card QR Attendance Scan (Check-In)...');
  // Delete all attendance logs and breaks for this employee for a fresh clean test
  await prisma.attendanceBreak.deleteMany({ where: { employeeId: employee.id } });
  await prisma.attendanceLog.deleteMany({ where: { employeeId: employee.id } });

  const branch = employee.branch || await prisma.branch.findFirst({ where: { companyId: company.id } });
  const lat = branch ? Number(branch.latitude) : 28.6139;
  const lng = branch ? Number(branch.longitude) : 77.2090;

  // Re-generate fresh QR for the active card
  const activeQRData = biometricCardsService.generateQRData(employee, company, assignData.data.cardNumber, expDate);

  const scanRes = await fetch(`${BASE_URL}/attendance/card-scan`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      qrData: activeQRData,
      operation: 'CHECK_IN',
      location: {
        lat,
        lng,
        accuracy: 10,
        source: 'gps',
        timestamp: Date.now()
      },
      deviceInfo: {
        userAgent: 'test-agent',
        platform: 'win32',
        isMockLocation: false
      },
      remarks: 'Automated card scan test'
    })
  });
  const scanData = await scanRes.json();
  console.log('Card Scan Status:', scanRes.status, scanData.status, 'Method:', scanData.data?.attendanceMethod);
  if (scanRes.status !== 200) {
    throw new Error(`Card Scan failed: ${JSON.stringify(scanData)}`);
  }

  // TEST 7: Regenerate QR Code
  console.log('7. Testing Regenerate QR Code...');
  const regenRes = await fetch(`${BASE_URL}/biometric/cards/${assignData.data.id}/regenerate`, {
    method: 'POST',
    headers: authHeaders
  });
  const regenData = await regenRes.json();
  console.log('Regenerate QR Status:', regenRes.status, 'Regenerations:', regenData.data?.regenerationCount);

  // TEST 8: Deactivate Card
  console.log('8. Testing Deactivate Card...');
  const deactRes = await fetch(`${BASE_URL}/biometric/cards/${assignData.data.id}/deactivate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      reason: 'Automated test deactivation'
    })
  });
  const deactData = await deactRes.json();
  console.log('Deactivate Card Status:', deactRes.status, 'Active:', deactData.data?.isActive);
  if (deactData.data?.isActive !== false) {
    throw new Error(`Card was not deactivated: ${JSON.stringify(deactData)}`);
  }

  // TEST 9: Unauthorized Request Check (Expect 401)
  console.log('9. Testing Unauthorized Access (Expect 401)...');
  const unauthRes = await fetch(`${BASE_URL}/biometric/cards`, {
    method: 'GET'
  });
  console.log('Unauthorized Status (Expect 401):', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error('Unauthorized endpoint returned non-401');
  }

  console.log('--- BIOMETRIC CARDS SUITE COMPLETED SUCCESSFULLY ---');
}

export default runCardsTests;
