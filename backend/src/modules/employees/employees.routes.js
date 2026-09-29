import { Router } from 'express';
import multer from 'multer';
import employeesController from './employees.controller.js';
import shiftsController from '../shifts/shifts.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, checkSubscriptionLimit } from '../../middlewares/subscription.middleware.js';
import { otpRateLimit } from '../../middlewares/rateLimiter.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Apply auth & subscription check to all employee routes
router.use(authenticate);
router.use(requireActiveSubscription);

// Self-service profile & photo routes for ALL authenticated roles
router.get('/me/photo', employeesController.getMyPhoto);
router.post('/me/photo', upload.any(), employeesController.uploadMyPhoto);
router.delete('/me/photo', employeesController.deleteMyPhoto);
router.put('/me/profile', employeesController.updateMyProfile);

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

// Managers List (Only users with MANAGER role)
router.get(
  '/managers',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'),
  employeesController.getManagers
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
  cacheResponse('cache:employees_stats', 60),
  employeesController.getStats
);

router.get(
  '/analytics',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'),
  cacheResponse('cache:employees_analytics', 60),
  employeesController.getAnalytics
);

// List employees
router.get('/', cacheResponse('cache:employees_list', 60), employeesController.listEmployees);

// Single employee detail
router.get('/:id', employeesController.getEmployee);

// Effective active shift for employee (Roster override > Assignment > Default)
router.get('/:id/effective-shift', shiftsController.getEffectiveShift);

// Update employee
router.put(
  '/:id',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'),
  employeesController.updateEmployee
);

// Update employee role (role assignment / promotion)
router.patch(
  '/:id/role',
  requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'),
  employeesController.updateEmployeeRole
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
