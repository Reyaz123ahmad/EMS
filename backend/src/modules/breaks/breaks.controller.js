import breaksService from './breaks.service.js';
import { createBreakRuleSchema, updateBreakRuleSchema } from './breaks.validator.js';

export const breaksController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const rules = await breaksService.listBreakRules(companyId, req.query);
      res.status(200).json({ status: 'ok', success: true, message: 'Break rules retrieved', data: rules });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const rule = await breaksService.getBreakRuleById(req.params.id, companyId);
      res.status(200).json({ status: 'ok', success: true, message: 'Break rule retrieved', data: rule });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { error, value } = createBreakRuleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });
      }

      const companyId = req.user.companyId;
      const created = await breaksService.createBreakRule(companyId, value);
      res.status(201).json({ status: 'ok', success: true, message: 'Break rule created successfully', data: created });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { error, value } = updateBreakRuleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });
      }

      const companyId = req.user.companyId;
      const updated = await breaksService.updateBreakRule(req.params.id, companyId, value);
      res.status(200).json({ status: 'ok', success: true, message: 'Break rule updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleted = await breaksService.deleteBreakRule(req.params.id, companyId);
      res.status(200).json({ status: 'ok', success: true, message: 'Break rule deactivated successfully', data: deleted });
    } catch (err) {
      next(err);
    }
  }
};

export default breaksController;
