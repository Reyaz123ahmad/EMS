import { biometricCardsService } from './biometric-cards.service.js';
import {
  generateCardSchema,
  assignCardSchema,
  regenerateQRSchema,
  deactivateCardSchema,
  verifyQRSchema,
  cardFiltersSchema
} from './biometric-cards.validator.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const biometricCardsController = {
  generateCard: async (req, res, next) => {
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

      return sendSuccess(res, card, 'Card generated successfully with QR and PDF badge', 201);
    } catch (err) {
      next(err);
    }
  },

  assignCard: async (req, res, next) => {
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

      return sendSuccess(res, card, 'Physical card assigned successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  regenerateQR: async (req, res, next) => {
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

      return sendSuccess(res, updatedCard, 'QR code and badge regenerated successfully');
    } catch (err) {
      next(err);
    }
  },

  deactivateCard: async (req, res, next) => {
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

      return sendSuccess(res, card, 'Card deactivated successfully');
    } catch (err) {
      next(err);
    }
  },

  getCardByEmployee: async (req, res, next) => {
    try {
      const { employeeId } = req.params;
      const card = await biometricCardsService.getCardByEmployee(employeeId, req.user.companyId);
      return sendSuccess(res, card, 'Employee card retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  listCards: async (req, res, next) => {
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

      return sendSuccess(res, result, 'Employee cards retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  downloadCard: async (req, res, next) => {
    try {
      const cardId = req.params.id;
      const result = await biometricCardsService.downloadCard(cardId, req.user.companyId);
      return sendSuccess(res, result, 'Card download URL generated successfully');
    } catch (err) {
      next(err);
    }
  },

  verifyQR: async (req, res, next) => {
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
        return sendError(res, verification.reason || 'Invalid QR code', 400, { valid: false });
      }

      return sendSuccess(res, {
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
  }
};
