import { prisma } from '../../config/prisma.js';
import { isVerificationEnabled, isDemoMode } from '../../config/aadhaar.js';
import aadhaarProviderService from '../../services/aadhaar-provider.service.js';
import { uploadBuffer } from '../../config/cloudinary.js';
import { recordAuditLog } from '../../middlewares/security.middleware.js';
import notificationsService from '../notifications/notifications.service.js';
import logger from '../../config/logger.js';

// Verhoeff algorithm tables for Aadhaar checksum validation
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

/**
 * Validate Verhoeff checksum algorithm
 */
function validateVerhoeff(numStr) {
  let c = 0;
  const reversedArray = numStr.split('').map(Number).reverse();
  for (let i = 0; i < reversedArray.length; i++) {
    c = dTable[c][pTable[i % 8][reversedArray[i]]];
  }
  return c === 0;
}

export const aadhaarService = {
  /**
   * Validate 12-digit Aadhaar number with Verhoeff checksum
   */
  validateAadhaarNumber(aadhaarNumber) {
    if (!aadhaarNumber) {
      return { valid: false, reason: 'Aadhaar number is required' };
    }

    const cleaned = String(aadhaarNumber).replace(/[\s-]/g, '');

    if (!/^\d{12}$/.test(cleaned)) {
      return { valid: false, reason: 'Aadhaar number must be exactly 12 digits' };
    }

    if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
      return { valid: false, reason: 'Aadhaar number cannot start with 0 or 1' };
    }

    const isChecksumValid = validateVerhoeff(cleaned);
    if (!isChecksumValid) {
      return { valid: false, reason: 'Invalid Aadhaar checksum (Verhoeff validation failed)' };
    }

    return { valid: true, cleaned };
  },

  /**
   * Mask Aadhaar number to XXXX-XXXX-1234
   */
  maskAadhaarNumber(aadhaarNumber) {
    const cleaned = String(aadhaarNumber).replace(/\D/g, '');
    if (cleaned.length < 4) return 'XXXX-XXXX-1234';
    const last4 = cleaned.slice(-4);
    return `XXXX-XXXX-${last4}`;
  },

  /**
   * Send Aadhaar OTP or generate demo transaction
   */
  async sendAadhaarOTP({ employeeId, companyId, aadhaarNumber, name, consent = true }) {
    // 1. Validate Aadhaar Number
    const validation = this.validateAadhaarNumber(aadhaarNumber);
    if (!validation.valid) {
      const err = new Error(validation.reason);
      err.statusCode = 400;
      throw err;
    }

    const maskedAadhaar = this.maskAadhaarNumber(aadhaarNumber);

    // 2. Check if Aadhaar is already registered and verified for another employee in this company
    const existingDoc = await prisma.employeeDocument.findFirst({
      where: {
        aadhaarNumber: maskedAadhaar,
        employee: { companyId },
        employeeId: { not: employeeId },
        status: { in: ['VERIFIED', 'PENDING'] }
      }
    });

    if (existingDoc) {
      const err = new Error('This Aadhaar number is already registered with an active employee profile');
      err.statusCode = 400;
      throw err;
    }

    const enabled = isVerificationEnabled();

    // 3. Rate limiting check (Production mode only: Max 3 OTP requests per hour per employee)
    if (enabled) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOtpCount = await prisma.aadhaarVerification.count({
        where: {
          employeeId,
          createdAt: { gte: oneHourAgo }
        }
      });

      if (recentOtpCount >= 3) {
        const err = new Error('Rate limit exceeded: Maximum 3 Aadhaar OTP requests allowed per hour. Please try again later.');
        err.statusCode = 429;
        throw err;
      }
    }

    // 4. Dispatch OTP via Provider (or create Demo transaction)
    if (enabled) {
      const providerRes = await aadhaarProviderService.sendAadhaarOTP({
        aadhaarNumber: validation.cleaned,
        name,
        consent
      });

      const verification = await prisma.aadhaarVerification.create({
        data: {
          employeeId,
          companyId,
          aadhaarNumber: maskedAadhaar,
          transactionId: providerRes.transactionId,
          provider: providerRes.provider || 'setu',
          status: 'OTP_SENT',
          expiresAt: providerRes.expiresAt || new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          maxAttempts: 5
        }
      });

      // Send In-App / Push notification
      try {
        await notificationsService.sendAadhaarOTPSentNotification({
          employeeId,
          transactionId: providerRes.transactionId
        });
      } catch (notifErr) {
        logger.warn({ err: notifErr.message }, 'Failed to send Aadhaar OTP sent notification');
      }

      return {
        success: true,
        mode: 'OTP',
        transactionId: verification.transactionId,
        message: providerRes.message || 'OTP sent successfully to Aadhaar-linked mobile',
        expiresIn: 600
      };
    } else {
      // Demo mode
      const demoTxnId = 'DEMO_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const verification = await prisma.aadhaarVerification.create({
        data: {
          employeeId,
          companyId,
          aadhaarNumber: maskedAadhaar,
          transactionId: demoTxnId,
          provider: 'demo',
          status: 'DEMO_VERIFIED',
          expiresAt,
          attempts: 0,
          maxAttempts: 5
        }
      });

      return {
        success: true,
        mode: 'DEMO',
        transactionId: verification.transactionId,
        message: 'Demo mode active - Direct upload allowed without OTP',
        expiresIn: 86400
      };
    }
  },

  /**
   * Verify Aadhaar OTP (or acknowledge demo mode)
   */
  async verifyAadhaarOTP({ employeeId, companyId, transactionId, otp, aadhaarNumber }) {
    if (!transactionId) {
      const err = new Error('Transaction ID is required');
      err.statusCode = 400;
      throw err;
    }

    const verification = await prisma.aadhaarVerification.findUnique({
      where: { transactionId }
    });

    if (!verification) {
      const err = new Error('Aadhaar verification session not found or invalid transaction ID');
      err.statusCode = 404;
      throw err;
    }

    if (verification.companyId !== companyId || verification.employeeId !== employeeId) {
      const err = new Error('Unauthorized verification attempt for this transaction');
      err.statusCode = 403;
      throw err;
    }

    // Check expiration
    if (new Date() > new Date(verification.expiresAt)) {
      await prisma.aadhaarVerification.update({
        where: { id: verification.id },
        data: { status: 'EXPIRED' }
      });
      const err = new Error('Verification session has expired. Please request a new OTP.');
      err.statusCode = 400;
      throw err;
    }

    const enabled = isVerificationEnabled();

    if (enabled && !transactionId.startsWith('DEMO_')) {
      // Check max attempts
      if (verification.attempts >= verification.maxAttempts) {
        await prisma.aadhaarVerification.update({
          where: { id: verification.id },
          data: { status: 'FAILED' }
        });
        const err = new Error('Maximum verification attempts exceeded (5). Please request a new OTP.');
        err.statusCode = 400;
        throw err;
      }

      if (!otp) {
        const err = new Error('OTP is required for verification in production mode');
        err.statusCode = 400;
        throw err;
      }

      const verifyRes = await aadhaarProviderService.verifyAadhaarOTP({
        transactionId,
        otp,
        aadhaarNumber
      });

      if (!verifyRes.verified) {
        const updated = await prisma.aadhaarVerification.update({
          where: { id: verification.id },
          data: {
            attempts: { increment: 1 },
            status: verification.attempts + 1 >= verification.maxAttempts ? 'FAILED' : 'OTP_SENT'
          }
        });
        const attemptsLeft = updated.maxAttempts - updated.attempts;
        const err = new Error(verifyRes.error || `Invalid OTP. ${attemptsLeft} attempts remaining.`);
        err.statusCode = 400;
        throw err;
      }

      const verified = await prisma.aadhaarVerification.update({
        where: { id: verification.id },
        data: {
          status: 'VERIFIED',
          aadhaarData: verifyRes.aadhaarData || {},
          verifiedAt: new Date()
        }
      });

      return {
        success: true,
        verified: true,
        mode: 'OTP',
        message: 'Aadhaar verified successfully via UIDAI OTP',
        aadhaarData: verified.aadhaarData
      };
    } else {
      // Demo mode
      const updated = await prisma.aadhaarVerification.update({
        where: { id: verification.id },
        data: {
          status: 'DEMO_VERIFIED',
          aadhaarData: {
            name: 'Demo Employee',
            dob: '1992-05-15',
            gender: 'M',
            address: 'Demo Address, New Delhi, 110001'
          }
        }
      });

      return {
        success: true,
        verified: true,
        mode: 'DEMO',
        message: 'Demo mode - verification acknowledged without OTP',
        aadhaarData: updated.aadhaarData
      };
    }
  },

  /**
   * Upload Aadhaar document using verified transaction
   */
  async uploadAadhaarDocument({ employeeId, companyId, file, transactionId, documentTypeId, userId, ipAddress }) {
    if (!transactionId) {
      const err = new Error('Verification Transaction ID is required to upload Aadhaar document');
      err.statusCode = 400;
      throw err;
    }

    const verification = await prisma.aadhaarVerification.findUnique({
      where: { transactionId }
    });

    if (!verification) {
      const err = new Error('Invalid or non-existent Aadhaar verification transaction');
      err.statusCode = 404;
      throw err;
    }

    if (verification.companyId !== companyId || verification.employeeId !== employeeId) {
      const err = new Error('Transaction mismatch with current employee/company');
      err.statusCode = 403;
      throw err;
    }

    if (verification.status !== 'VERIFIED' && verification.status !== 'DEMO_VERIFIED') {
      const err = new Error(`Aadhaar cannot be uploaded. Current transaction status is ${verification.status}. Please complete OTP verification first.`);
      err.statusCode = 400;
      throw err;
    }

    if (verification.usedAt) {
      const err = new Error('This verification transaction has already been used to upload a document');
      err.statusCode = 400;
      throw err;
    }

    if (!file) {
      const err = new Error('Document file is required');
      err.statusCode = 400;
      throw err;
    }

    // Determine / create DocumentType for Aadhaar
    let docType = null;
    if (documentTypeId) {
      docType = await prisma.documentType.findUnique({ where: { id: documentTypeId } });
    }
    if (!docType) {
      docType = await prisma.documentType.findFirst({
        where: { companyId, name: { in: ['Aadhaar Card', 'AADHAAR', 'Aadhaar', 'National ID'] } }
      });
    }
    if (!docType) {
      docType = await prisma.documentType.create({
        data: {
          companyId,
          name: 'Aadhaar Card',
          isMandatory: true,
          isActive: true
        }
      });
    }

    // Upload to Cloudinary / storage
    let fileUrl = '';
    let publicId = `aadhaar_${employeeId}_${Date.now()}`;
    const folder = `ems/${companyId}/documents/${employeeId}/aadhaar`;

    if (process.env.NODE_ENV === 'test' || !process.env.CLOUDINARY_API_KEY) {
      fileUrl = `https://storage.googleapis.com/ems-docs/${folder}/${file.originalname || 'aadhaar.pdf'}`;
    } else {
      try {
        if (file.buffer) {
          const uploadRes = await uploadBuffer(file.buffer, {
            folder,
            resource_type: 'auto',
            type: 'private'
          });
          fileUrl = uploadRes.secure_url || uploadRes.url;
          publicId = uploadRes.public_id || publicId;
        } else if (file.path) {
          fileUrl = file.path;
        }
      } catch (uploadErr) {
        logger.warn({ err: uploadErr.message }, 'Cloudinary upload failed, using fallback URL format');
        fileUrl = `https://storage.googleapis.com/ems-docs/${folder}/${file.originalname || 'aadhaar.pdf'}`;
      }
    }

    const isProdMode = isVerificationEnabled() && verification.status === 'VERIFIED';

    // Create EmployeeDocument
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        documentTypeId: docType.id,
        fileName: file.originalname || `Aadhaar_${verification.aadhaarNumber}.pdf`,
        fileUrl: fileUrl || `https://storage.googleapis.com/ems-docs/doc_${Date.now()}.pdf`,
        publicId,
        fileSize: file.size || null,
        mimeType: file.mimetype || 'application/pdf',
        format: file.originalname ? file.originalname.split('.').pop().toUpperCase() : 'PDF',
        status: isProdMode ? 'VERIFIED' : 'PENDING',
        verifiedBy: isProdMode ? 'UIDAI_SYSTEM' : null,
        verifiedAt: isProdMode ? new Date() : null,
        aadhaarNumber: verification.aadhaarNumber,
        aadhaarVerified: isProdMode,
        uidaiTransactionId: transactionId,
        otpVerifiedAt: isProdMode ? verification.verifiedAt || new Date() : null,
        verificationMethod: isProdMode ? 'UIDAI_OTP' : 'DEMO'
      },
      include: {
        documentType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      }
    });

    // Mark transaction as used
    await prisma.aadhaarVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() }
    });

    // Record Audit Log
    try {
      await recordAuditLog({
        userId: userId || null,
        action: 'AADHAAR_DOCUMENT_UPLOADED',
        entity: 'EmployeeDocument',
        entityId: document.id,
        newValues: {
          documentId: document.id,
          employeeId,
          maskedAadhaar: verification.aadhaarNumber,
          verificationMethod: isProdMode ? 'UIDAI_OTP' : 'DEMO',
          status: document.status
        },
        ipAddress: ipAddress || null
      });
    } catch (auditErr) {
      logger.warn({ err: auditErr.message }, 'Failed to record audit log for Aadhaar upload');
    }

    // Send notifications to HR
    try {
      if (isProdMode) {
        await notificationsService.sendAadhaarVerifiedNotification({
          employeeId,
          hrUserId: null,
          transactionId,
          maskedAadhaar: verification.aadhaarNumber
        });
      } else {
        await notificationsService.sendAadhaarDemoUploadNotification({
          employeeId,
          hrUserId: null,
          maskedAadhaar: verification.aadhaarNumber
        });
      }
    } catch (notifErr) {
      logger.warn({ err: notifErr.message }, 'Failed to dispatch Aadhaar upload notification');
    }

    return document;
  },

  /**
   * Get verification mode & feature flag status
   */
  getMode() {
    const enabled = isVerificationEnabled();
    return {
      enabled,
      mode: enabled ? 'OTP' : 'DEMO',
      demoMode: !enabled,
      message: enabled
        ? 'Production mode active. Aadhaar OTP verification via UIDAI provider required.'
        : 'Demo mode active. Direct upload enabled without OTP verification.'
    };
  }
};

export default aadhaarService;
