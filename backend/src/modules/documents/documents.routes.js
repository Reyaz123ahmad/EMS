import { Router } from 'express';
import multer from 'multer';
import documentsController from './documents.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  sendAadhaarOTPSchema,
  verifyAadhaarOTPSchema,
  uploadAadhaarSchema
} from './documents.validator.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.use(authenticate);

// ================= Aadhaar Verification & Feature Flag Routes =================
router.get('/aadhaar/mode', documentsController.getAadhaarMode);

router.post(
  '/aadhaar/send-otp',
  requireRole('EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  validate(sendAadhaarOTPSchema),
  documentsController.sendAadhaarOTP
);

router.post(
  '/aadhaar/verify-otp',
  requireRole('EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  validate(verifyAadhaarOTPSchema),
  documentsController.verifyAadhaarOTP
);

router.post(
  '/aadhaar/upload',
  requireRole('EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  upload.single('file'),
  validate(uploadAadhaarSchema),
  documentsController.uploadAadhaar
);

// ================= Standard Document Management Routes =================
router.post('/upload', upload.single('file'), documentsController.upload);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.getStats);
router.get('/types', documentsController.listTypes);
router.post('/types', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.createType);
router.get('/employee/:employeeId', documentsController.listByEmployee);
router.get('/', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.listByCompany);
router.get('/:id/download', documentsController.download);
router.get('/:id', documentsController.get);
router.post('/:id/verify', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.verify);
router.put('/:id/verify', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.verify);
router.post('/:id/reject', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.reject);
router.put('/:id/reject', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.reject);
router.delete('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.delete);

export default router;
