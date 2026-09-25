import { Router } from 'express';
import companiesController from './companies.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { otpRateLimit } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

// Public 2-Step OTP Verification & Creation
router.post('/send-otp', otpRateLimit, companiesController.sendCompanyOTP);
router.post('/verify-otp', otpRateLimit, companiesController.verifyCompanyOTP);
router.post('/create', companiesController.createCompanyWithAdmin);

// Settings Schema
router.get('/settings/schema', companiesController.getSettingsSchema);

// Protected Admin Routes
router.get('/', authenticate, requireRole('SUPER_ADMIN'), companiesController.listCompanies);

// Global Stats & Analytics (must be defined before /:id wildcard)
router.get('/stats', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.getStats);
router.get('/analytics', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.getAnalytics);

// Granular Category Settings
router.get('/:id/settings/attendance', authenticate, (req, res, next) => { req.params.type = 'attendance'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/attendance', authenticate, (req, res, next) => { req.params.type = 'attendance'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/security', authenticate, (req, res, next) => { req.params.type = 'security'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/security', authenticate, (req, res, next) => { req.params.type = 'security'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/leave', authenticate, (req, res, next) => { req.params.type = 'leave'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/leave', authenticate, (req, res, next) => { req.params.type = 'leave'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/payroll', authenticate, (req, res, next) => { req.params.type = 'payroll'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/payroll', authenticate, (req, res, next) => { req.params.type = 'payroll'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/notifications', authenticate, (req, res, next) => { req.params.type = 'notifications'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/notifications', authenticate, (req, res, next) => { req.params.type = 'notifications'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/general', authenticate, (req, res, next) => { req.params.type = 'general'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/general', authenticate, (req, res, next) => { req.params.type = 'general'; companiesController.updateSettingByType(req, res, next); });

router.post('/:id/settings/reset', authenticate, companiesController.resetSettings);

// Settings
router.get('/:id/settings', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.getSettings);
router.put('/:id/settings', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.updateSettings);

// Dashboard, Stats & Analytics per specific company ID
router.get('/:id/dashboard', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.getDashboard);
router.get('/:id/stats', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.getStats);
router.get('/:id/analytics', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.getAnalytics);

// Single Company details (after specific sub-routes)
router.get('/:id', authenticate, companiesController.getCompany);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.updateCompany);

export default router;
