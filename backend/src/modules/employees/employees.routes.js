import { Router } from 'express';
import employeesController from './employees.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, checkSubscriptionLimit } from '../../middlewares/subscription.middleware.js';
import { otpRateLimit } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

// Apply auth & subscription check to all employee routes
router.use(authenticate);
router.use(requireActiveSubscription);

// Step 1: Send OTP for employee creation (HR / Admin with limit check)
router.post(
  '/send-otp',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  checkSubscriptionLimit('maxEmployees'),
  otpRateLimit,
  employeesController.sendEmployeeOTP
);

// Step 2: Verify OTP
router.post(
  '/verify-otp',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  otpRateLimit,
  employeesController.verifyEmployeeOTP
);

// Step 3: Finalize Employee + User creation
router.post(
  '/create',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  checkSubscriptionLimit('maxEmployees'),
  employeesController.createEmployeeWithUser
);

// Bulk Import & Export
router.post(
  '/bulk-import',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN'),
  employeesController.bulkImport
);

router.get(
  '/export',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  employeesController.exportEmployees
);

router.get(
  '/stats',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'),
  employeesController.getStats
);

router.get(
  '/analytics',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'),
  employeesController.getAnalytics
);

// List employees
router.get('/', employeesController.listEmployees);

// Single employee detail
router.get('/:id', employeesController.getEmployee);

// Update employee
router.put(
  '/:id',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  employeesController.updateEmployee
);

// Delete employee
router.delete(
  '/:id',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN'),
  employeesController.deleteEmployee
);

// Employee dashboard summary
router.get('/:id/dashboard', employeesController.getDashboard);

// Face biometrics registration
router.post(
  '/:id/face',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  employeesController.registerFace
);

export default router;
