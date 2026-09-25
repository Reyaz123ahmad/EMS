import { Router } from 'express';
import documentsController from './documents.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', documentsController.upload);
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
