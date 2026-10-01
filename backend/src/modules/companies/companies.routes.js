import { Router } from 'express';
import companiesController from './companies.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { otpRateLimit } from '../../middlewares/rateLimiter.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

// Public 2-Step OTP Verification & Creation
router.post('/send-otp', otpRateLimit, companiesController.sendCompanyOTP);
router.post('/verify-otp', otpRateLimit, companiesController.verifyCompanyOTP);
router.post('/create', companiesController.createCompanyWithAdmin);

// Settings Schema
router.get('/settings/schema', cacheResponse('cache:settings_schema', 3600), companiesController.getSettingsSchema);

// Protected Admin Routes
router.get('/', authenticate, requireRole('SUPER_ADMIN'), cacheResponse('cache:companies_list', 120), companiesController.listCompanies);

// Global Stats & Analytics (must be defined before /:id wildcard)
router.get('/stats', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), cacheResponse('cache:companies_stats', 120), companiesController.getStats);
router.get('/analytics', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), cacheResponse('cache:companies_analytics', 120), companiesController.getAnalytics);

// Dedicated Payroll Rules & Statutory Config
router.get('/payroll-config', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'), cacheResponse('cache:company_payroll_cfg', 120), companiesController.getPayrollConfig);
router.put('/payroll-config', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'), companiesController.updatePayrollConfig);
router.get('/:id/payroll-config', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'), cacheResponse('cache:company_payroll_cfg_id', 120), companiesController.getPayrollConfig);
router.put('/:id/payroll-config', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'), companiesController.updatePayrollConfig);

// Granular Category Settings
router.get('/:id/settings/attendance', authenticate, cacheResponse('cache:company_settings_att', 120), (req, res, next) => { req.params.type = 'attendance'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/attendance', authenticate, (req, res, next) => { req.params.type = 'attendance'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/security', authenticate, cacheResponse('cache:company_settings_sec', 120), (req, res, next) => { req.params.type = 'security'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/security', authenticate, (req, res, next) => { req.params.type = 'security'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/leave', authenticate, cacheResponse('cache:company_settings_leave', 120), (req, res, next) => { req.params.type = 'leave'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/leave', authenticate, (req, res, next) => { req.params.type = 'leave'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/payroll', authenticate, cacheResponse('cache:company_settings_pay', 120), (req, res, next) => { req.params.type = 'payroll'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/payroll', authenticate, (req, res, next) => { req.params.type = 'payroll'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/notifications', authenticate, cacheResponse('cache:company_settings_notif', 120), (req, res, next) => { req.params.type = 'notifications'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/notifications', authenticate, (req, res, next) => { req.params.type = 'notifications'; companiesController.updateSettingByType(req, res, next); });

router.get('/:id/settings/general', authenticate, cacheResponse('cache:company_settings_gen', 120), (req, res, next) => { req.params.type = 'general'; companiesController.getSettingByType(req, res, next); });
router.put('/:id/settings/general', authenticate, (req, res, next) => { req.params.type = 'general'; companiesController.updateSettingByType(req, res, next); });

router.post('/:id/settings/reset', authenticate, companiesController.resetSettings);

// Settings
router.get('/:id/settings', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), cacheResponse('cache:company_settings_all', 120), companiesController.getSettings);
router.put('/:id/settings', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.updateSettings);

// Dashboard, Stats & Analytics per specific company ID
router.get('/:id/dashboard', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), cacheResponse('cache:company_id_dash', 120), companiesController.getDashboard);
router.get('/:id/stats', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), cacheResponse('cache:company_id_stats', 120), companiesController.getStats);
router.get('/:id/analytics', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), cacheResponse('cache:company_id_analytics', 120), companiesController.getAnalytics);

// Lifecycle Actions (SUPER_ADMIN only)
router.post('/:id/activate', authenticate, requireRole('SUPER_ADMIN'), companiesController.activateCompany);
router.post('/:id/deactivate', authenticate, requireRole('SUPER_ADMIN'), companiesController.deactivateCompany);
router.post('/:id/suspend', authenticate, requireRole('SUPER_ADMIN'), companiesController.suspendCompany);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), companiesController.deleteCompany);

// Single Company details (after specific sub-routes)
router.get('/:id', authenticate, cacheResponse('cache:company_get_id', 120), companiesController.getCompany);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), companiesController.updateCompany);

export default router;
