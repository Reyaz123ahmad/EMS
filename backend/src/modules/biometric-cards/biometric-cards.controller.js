import QRCode from 'qrcode';
import prisma from '../../config/prisma.js';
import { biometricCardsService } from './biometric-cards.service.js';
import { biometricCardsRepository } from './biometric-cards.repository.js';
import {
  generateCardSchema,
  assignCardSchema,
  regenerateQRSchema,
  deactivateCardSchema,
  verifyQRSchema,
  cardFiltersSchema
} from './biometric-cards.validator.js';
import { successResponse, errorResponse, sendSuccess, sendError } from '../../utils/response.js';

export const getMyCard = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId },
          { id: userId }
        ]
      }
    });

    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const card = await prisma.employeeCard.findFirst({
      where: {
        employeeId: employee.id,
        isActive: true
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            photoUrl: true,
            department: { select: { name: true } },
            designation: { select: { name: true } }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    });

    if (!card) {
      return successResponse(res, null, 'No card assigned');
    }

    return successResponse(res, card, 'Card retrieved');
  } catch (error) {
    next(error);
  }
};

export const downloadCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const role = req.user.role;

    const card = await prisma.employeeCard.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true
          }
        },
        company: true
      }
    });

    if (!card) {
      return errorResponse(res, 'Card not found', 404);
    }

    // Permission check for EMPLOYEE
    if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { userId },
            { id: userId }
          ]
        }
      });

      if (!employee || card.employeeId !== employee.id) {
        return errorResponse(res, 'Unauthorized', 403);
      }
    }

    // Generate QR Image Buffer
    let qrImageBuffer = null;
    try {
      const qrDataString = biometricCardsService.generateQRData(
        card.employee,
        card.company,
        card.cardNumber,
        card.expiresAt
      );
      const qrDataUrl = await QRCode.toDataURL(qrDataString, { errorCorrectionLevel: 'H', margin: 1 });
      qrImageBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    } catch {
      // fallback
    }

    // Generate PDF Buffer
    const pdfBuffer = await biometricCardsService.generateCardPDF(
      card.employee,
      card.company,
      card.cardNumber,
      card.qrSignature,
      qrImageBuffer
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="card-${card.cardNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const card = await prisma.employeeCard.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            photoUrl: true,
            department: { select: { name: true } },
            designation: { select: { name: true } }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    });

    if (!card) {
      return errorResponse(res, 'Card not found', 404);
    }
    return successResponse(res, card, 'Card retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const generateCard = async (req, res, next) => {
  try {
    const { error, value } = generateCardSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const card = await biometricCardsService.createCard({
      ...value,
      companyId: req.user.companyId,
      requestedBy: req.user.id,
      ipAddress: req.ip
    });

    return successResponse(res, card, 'Card generated successfully with QR and PDF badge', 201);
  } catch (err) {
    next(err);
  }
};

export const assignCard = async (req, res, next) => {
  try {
    const { error, value } = assignCardSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const card = await biometricCardsService.assignCard({
      ...value,
      companyId: req.user.companyId,
      requestedBy: req.user.id,
      ipAddress: req.ip
    });

    return successResponse(res, card, 'Physical card assigned successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const regenerateQR = async (req, res, next) => {
  try {
    const { error } = regenerateQRSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const cardId = req.params.id || req.body.cardId;
    const updatedCard = await biometricCardsService.regenerateQR(
      cardId,
      req.user.companyId,
      req.user.id,
      req.ip
    );

    return successResponse(res, updatedCard, 'QR code and badge regenerated successfully');
  } catch (err) {
    next(err);
  }
};

export const deactivateCard = async (req, res, next) => {
  try {
    const { error, value } = deactivateCardSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const cardId = req.params.id || value.cardId;
    const card = await biometricCardsService.deactivateCard(
      cardId,
      value.reason,
      req.user.companyId,
      req.user.id,
      req.ip
    );

    return successResponse(res, card, 'Card deactivated successfully');
  } catch (err) {
    next(err);
  }
};

export const getCardByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const card = await biometricCardsService.getCardByEmployee(employeeId, req.user.companyId);
    return successResponse(res, card, 'Employee card retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const listCards = async (req, res, next) => {
  try {
    const { error, value } = cardFiltersSchema.validate(req.query);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const { page, limit, ...filters } = value;
    const result = await biometricCardsService.listCards(
      req.user.companyId,
      filters,
      { page, limit }
    );

    return successResponse(res, result, 'Employee cards retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const verifyQR = async (req, res, next) => {
  try {
    const { error, value } = verifyQRSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const companyId = req.user ? req.user.companyId : null;
    const verification = await biometricCardsService.verifyAndMatchQR({
      qrData: value.qrData,
      companyId
    });

    if (!verification.valid) {
      return errorResponse(res, verification.reason || 'Invalid QR code', 400, { valid: false });
    }

    return successResponse(res, {
      valid: true,
      employee: {
        id: verification.employee?.id,
        employeeCode: verification.employee?.employeeCode,
        name: `${verification.employee?.firstName || ''} ${verification.employee?.lastName || ''}`.trim(),
        department: verification.employee?.department?.name,
        designation: verification.employee?.designation?.name
      },
      card: {
        id: verification.card?.id,
        cardNumber: verification.card?.cardNumber,
        cardType: verification.card?.cardType,
        expiresAt: verification.card?.expiresAt,
        isActive: verification.card?.isActive
      }
    }, 'QR Code verified successfully');
  } catch (err) {
    next(err);
  }
};

export const biometricCardsController = {
  generateCard,
  assignCard,
  regenerateQR,
  deactivateCard,
  getCardByEmployee,
  listCards,
  downloadCard,
  verifyQR,
  getMyCard,
  getCard
};

export default biometricCardsController;
