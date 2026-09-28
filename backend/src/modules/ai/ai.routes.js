import { Router } from 'express';
import AIController from './ai.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize, requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { chatSchema } from './ai.validator.js';

const router = Router();

// Require authentication and SUPER_ADMIN / COMPANY_ADMIN authorization on all AI routes
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']));

// 1. Interactive AI Assistant Chat
router.post(
  '/chat',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  validate(chatSchema),
  AIController.chat
);

// 2. AI Usage & Free Tier Stats
router.get(
  '/usage-stats',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getUsageStats
);

// 3. Saved Insights History
router.get(
  '/insights',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.listInsights
);

// 4. Employee Performance & Improvement Plans
router.get(
  '/employees/:employeeId/performance',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getEmployeePerformance
);

router.get(
  '/employees/:employeeId/improvement-plan',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getEmployeeImprovementPlan
);

// 5. Predictive AI: Attrition & Attendance
router.get(
  '/employees/:employeeId/attrition',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getAttritionPrediction
);

router.get(
  '/attendance/prediction',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getAttendancePrediction
);

// 6. Company & Platform Analytics AI
router.get(
  '/analytics/company',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getCompanyAnalytics
);

router.get(
  '/analytics/platform',
  requireRole(['SUPER_ADMIN']),
  AIController.getPlatformAnalytics
);

// 7. Anomaly Detection & Business Recommendations
router.get(
  '/anomalies',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getAnomalyDetection
);

router.get(
  '/recommendations',
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  AIController.getBusinessRecommendations
);

export default router;
