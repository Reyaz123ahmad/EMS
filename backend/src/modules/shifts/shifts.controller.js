import shiftsService from './shifts.service.js';
import { createShiftSchema, updateShiftSchema, assignShiftSchema } from './shifts.validator.js';

export const shiftsController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const shifts = await shiftsService.listShifts(companyId);
      res.status(200).json({ status: 'ok', data: { shifts } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const shift = await shiftsService.getShiftById(req.params.id);
      if (!shift) return res.status(404).json({ status: 'error', message: 'Shift not found' });
      res.status(200).json({ status: 'ok', data: { shift } });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { error, value } = createShiftSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const shift = await shiftsService.createShift(companyId, value);
      res.status(201).json({ status: 'ok', message: 'Shift created', data: shift });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { error, value } = updateShiftSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const shift = await shiftsService.updateShift(req.params.id, value);
      res.status(200).json({ status: 'ok', message: 'Shift updated', data: shift });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await shiftsService.deleteShift(req.params.id);
      res.status(200).json({ status: 'ok', message: 'Shift deleted' });
    } catch (err) {
      next(err);
    }
  },

  async assign(req, res, next) {
    try {
      const { error, value } = assignShiftSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const result = await shiftsService.assignShift(value);
      res.status(200).json({ status: 'ok', message: 'Shift assigned successfully', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await shiftsService.getShiftStats(companyId);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  }
};

export default shiftsController;
