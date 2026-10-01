import { Router } from 'express';
import projectsController from './projects.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// My Projects (For Employee/Manager self-service)
router.get('/my', cacheResponse('cache:projects_my', 60), projectsController.getMyProjects);
router.get('/my/:id', cacheResponse('cache:projects_my_detail', 60), projectsController.getMyProjectDetail);

// Project Listing & Creation
router.get('/', cacheResponse('cache:projects_list', 60), projectsController.listProjects);
router.post('/', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), projectsController.createProject);

// Project Manager Assignment
router.patch('/:id/manager', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.assignManager);

// Project Tasks (Defined BEFORE /:id to prevent route shadowing)
router.get('/:id/tasks', cacheResponse('cache:projects_tasks', 60), projectsController.getProjectTasks);
router.post('/:id/tasks', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.createProjectTask);

// Project Members & Team Progress (Defined BEFORE /:id)
router.get('/:id/members/progress', cacheResponse('cache:projects_progress', 60), projectsController.getMemberProgress);
router.get('/:id/members', cacheResponse('cache:projects_members', 60), projectsController.listMembers);
router.post('/:id/members', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.addMember);
router.delete('/:id/members/:memberId', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.removeMember);

// Single Project Details (Generic :id wildcard route)
router.get('/:id', cacheResponse('cache:projects_detail', 60), projectsController.getProjectDetail);

export default router;
