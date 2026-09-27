import shiftsService from './shifts.service.js';
import { createShiftSchema, updateShiftSchema, assignShiftSchema } from './shifts.validator.js';

export const shiftsController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const shifts = await shiftsService.listShifts({ companyId, filters: req.query });
      res.status(200).json({ status: 'ok', success: true, message: 'Shifts retrieved', data: shifts, shifts });
    } catch (err) {
      next(err);
    }
  },

  async listShifts(req, res, next) {
    return shiftsController.list(req, res, next);
  },

  async getById(req, res, next) {
    try {
      const shift = await shiftsService.getShiftById(req.params.id);
      if (!shift) return res.status(404).json({ status: 'error', success: false, message: 'Shift not found' });
      res.status(200).json({ status: 'ok', success: true, data: shift, shift });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { error, value } = createShiftSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const companyId = req.user.companyId;
      const shift = await shiftsService.createShift(companyId, value);
      res.status(201).json({ status: 'ok', success: true, message: 'Shift created', data: shift });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { error, value } = updateShiftSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const shift = await shiftsService.updateShift(req.params.id, value);
      res.status(200).json({ status: 'ok', success: true, message: 'Shift updated', data: shift });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await shiftsService.deleteShift(req.params.id);
      res.status(200).json({ status: 'ok', success: true, message: 'Shift deleted' });
    } catch (err) {
      next(err);
    }
  },

  async assign(req, res, next) {
    try {
      const { error, value } = assignShiftSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const result = await shiftsService.assignShift(value);
      res.status(200).json({ status: 'ok', success: true, message: 'Shift assigned successfully', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await shiftsService.getShiftStats(companyId);
      res.status(200).json({ status: 'ok', success: true, data: stats, stats });
    } catch (err) {
      next(err);
    }
  },

  async getMyShift(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.sub;
      const companyId = req.user?.companyId;

      const myShift = await shiftsService.getMyShift({ userId, companyId, email: req.user?.email });
      res.status(200).json({ status: 'ok', success: true, data: myShift });
    } catch (err) {
      next(err);
    }
  }
};

export default shiftsController;
