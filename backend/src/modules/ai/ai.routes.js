import { Router } from 'express';
import AIController from './ai.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { chatSchema } from './ai.validator.js';

const router = Router();

// Require authentication on all AI routes
router.use(authenticate);

// 1. Interactive AI Assistant Chat
router.post('/chat', validate(chatSchema), AIController.chat);

// 2. AI Usage & Free Tier Stats
router.get('/usage-stats', AIController.getUsageStats);

// 3. Saved Insights History
router.get('/insights', AIController.listInsights);

// 4. Employee Performance & Improvement Plans
router.get(
  '/employees/:employeeId/performance',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER']),
  AIController.getEmployeePerformance
);

router.get(
  '/employees/:employeeId/improvement-plan',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER']),
  AIController.getEmployeeImprovementPlan
);

// 5. Predictive AI: Attrition & Attendance
router.get(
  '/employees/:employeeId/attrition',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER']),
  AIController.getAttritionPrediction
);

router.get(
  '/attendance/prediction',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER']),
  AIController.getAttendancePrediction
);

// 6. Company & Platform Analytics AI
router.get(
  '/analytics/company',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN']),
  AIController.getCompanyAnalytics
);

router.get(
  '/analytics/platform',
  authorize(['SUPER_ADMIN']),
  AIController.getPlatformAnalytics
);

// 7. Anomaly Detection & Business Recommendations
router.get(
  '/anomalies',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN']),
  AIController.getAnomalyDetection
);

router.get(
  '/recommendations',
  authorize(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER']),
  AIController.getBusinessRecommendations
);

export default router;
