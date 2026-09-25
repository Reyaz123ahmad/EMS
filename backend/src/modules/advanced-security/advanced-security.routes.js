import { Router } from 'express';
import { advancedSecurityController } from './advanced-security.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Base middleware
router.use(authenticate);

// 1. Device Attestation & Network Verification
router.post(
  '/attest',
  advancedSecurityController.attestDevice
);

router.post(
  '/validate-ip',
  advancedSecurityController.validateIP
);

router.post(
  '/detect-vpn',
  advancedSecurityController.detectVPN
);

// 2. Security Scoring & Dashboard
router.get(
  '/security-score',
  advancedSecurityController.getSecurityScore
);

router.get(
  '/dashboard',
  advancedSecurityController.getSecurityDashboard
);

// 3. Security Settings & Fraud Signals Review
router.put(
  '/security-settings',
  advancedSecurityController.updateSecuritySettings
);

router.post(
  '/fraud-signals/:id/review',
  advancedSecurityController.reviewFraudSignal
);

// 4. Events, Audit Logs & Employee Blocking
router.get('/events', advancedSecurityController.getSecurityEvents);
router.get('/audit-logs', advancedSecurityController.getAuditLogs);
router.get('/audit-logs/export', advancedSecurityController.exportAuditLogs);
router.post('/block-employee', advancedSecurityController.blockEmployee);
router.post('/unblock-employee', advancedSecurityController.unblockEmployee);
router.get('/blocked-employees', advancedSecurityController.getBlockedEmployees);

export default router;
