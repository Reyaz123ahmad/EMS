import { Router } from 'express';
import projectsController from './projects.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// My Projects (For Employee/Manager self-service)
router.get('/my', projectsController.getMyProjects);
router.get('/my/:id', projectsController.getMyProjectDetail);

// Project Listing & Creation
router.get('/', projectsController.listProjects);
router.post('/', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), projectsController.createProject);

// Project Manager Assignment
router.patch('/:id/manager', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.assignManager);

// Project Tasks (Defined BEFORE /:id to prevent route shadowing)
router.get('/:id/tasks', projectsController.getProjectTasks);
router.post('/:id/tasks', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.createProjectTask);

// Project Members & Team Progress (Defined BEFORE /:id)
router.get('/:id/members/progress', projectsController.getMemberProgress);
router.get('/:id/members', projectsController.listMembers);
router.post('/:id/members', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.addMember);
router.delete('/:id/members/:memberId', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.removeMember);

// Single Project Details (Generic :id wildcard route)
router.get('/:id', projectsController.getProjectDetail);

export default router;
