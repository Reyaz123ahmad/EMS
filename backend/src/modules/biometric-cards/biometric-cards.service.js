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

  generateCardPDF: async (employee, company, cardNumber, qrData, qrImageBuffer) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [340, 216], // Standard CR80 landscape card
          margins: { top: 10, bottom: 10, left: 10, right: 10 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Background
        doc.rect(0, 0, 340, 216).fill('#f8fafc');
        
        // Header
        doc.rect(0, 0, 340, 42).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
          .text(company?.name || 'Company Name', 16, 15, { width: 308, align: 'left' });

        // Left details
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
          .text(`${employee.firstName || ''} ${employee.lastName || ''}`, 16, 56);

        doc.fillColor('#475569').fontSize(8).font('Helvetica')
          .text(`Employee Code: ${employee.employeeCode || 'N/A'}`, 16, 74)
          .text(`Department: ${employee.department?.name || 'General'}`, 16, 88)
          .text(`Designation: ${employee.designation?.name || 'Staff'}`, 16, 102)
          .text(`Card No: ${cardNumber}`, 16, 116);

        // QR Code on right side
        if (qrImageBuffer) {
          doc.image(qrImageBuffer, 215, 50, { width: 105, height: 105 });
        }

        // Footer
        doc.rect(0, 185, 340, 31).fill('#e2e8f0');
        doc.fillColor('#64748b').fontSize(6.5).font('Helvetica')
          .text('Authorized Employee Identity Card • Tamper-proof QR Code Verification', 16, 196, { align: 'center', width: 308 });

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
