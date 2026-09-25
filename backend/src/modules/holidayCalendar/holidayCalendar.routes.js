import { Router } from 'express';
import holidayCalendarController from './holidayCalendar.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Root level calendar view & list handlers
router.get('/calendar', holidayCalendarController.getCalendarView);
router.get('/calendar-view', holidayCalendarController.getCalendarView);

// Calendars CRUD
router.get('/calendars', holidayCalendarController.listCalendars);
router.post('/calendars', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.createCalendar);
router.put('/calendars/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.updateCalendar);
router.delete('/calendars/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.deleteCalendar);

// Root routes when mounted directly at /holiday-calendars or /holidays
router.get('/', (req, res, next) => {
  if (req.baseUrl.includes('holiday-calendar')) {
    return holidayCalendarController.listCalendars(req, res, next);
  }
  return holidayCalendarController.listHolidays(req, res, next);
});

router.post('/', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), (req, res, next) => {
  if (req.baseUrl.includes('holiday-calendar')) {
    return holidayCalendarController.createCalendar(req, res, next);
  }
  return holidayCalendarController.createHoliday(req, res, next);
});

// Individual Holidays CRUD
router.get('/holidays', holidayCalendarController.listHolidays);
router.post('/holidays', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.createHoliday);
router.put('/holidays/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.updateHoliday);
router.delete('/holidays/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.deleteHoliday);
router.put('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), (req, res, next) => {
  if (req.baseUrl.includes('holiday-calendar')) {
    return holidayCalendarController.updateCalendar(req, res, next);
  }
  return holidayCalendarController.updateHoliday(req, res, next);
});
router.delete('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), (req, res, next) => {
  if (req.baseUrl.includes('holiday-calendar')) {
    return holidayCalendarController.deleteCalendar(req, res, next);
  }
  return holidayCalendarController.deleteHoliday(req, res, next);
});

// Bulk Import & Assignment
router.post('/bulk-import', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.bulkImport);
router.post('/holidays/bulk-import', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.bulkImport);
router.post('/assign', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.assignHolidays);
router.post('/holidays/assign', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), holidayCalendarController.assignHolidays);

export default router;
