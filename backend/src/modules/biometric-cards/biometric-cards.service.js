import dayjs from 'dayjs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import streamifier from 'streamifier';
import env from '../../config/env.js';
import cloudinary from '../../config/cloudinary.js';
import prisma from '../../config/prisma.js';
import { biometricCardsRepository } from './biometric-cards.repository.js';
import { CARD_TYPES, QR_VERSION, QR_EXPIRY_YEARS, CARD_AUDIT_ACTIONS } from './biometric-cards.constants.js';
import { AppError } from '../../utils/response.js';

// Helper to fetch image buffer from URL or base64
const fetchImageBuffer = async (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    if (url.startsWith('data:image')) {
      const base64Data = url.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
};

// Upload Buffer helper to Cloudinary (or base64 fallback)
const uploadBufferToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve) => {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      const mime = options.resource_type === 'raw' ? 'application/pdf' : 'image/png';
      return resolve({
        secure_url: `data:${mime};base64,${buffer.toString('base64')}`,
        public_id: `local_${Date.now()}`
      });
    }

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'ems/cards',
          resource_type: options.resource_type || 'image',
          ...options
        },
        (error, result) => {
          if (error || !result) {
            const mime = options.resource_type === 'raw' ? 'application/pdf' : 'image/png';
            return resolve({
              secure_url: `data:${mime};base64,${buffer.toString('base64')}`,
              public_id: `fallback_${Date.now()}`
            });
          }
          resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch {
      const mime = options.resource_type === 'raw' ? 'application/pdf' : 'image/png';
      resolve({
        secure_url: `data:${mime};base64,${buffer.toString('base64')}`,
        public_id: `fallback_${Date.now()}`
      });
    }
  });
};

export const biometricCardsService = {
  generateCardNumber: async (companyId) => {
    const count = await biometricCardsRepository.countCompanyCards(companyId);
    const seq = String(count + 1).padStart(4, '0');
    return `EMP${seq}`;
  },

  generateQRData: (employee, company, cardNumber, expiresAt) => {
    const issuedAt = new Date().toISOString();
    const exp = expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + QR_EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000).toISOString();
    const employeeId = employee.id;
    const companyId = company.id;

    const dataToSign = `${employeeId}:${companyId}:${cardNumber}:${issuedAt}:${exp}`;
    const signature = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET || 'ems_card_secret_key_default')
      .update(dataToSign)
      .digest('hex');

    const qrPayload = {
      v: QR_VERSION,
      employeeId,
      companyId,
      cardNumber,
      issuedAt,
      expiresAt: exp,
      signature
    };

    return JSON.stringify(qrPayload);
  },

  verifyQRData: (qrDataString) => {
    try {
      let payload;
      if (typeof qrDataString === 'string') {
        payload = JSON.parse(qrDataString);
      } else {
        payload = qrDataString;
      }

      if (!payload || !payload.signature || !payload.employeeId || !payload.companyId || !payload.cardNumber) {
        return { valid: false, reason: 'Invalid QR payload format' };
      }

      if (payload.v !== QR_VERSION) {
        return { valid: false, reason: `Unsupported QR code version: ${payload.v}` };
      }

      const { employeeId, companyId, cardNumber, issuedAt, expiresAt, signature } = payload;
      const dataToSign = `${employeeId}:${companyId}:${cardNumber}:${issuedAt}:${expiresAt}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.JWT_ACCESS_SECRET || 'ems_card_secret_key_default')
        .update(dataToSign)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, reason: 'QR Code signature mismatch or data has been tampered' };
      }

      if (expiresAt && new Date(expiresAt) < new Date()) {
        return { valid: false, reason: 'QR Code has expired' };
      }

      return { valid: true, data: payload };
    } catch {
      return { valid: false, reason: 'Malformed QR code data' };
    }
  },

  generateQRImage: async (qrData) => {
    return QRCode.toBuffer(qrData, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  },

  generateCardPDF: async (employeeOrCard, companyArg, cardNumberArg, qrDataArg, qrImageBufferArg, metaArg) => {
    let employee = employeeOrCard;
    let company = companyArg;
    let cardNumber = cardNumberArg;
    let qrImageBuffer = qrImageBufferArg;
    let cardMeta = metaArg || {};

    if (employeeOrCard && employeeOrCard.employee) {
      employee = employeeOrCard.employee;
      company = employeeOrCard.company || companyArg;
      cardNumber = employeeOrCard.cardNumber || cardNumberArg;
      cardMeta = employeeOrCard;
    }

    const cardType = cardMeta.cardType || 'QR';
    const isActive = cardMeta.isActive !== undefined ? cardMeta.isActive : true;
    const assignedAt = cardMeta.assignedAt || cardMeta.createdAt || new Date();
    const expiresAt = cardMeta.expiresAt || null;

    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee Name';
    const employeeCode = employee.employeeCode || 'N/A';
    const departmentName = employee.department?.name || 'General';
    const designationName = employee.designation?.name || 'Staff Member';
    const companyName = company?.name || 'Enterprise EMS';
    const companyInit = companyName.charAt(0).toUpperCase() || 'E';
    const nameInit = fullName.charAt(0).toUpperCase() || 'E';

    const issuedDateStr = dayjs(assignedAt).format('DD MMM YYYY');
    const expiryDateStr = expiresAt ? dayjs(expiresAt).format('DD MMM YYYY') : 'Permanent';

    // Fetch images asynchronously
    const [photoBuffer, logoBuffer] = await Promise.all([
      employee.photoUrl ? fetchImageBuffer(employee.photoUrl) : null,
      company?.logoUrl ? fetchImageBuffer(company.logoUrl) : null
    ]);

    // Ensure QR image buffer exists
    if (!qrImageBuffer) {
      const qrDataString = cardMeta.qrSignature || qrDataArg || biometricCardsService.generateQRData(employee, company, cardNumber, expiresAt);
      try {
        qrImageBuffer = await QRCode.toBuffer(qrDataString, {
          margin: 1,
          width: 300,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
      } catch {}
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [340, 216], // Standard CR80 landscape card
          margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // ==================== PAGE 1 (FRONT SIDE) ====================
        // Dark Base
        doc.rect(0, 0, 340, 216).fill('#0f172a');

        // Header Strip
        doc.rect(0, 0, 340, 42).fill('#1e1b4b');

        // Company Logo / Initial Badge
        if (logoBuffer) {
          try {
            doc.image(logoBuffer, 12, 8, { width: 26, height: 26 });
          } catch {
            doc.roundedRect(12, 8, 26, 26, 6).fill('#4f46e5');
            doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(companyInit, 12, 14, { width: 26, align: 'center' });
          }
        } else {
          doc.roundedRect(12, 8, 26, 26, 6).fill('#4f46e5');
          doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(companyInit, 12, 14, { width: 26, align: 'center' });
        }

        // Company Name
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(companyName, 44, 15, { width: 180, ellipsis: true });

        // Status Pill (Top Right)
        doc.roundedRect(236, 11, 92, 20, 10).fill(isActive ? '#064e3b' : '#7f1d1d');
        doc.fillColor(isActive ? '#34d399' : '#fca5a5').fontSize(7.5).font('Helvetica-Bold')
          .text(`${cardType} • ${isActive ? 'ACTIVE' : 'INACTIVE'}`, 236, 16.5, { width: 92, align: 'center' });

        // Employee Photo
        doc.roundedRect(14, 52, 64, 80, 8).fill('#1e293b');
        if (photoBuffer) {
          try {
            doc.image(photoBuffer, 15, 53, { fit: [62, 78], align: 'center', valign: 'center' });
          } catch {
            doc.fillColor('#e0e7ff').fontSize(24).font('Helvetica-Bold').text(nameInit, 14, 76, { width: 64, align: 'center' });
          }
        } else {
          doc.fillColor('#e0e7ff').fontSize(24).font('Helvetica-Bold').text(nameInit, 14, 76, { width: 64, align: 'center' });
        }
        doc.roundedRect(14, 52, 64, 80, 8).lineWidth(1.5).stroke('#6366f1');

        // Employee Details (Middle Column)
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(fullName, 86, 54, { width: 140, ellipsis: true });
        doc.fillColor('#818cf8').fontSize(9).font('Courier-Bold').text(employeeCode, 86, 70);
        doc.fillColor('#cbd5e1').fontSize(8.5).font('Helvetica').text(designationName, 86, 84, { width: 140, ellipsis: true });
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(`Dept: ${departmentName}`, 86, 98, { width: 140, ellipsis: true });

        // Card Number
        doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica-Bold').text('CARD NO', 86, 114);
        doc.fillColor('#fbbf24').fontSize(10).font('Courier-Bold').text(cardNumber, 86, 122);

        // QR Code Box (Right Side)
        doc.roundedRect(234, 52, 92, 92, 8).fill('#ffffff');
        if (qrImageBuffer) {
          try {
            doc.image(qrImageBuffer, 237, 55, { width: 86, height: 86 });
          } catch {}
        }

        // Footer Metadata
        doc.rect(14, 180, 312, 1).fill('#1e293b');
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(`Issued: ${issuedDateStr}`, 14, 192);
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(`Expires: ${expiryDateStr}`, 190, 192, { width: 136, align: 'right' });

        // ==================== PAGE 2 (BACK SIDE) ====================
        doc.addPage({ size: [340, 216], margins: { top: 0, bottom: 0, left: 0, right: 0 } });

        // Dark Background
        doc.rect(0, 0, 340, 216).fill('#090d16');

        // Header Strip
        doc.rect(0, 0, 340, 36).fill('#1e1b4b');
        doc.fillColor('#cbd5e1').fontSize(10).font('Helvetica-Bold').text('CARD GUIDELINES', 16, 13);
        doc.fillColor('#818cf8').fontSize(8).font('Helvetica-Bold').text('OFFICIAL IDENTITY PASS', 160, 14, { width: 164, align: 'right' });

        // Guidelines List
        doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').lineGap(4);
        doc.text('• This badge is non-transferable and remains the property of the company.\n• Present or scan this QR at all biometric verification checkpoints.\n• If found, please return to Human Resources Department or email security.', 16, 48, { width: 308 });

        // Emergency Contact Box
        doc.roundedRect(16, 112, 308, 54, 8).fill('#0f172a');
        doc.roundedRect(16, 112, 308, 54, 8).lineWidth(1).stroke('#1e293b');
        doc.fillColor('#10b981').fontSize(8.5).font('Helvetica-Bold').text('Emergency Contact & Support', 26, 120);
        doc.fillColor('#94a3b8').fontSize(7.5).font('Courier').text('HR Desk: +91 98765 43210', 26, 134);
        doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text('helpdesk@company.com', 26, 147);

        // Watermark Footer
        doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold').text('Cryptographically Secured by EMS Zero-Trust HMAC', 16, 192, { width: 308, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },

  createCard: async ({ employeeId, companyId, cardType = CARD_TYPES.QR, expiresAt, requestedBy, ipAddress }) => {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        department: true,
        designation: true,
        branch: true
      }
    });

    if (!employee) {
      throw new AppError('Employee not found in this company', 404);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Deactivate existing active cards for this employee
    const existingCards = await biometricCardsRepository.findCardsByEmployee(employeeId);
    for (const card of existingCards) {
      if (card.isActive) {
        await biometricCardsRepository.deactivateCard(card.id, 'Superseded by new card generation');
      }
    }

    const cardNumber = await biometricCardsService.generateCardNumber(companyId);
    const expDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + QR_EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000);

    let qrUrl = null;
    let pdfUrl = null;
    let qrSignature = null;

    if (cardType === CARD_TYPES.QR) {
      const qrData = biometricCardsService.generateQRData(employee, company, cardNumber, expDate);
      const parsed = JSON.parse(qrData);
      qrSignature = parsed.signature;

      const qrImageBuffer = await biometricCardsService.generateQRImage(qrData);
      const pdfBuffer = await biometricCardsService.generateCardPDF(employee, company, cardNumber, qrData, qrImageBuffer);

      const [uploadedQR, uploadedPDF] = await Promise.all([
        uploadBufferToCloudinary(qrImageBuffer, { folder: 'ems/cards/qr', public_id: `qr_${cardNumber}_${Date.now()}` }),
        uploadBufferToCloudinary(pdfBuffer, { folder: 'ems/cards/pdf', resource_type: 'raw', public_id: `card_${cardNumber}_${Date.now()}.pdf` })
      ]);

      qrUrl = uploadedQR.secure_url;
      pdfUrl = uploadedPDF.secure_url;
    }

    const card = await biometricCardsRepository.createCard({
      companyId,
      employeeId,
      cardNumber,
      cardType,
      qrUrl,
      pdfUrl,
      qrSignature,
      expiresAt: expDate,
      isActive: true
    });

    await biometricCardsRepository.createCardAuditLog({
      userId: requestedBy,
      action: CARD_AUDIT_ACTIONS.CARD_GENERATED,
      cardId: card.id,
      newValues: { cardNumber, cardType, employeeId },
      ipAddress
    });

    return card;
  },

  assignCard: async ({ employeeId, cardNumber, cardType = CARD_TYPES.RFID, companyId, expiresAt, requestedBy, ipAddress }) => {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId }
    });

    if (!employee) {
      throw new AppError('Employee not found in this company', 404);
    }

    const existingCardWithNumber = await biometricCardsRepository.findCardByNumber(companyId, cardNumber);
    if (existingCardWithNumber && existingCardWithNumber.isActive) {
      throw new AppError(`Card number '${cardNumber}' is already assigned and active`, 400);
    }

    const expDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + QR_EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000);

    const card = await biometricCardsRepository.createCard({
      companyId,
      employeeId,
      cardNumber,
      cardType,
      expiresAt: expDate,
      isActive: true
    });

    await biometricCardsRepository.createCardAuditLog({
      userId: requestedBy,
      action: CARD_AUDIT_ACTIONS.CARD_ASSIGNED,
      cardId: card.id,
      newValues: { cardNumber, cardType, employeeId },
      ipAddress
    });

    return card;
  },

  regenerateQR: async (cardId, companyId, requestedBy, ipAddress) => {
    const card = await biometricCardsRepository.findCardById(cardId);
    if (!card || card.companyId !== companyId) {
      throw new AppError('Card not found', 404);
    }

    if (!card.isActive) {
      throw new AppError('Cannot regenerate QR for a deactivated card', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: card.employeeId },
      include: { department: true, designation: true }
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    const expDate = card.expiresAt || new Date(Date.now() + QR_EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000);
    const qrData = biometricCardsService.generateQRData(employee, company, card.cardNumber, expDate);
    const parsed = JSON.parse(qrData);

    const qrImageBuffer = await biometricCardsService.generateQRImage(qrData);
    const pdfBuffer = await biometricCardsService.generateCardPDF(employee, company, card.cardNumber, qrData, qrImageBuffer);

    const [uploadedQR, uploadedPDF] = await Promise.all([
      uploadBufferToCloudinary(qrImageBuffer, { folder: 'ems/cards/qr', public_id: `qr_${card.cardNumber}_${Date.now()}` }),
      uploadBufferToCloudinary(pdfBuffer, { folder: 'ems/cards/pdf', resource_type: 'raw', public_id: `card_${card.cardNumber}_${Date.now()}.pdf` })
    ]);

    const updatedCard = await biometricCardsRepository.regenerateQR(card.id, {
      qrUrl: uploadedQR.secure_url,
      pdfUrl: uploadedPDF.secure_url,
      qrSignature: parsed.signature
    });

    await biometricCardsRepository.createCardAuditLog({
      userId: requestedBy,
      action: CARD_AUDIT_ACTIONS.QR_REGENERATED,
      cardId: card.id,
      oldValues: { qrSignature: card.qrSignature, qrUrl: card.qrUrl },
      newValues: { qrSignature: parsed.signature, qrUrl: uploadedQR.secure_url },
      ipAddress
    });

    return updatedCard;
  },

  deactivateCard: async (cardId, reason, companyId, requestedBy, ipAddress) => {
    const card = await biometricCardsRepository.findCardById(cardId);
    if (!card || card.companyId !== companyId) {
      throw new AppError('Card not found', 404);
    }

    if (!card.isActive) {
      return card;
    }

    const deactivatedCard = await biometricCardsRepository.deactivateCard(cardId, reason);

    await biometricCardsRepository.createCardAuditLog({
      userId: requestedBy,
      action: CARD_AUDIT_ACTIONS.CARD_DEACTIVATED,
      cardId: card.id,
      oldValues: { isActive: true },
      newValues: { isActive: false, reason },
      ipAddress
    });

    return deactivatedCard;
  },

  getCardByEmployee: async (employeeId, companyId) => {
    const card = await biometricCardsRepository.findActiveCardByEmployee(employeeId);
    if (!card || card.companyId !== companyId) {
      throw new AppError('Active card not found for this employee', 404);
    }
    return biometricCardsRepository.findCardById(card.id);
  },

  listCards: async (companyId, filters, pagination) => {
    return biometricCardsRepository.findCardsByCompany(companyId, filters, pagination);
  },

  downloadCard: async (cardId, companyId) => {
    const card = await biometricCardsRepository.findCardById(cardId);
    if (!card || card.companyId !== companyId) {
      throw new AppError('Card not found', 404);
    }

    if (!card.pdfUrl) {
      throw new AppError('Card PDF not generated for this card', 404);
    }

    return {
      cardNumber: card.cardNumber,
      pdfUrl: card.pdfUrl
    };
  },

  verifyAndMatchQR: async ({ qrData, companyId }) => {
    const verification = biometricCardsService.verifyQRData(qrData);
    if (!verification.valid) {
      return verification;
    }

    const { employeeId, cardNumber, companyId: qrCompanyId } = verification.data;

    if (companyId && qrCompanyId !== companyId) {
      return { valid: false, reason: 'QR Code belongs to a different company' };
    }

    const card = await biometricCardsRepository.findCardByNumber(qrCompanyId, cardNumber);
    if (!card) {
      return { valid: false, reason: 'Card record not found in system' };
    }

    if (!card.isActive) {
      return { valid: false, reason: 'This card has been deactivated' };
    }

    if (card.employeeId !== employeeId) {
      return { valid: false, reason: 'Card employee mismatch' };
    }

    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      return { valid: false, reason: 'Card has expired' };
    }

    return {
      valid: true,
      card,
      employee: card.employee
    };
  }
};
