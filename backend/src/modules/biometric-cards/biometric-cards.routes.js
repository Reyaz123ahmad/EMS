import { Router } from 'express';
import {
  biometricCardsController,
  listCards,
  getMyCard,
  generateCard,
  assignCard,
  getCard,
  deactivateCard,
  regenerateQR,
  downloadCard,
  verifyQR
} from './biometric-cards.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Public endpoint: verify QR validity without requiring full login
router.post('/verify-qr', verifyQR);

// Protected routes (require auth)
router.use(authenticate);

router.get('/', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), listCards);
router.get('/my', getMyCard);
router.post('/generate', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'), generateCard);
router.post('/assign', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), assignCard);
router.get('/:id', getCard);
router.post('/:id/deactivate', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'), deactivateCard);
router.post('/:id/regenerate', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'), regenerateQR);
router.get('/:id/download', downloadCard);

export default router;
