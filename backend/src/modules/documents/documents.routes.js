import { Router } from 'express';
import multer from 'multer';
import documentsController from './documents.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';
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
router.get('/aadhaar/mode', cacheResponse('cache:docs_aadhaar_mode', 60), documentsController.getAadhaarMode);

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
router.get('/my', cacheResponse('cache:docs_my', 60), documentsController.getMyDocuments);
router.post('/upload', upload.single('file'), documentsController.upload);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:docs_stats', 60), documentsController.getStats);
router.get('/types', cacheResponse('cache:docs_types', 60), documentsController.listTypes);
router.post('/types', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.createType);
router.get('/employee/:employeeId', cacheResponse('cache:docs_employee', 60), documentsController.listByEmployee);
router.get('/', cacheResponse('cache:docs_list', 60), documentsController.listByCompany);
router.get('/:id/download', documentsController.download);
router.get('/:id', cacheResponse('cache:docs_detail', 60), documentsController.get);
router.post('/:id/verify', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.verify);
router.put('/:id/verify', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.verify);
router.post('/:id/reject', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.reject);
router.put('/:id/reject', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), documentsController.reject);
router.delete('/:id', documentsController.delete);

export default router;
