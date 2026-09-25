import { Router } from 'express';
import * as controller from './client-portal.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', controller.getDashboard);
router.get('/projects', controller.getProjects);
router.get('/projects/:id', controller.getProjectDetail);
router.post('/requirements', controller.createRequirement);
router.post('/comments', controller.addComment);
router.get('/invoices', controller.getInvoices);
router.get('/payments', controller.getPayments);

export default router;
