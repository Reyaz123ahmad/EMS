import holidayCalendarService from './holidayCalendar.service.js';
import {
  createHolidayCalendarSchema,
  updateHolidayCalendarSchema,
  createHolidaySchema,
  updateHolidaySchema,
  bulkImportHolidaysSchema,
  assignHolidaysSchema
} from './holidayCalendar.validator.js';

export const holidayCalendarController = {
  async listCalendars(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const calendars = await holidayCalendarService.listCalendars(companyId);
      res.status(200).json({ status: 'ok', data: { calendars } });
    } catch (err) {
      next(err);
    }
  },

  async createCalendar(req, res, next) {
    try {
      const { error, value } = createHolidayCalendarSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const calendar = await holidayCalendarService.createCalendar(companyId, value);
      res.status(201).json({ status: 'ok', message: 'Holiday calendar created', data: calendar });
    } catch (err) {
      next(err);
    }
  },

  async updateCalendar(req, res, next) {
    try {
      const { error, value } = updateHolidayCalendarSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const updated = await holidayCalendarService.updateCalendar(req.params.id, value);
      res.status(200).json({ status: 'ok', message: 'Holiday calendar updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteCalendar(req, res, next) {
    try {
      await holidayCalendarService.deleteCalendar(req.params.id);
      res.status(200).json({ status: 'ok', message: 'Holiday calendar deleted' });
    } catch (err) {
      next(err);
    }
  },

  async listHolidays(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const holidays = await holidayCalendarService.listHolidays(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { holidays } });
    } catch (err) {
      next(err);
    }
  },

  async createHoliday(req, res, next) {
    try {
      const { error, value } = createHolidaySchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const holiday = await holidayCalendarService.createHoliday(value.calendarId, value, companyId);
      res.status(201).json({ status: 'ok', message: 'Holiday created', data: holiday });
    } catch (err) {
      next(err);
    }
  },

  async updateHoliday(req, res, next) {
    try {
      const { error, value } = updateHolidaySchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const updated = await holidayCalendarService.updateHoliday(req.params.id, value);
      res.status(200).json({ status: 'ok', message: 'Holiday updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteHoliday(req, res, next) {
    try {
      await holidayCalendarService.deleteHoliday(req.params.id);
      res.status(200).json({ status: 'ok', message: 'Holiday deleted' });
    } catch (err) {
      next(err);
    }
  },

  async bulkImport(req, res, next) {
    try {
      const { error, value } = bulkImportHolidaysSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const importedBy = req.user.id;
      const result = await holidayCalendarService.bulkImportHolidays({ companyId, ...value, importedBy });
      res.status(200).json({ status: 'ok', message: 'Holidays bulk imported', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getCalendarView(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { year = new Date().getFullYear() } = req.query;
      const calendar = await holidayCalendarService.getHolidayCalendar(companyId, year);
      res.status(200).json({ status: 'ok', data: calendar });
    } catch (err) {
      next(err);
    }
  },

  async assignHolidays(req, res, next) {
    try {
      const { error, value } = assignHolidaysSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const result = await holidayCalendarService.assignHolidaysToEmployees(value);
      res.status(200).json({ status: 'ok', message: 'Holidays assigned to employees', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default holidayCalendarController;
