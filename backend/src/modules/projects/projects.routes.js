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

// Single Project Details
router.get('/:id', projectsController.getProjectDetail);

// Project Manager Assignment
router.patch('/:id/manager', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.assignManager);

// Project Members & Team Progress
router.get('/:id/members', projectsController.listMembers);
router.post('/:id/members', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.addMember);
router.delete('/:id/members/:memberId', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.removeMember);
router.get('/:id/members/progress', projectsController.getMemberProgress);

// Project Tasks
router.get('/:id/tasks', projectsController.getProjectTasks);
router.post('/:id/tasks', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'), projectsController.createProjectTask);

export default router;
