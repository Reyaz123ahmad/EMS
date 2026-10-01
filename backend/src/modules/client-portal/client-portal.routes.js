import { Router } from 'express';
import * as controller from './client-portal.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', cacheResponse('cache:client_dashboard', 60), controller.getDashboard);
router.get('/projects', cacheResponse('cache:client_projects', 60), controller.getProjects);
router.get('/projects/:id', cacheResponse('cache:client_project_detail', 60), controller.getProjectDetail);
router.post('/requirements', controller.createRequirement);
router.post('/comments', controller.addComment);
router.get('/invoices', cacheResponse('cache:client_invoices', 60), controller.getInvoices);
router.get('/payments', cacheResponse('cache:client_payments', 60), controller.getPayments);

export default router;
