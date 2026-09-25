import { Router } from 'express';
import { emergencyAttendanceController } from './emergency-attendance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createEmergencyAttendanceSchema,
  approveEmergencySchema,
  rejectEmergencySchema,
  bulkApproveSchema,
} from './emergency-attendance.validator.js';

const router = Router();

router.use(authenticate);

router.get('/stats', emergencyAttendanceController.getEmergencyStats);
router.post('/bulk-approve', validate(bulkApproveSchema), emergencyAttendanceController.bulkApprove);

router.get('/', emergencyAttendanceController.getRequests);
router.post('/', validate(createEmergencyAttendanceSchema), emergencyAttendanceController.createRequest);
router.get('/:id', emergencyAttendanceController.getRequestById);
router.post('/:id/approve', validate(approveEmergencySchema), emergencyAttendanceController.approveRequest);
router.post('/:id/reject', validate(rejectEmergencySchema), emergencyAttendanceController.rejectRequest);

export default router;
