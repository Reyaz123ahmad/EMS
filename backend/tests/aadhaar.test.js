import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import aadhaarService from '../src/modules/documents/aadhaar.service.js';
import aadhaarProviderService from '../src/services/aadhaar-provider.service.js';
import documentsService from '../src/modules/documents/documents.service.js';

// Verhoeff tables
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
const invTable = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function generateValidAadhaar(prefix = '54321098765') {
  let c = 0;
  const reversed = prefix.split('').map(Number).reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = dTable[c][pTable[(i + 1) % 8][reversed[i]]];
  }
  const checkDigit = invTable[c];
  return prefix + checkDigit;
}

describe('Aadhaar Verification & Feature Flag Test Suite', { timeout: 30000 }, () => {
  let company;
  let employee;
  let employee2;
  let validAadhaar1;
  let validAadhaar2;
  let mockFile;

  beforeAll(async () => {
    validAadhaar1 = generateValidAadhaar('58291038472');
    validAadhaar2 = generateValidAadhaar('69182736450');

    mockFile = {
      originalname: 'aadhaar_card.pdf',
      buffer: Buffer.from('%PDF-1.4 Mock Aadhaar Document Content'),
      mimetype: 'application/pdf',
      size: 1024
    };

    // Ensure company and employees exist
    company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Aadhaar Test Corp ' + Date.now(),
          code: 'ATC_' + Date.now(),
          email: `test_aadhaar_${Date.now()}@example.com`
        }
      });
    }

    const testEmail1 = `aadhaar_emp1_${Date.now()}@example.com`;
    employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeCode: 'EMP_AADHAAR_' + Date.now(),
        firstName: 'Aadhaar',
        lastName: 'Tester',
        email: testEmail1,
        joiningDate: new Date()
      }
    });

    const testEmail2 = `aadhaar_emp2_${Date.now()}@example.com`;
    employee2 = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeCode: 'EMP_AADHAAR2_' + Date.now(),
        firstName: 'Second',
        lastName: 'Employee',
        email: testEmail2,
        joiningDate: new Date()
      }
    });
  });

  afterAll(async () => {
    try {
      if (employee) {
        await prisma.employeeDocument.deleteMany({ where: { employeeId: employee.id } });
        await prisma.aadhaarVerification.deleteMany({ where: { employeeId: employee.id } });
        await prisma.employee.delete({ where: { id: employee.id } });
      }
      if (employee2) {
        await prisma.employeeDocument.deleteMany({ where: { employeeId: employee2.id } });
        await prisma.aadhaarVerification.deleteMany({ where: { employeeId: employee2.id } });
        await prisma.employee.delete({ where: { id: employee2.id } });
      }
    } catch (e) {
      // ignore
    }
  });

  // 1. Validation Tests
  it('Validates 12-digit Aadhaar number with Verhoeff checksum', () => {
    const validRes = aadhaarService.validateAadhaarNumber(validAadhaar1);
    expect(validRes.valid).toBe(true);

    // Invalid length
    const invalidLen = aadhaarService.validateAadhaarNumber('123456');
    expect(invalidLen.valid).toBe(false);

    // Starts with 0
    const startsWith0 = aadhaarService.validateAadhaarNumber('012345678901');
    expect(startsWith0.valid).toBe(false);

    // Invalid checksum
    const invalidChecksum = aadhaarService.validateAadhaarNumber('582910384729');
    expect(invalidChecksum.valid).toBe(false);
  });

  // 2. Demo Mode OTP Dispatch
  it('Sends OTP in Demo Mode and returns a DEMO transaction ID without actual OTP dispatch', async () => {
    process.env.AADHAAR_VERIFICATION_ENABLED = 'false';

    const res = await aadhaarService.sendAadhaarOTP({
      employeeId: employee.id,
      companyId: company.id,
      aadhaarNumber: validAadhaar1,
      name: 'Aadhaar Tester',
      consent: true
    });

    expect(res.success).toBe(true);
    expect(res.mode).toBe('DEMO');
    expect(res.transactionId).toMatch(/^DEMO_/);

    // Check DB record
    const record = await prisma.aadhaarVerification.findUnique({
      where: { transactionId: res.transactionId }
    });
    expect(record).not.toBeNull();
    expect(record.status).toBe('DEMO_VERIFIED');
    expect(record.aadhaarNumber).toBe(`XXXX-XXXX-${validAadhaar1.slice(-4)}`);
  });

  // 3. Demo Mode OTP Verification (Auto-bypass)
  it('Verifies OTP in Demo Mode without requiring real provider OTP', async () => {
    process.env.AADHAAR_VERIFICATION_ENABLED = 'false';

    const sendRes = await aadhaarService.sendAadhaarOTP({
      employeeId: employee.id,
      companyId: company.id,
      aadhaarNumber: validAadhaar1,
      name: 'Aadhaar Tester'
    });

    const verifyRes = await aadhaarService.verifyAadhaarOTP({
      employeeId: employee.id,
      companyId: company.id,
      transactionId: sendRes.transactionId,
      otp: ''
    });

    expect(verifyRes.success).toBe(true);
    expect(verifyRes.verified).toBe(true);
    expect(verifyRes.mode).toBe('DEMO');
  });

  // 4. Demo Mode Document Upload (Status: PENDING)
  it('Uploads Aadhaar document in Demo Mode with PENDING status and DEMO method', async () => {
    process.env.AADHAAR_VERIFICATION_ENABLED = 'false';

    const sendRes = await aadhaarService.sendAadhaarOTP({
      employeeId: employee.id,
      companyId: company.id,
      aadhaarNumber: validAadhaar1,
      name: 'Aadhaar Tester'
    });

    const doc = await aadhaarService.uploadAadhaarDocument({
      employeeId: employee.id,
      companyId: company.id,
      file: mockFile,
      transactionId: sendRes.transactionId,
      userId: null
    });

    expect(doc).not.toBeNull();
    expect(doc.status).toBe('PENDING');
    expect(doc.verificationMethod).toBe('DEMO');
    expect(doc.aadhaarVerified).toBe(false);
    expect(doc.aadhaarNumber).toBe(`XXXX-XXXX-${validAadhaar1.slice(-4)}`);

    // Ensure transaction is marked as used
    const record = await prisma.aadhaarVerification.findUnique({
      where: { transactionId: sendRes.transactionId }
    });
    expect(record.usedAt).not.toBeNull();
  });

  // 5. Transaction Reuse Prevention
  it('Blocks reusing the same verification transaction for uploading multiple documents', async () => {
    const sendRes = await aadhaarService.sendAadhaarOTP({
      employeeId: employee.id,
      companyId: company.id,
      aadhaarNumber: validAadhaar1,
      name: 'Aadhaar Tester'
    });

    // First upload
    await aadhaarService.uploadAadhaarDocument({
      employeeId: employee.id,
      companyId: company.id,
      file: mockFile,
      transactionId: sendRes.transactionId
    });

    // Attempt second upload with same transaction ID
    await expect(
      aadhaarService.uploadAadhaarDocument({
        employeeId: employee.id,
        companyId: company.id,
        file: mockFile,
        transactionId: sendRes.transactionId
      })
    ).rejects.toThrow('This verification transaction has already been used');
  });

  // 6. Production Mode Mock Flow (OTP Dispatch, Verification & Upload)
  it('Dispatches and verifies OTP in Production Mode (AADHAAR_VERIFICATION_ENABLED=true)', async () => {
    process.env.AADHAAR_VERIFICATION_ENABLED = 'true';

    // Mock provider calls
    const mockTxn = 'SETU_TXN_' + Date.now();
    vi.spyOn(aadhaarProviderService, 'sendAadhaarOTP').mockResolvedValue({
      transactionId: mockTxn,
      message: 'OTP sent to mobile',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      provider: 'setu',
      mode: 'OTP'
    });

    vi.spyOn(aadhaarProviderService, 'verifyAadhaarOTP').mockResolvedValue({
      verified: true,
      provider: 'setu',
      mode: 'OTP',
      aadhaarData: {
        name: 'Aadhaar Tester',
        dob: '1995-08-12',
        gender: 'M',
        address: '123 Test Street, Bengaluru'
      }
    });

    const sendRes = await aadhaarService.sendAadhaarOTP({
      employeeId: employee2.id,
      companyId: company.id,
      aadhaarNumber: validAadhaar2,
      name: 'Second Employee'
    });

    expect(sendRes.success).toBe(true);
    expect(sendRes.mode).toBe('OTP');
    expect(sendRes.transactionId).toBe(mockTxn);

    // Verify OTP
    const verifyRes = await aadhaarService.verifyAadhaarOTP({
      employeeId: employee2.id,
      companyId: company.id,
      transactionId: mockTxn,
      otp: '123456',
      aadhaarNumber: validAadhaar2
    });

    expect(verifyRes.verified).toBe(true);
    expect(verifyRes.mode).toBe('OTP');

    // Upload Aadhaar in Production Mode -> status: VERIFIED
    const doc = await aadhaarService.uploadAadhaarDocument({
      employeeId: employee2.id,
      companyId: company.id,
      file: mockFile,
      transactionId: mockTxn
    });

    expect(doc.status).toBe('VERIFIED');
    expect(doc.aadhaarVerified).toBe(true);
    expect(doc.verificationMethod).toBe('UIDAI_OTP');
    expect(doc.uidaiTransactionId).toBe(mockTxn);

    // Restore provider spies
    vi.restoreAllMocks();
    process.env.AADHAAR_VERIFICATION_ENABLED = 'false';
  });

  // 7. Max Verification Attempts Lockout
  it('Locks transaction when max OTP verification attempts (5) are exceeded', async () => {
    process.env.AADHAAR_VERIFICATION_ENABLED = 'true';

    const testTxn = 'FAIL_TXN_' + Date.now();
    await prisma.aadhaarVerification.create({
      data: {
        employeeId: employee.id,
        companyId: company.id,
        aadhaarNumber: `XXXX-XXXX-${validAadhaar1.slice(-4)}`,
        transactionId: testTxn,
        provider: 'setu',
        status: 'OTP_SENT',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 5,
        maxAttempts: 5
      }
    });

    await expect(
      aadhaarService.verifyAadhaarOTP({
        employeeId: employee.id,
        companyId: company.id,
        transactionId: testTxn,
        otp: '111111'
      })
    ).rejects.toThrow('Maximum verification attempts exceeded');

    process.env.AADHAAR_VERIFICATION_ENABLED = 'false';
  });

  // 8. Normal Document Upload Flow Blocks Aadhaar
  it('Blocks Aadhaar from being uploaded via normal uploadDocument API', async () => {
    const aadhaarType = await prisma.documentType.create({
      data: {
        companyId: company.id,
        name: 'Aadhaar Card Test ' + Date.now()
      }
    });

    await expect(
      documentsService.uploadDocument({
        employeeId: employee.id,
        documentTypeId: aadhaarType.id,
        fileName: 'aadhaar.pdf',
        fileUrl: 'https://storage.googleapis.com/ems/aadhaar.pdf'
      })
    ).rejects.toThrow('Aadhaar must be uploaded via Aadhaar verification flow');

    // Clean up type
    await prisma.documentType.delete({ where: { id: aadhaarType.id } });
  });

  // 9. Rate Limiting (Max 3 OTP requests/hr in Production)
  it('Enforces rate limiting of 3 OTP requests per hour per employee in production', async () => {
    process.env.AADHAAR_VERIFICATION_ENABLED = 'true';

    // Mock send provider
    vi.spyOn(aadhaarProviderService, 'sendAadhaarOTP').mockResolvedValue({
      transactionId: 'RATE_TXN_' + Math.random(),
      message: 'OTP sent',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Create 3 existing verifications in the last hour
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      await prisma.aadhaarVerification.create({
        data: {
          employeeId: employee.id,
          companyId: company.id,
          aadhaarNumber: 'XXXX-XXXX-1234',
          transactionId: 'PRE_RATE_' + i + '_' + Date.now(),
          provider: 'setu',
          status: 'OTP_SENT',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          createdAt: now
        }
      });
    }

    await expect(
      aadhaarService.sendAadhaarOTP({
        employeeId: employee.id,
        companyId: company.id,
        aadhaarNumber: validAadhaar1,
        name: 'Aadhaar Tester'
      })
    ).rejects.toThrow('Rate limit exceeded');

    vi.restoreAllMocks();
    process.env.AADHAAR_VERIFICATION_ENABLED = 'false';
  });
});
