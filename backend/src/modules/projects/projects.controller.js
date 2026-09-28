import projectsService from './projects.service.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds, getAuthClientId } from '../../security/data-scope.js';

export const projectsController = {
  /**
   * GET /projects
   */
  async listProjects(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user.companyId;

      let employeeId = null;
      let clientId = null;
      let teamIds = [];

      if (role === 'CLIENT') {
        clientId = await getAuthClientId(req);
      } else if (role === 'EMPLOYEE') {
        employeeId = await getAuthEmployeeId(req);
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        employeeId = emp?.id;
        teamIds = await getManagerTeamIds(emp?.id);
        if (emp?.id && !teamIds.includes(emp.id)) {
          teamIds.push(emp.id);
        }
      }

      const projects = await projectsService.listProjects({
        companyId,
        role,
        employeeId,
        clientId,
        teamIds
      });

      res.status(200).json({ status: 'ok', success: true, data: projects, projects });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /projects
   */
  async createProject(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const createdBy = req.user.id;

      if (!req.body.name) {
        return res.status(400).json({ status: 'error', success: false, message: 'Project name is required' });
      }

      const project = await projectsService.createProject({
        companyId,
        data: req.body,
        createdBy
      });

      res.status(201).json({ status: 'ok', success: true, message: 'Project created successfully', data: project });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /projects/:id
   */
  async getProjectDetail(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const project = await projectsService.getProjectDetail({
        projectId: req.params.id,
        companyId
      });

      res.status(200).json({ status: 'ok', success: true, data: project });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /projects/:id/manager
   */
  async assignManager(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { managerId } = req.body;

      if (!managerId) {
        return res.status(400).json({ status: 'error', success: false, message: 'Manager ID is required' });
      }

      const result = await projectsService.assignManager({
        projectId: req.params.id,
        managerId,
        companyId,
        updatedBy: req.user.id
      });

      res.status(200).json({ status: 'ok', success: true, message: 'Project manager assigned', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /projects/:id/members
   */
  async listMembers(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const members = await projectsService.listMembers(req.params.id, companyId);
      res.status(200).json({ status: 'ok', success: true, data: members, members });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /projects/:id/members
   */
  async addMember(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { employeeId, role } = req.body;

      if (!employeeId) {
        return res.status(400).json({ status: 'error', success: false, message: 'Employee ID is required' });
      }

      const member = await projectsService.addMember({
        projectId: req.params.id,
        employeeId,
        role: role || 'DEVELOPER',
        companyId,
        addedBy: req.user.id
      });

      res.status(201).json({ status: 'ok', success: true, message: 'Member added to project', data: member });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /projects/:id/members/:memberId
   */
  async removeMember(req, res, next) {
    try {
      const companyId = req.user.companyId;
      await projectsService.removeMember({
        projectId: req.params.id,
        memberId: req.params.memberId,
        companyId
      });

      res.status(200).json({ status: 'ok', success: true, message: 'Member removed from project' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /projects/:id/members/progress
   */
  async getMemberProgress(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const progress = await projectsService.getMemberProgress(req.params.id, companyId);
      res.status(200).json({ status: 'ok', success: true, data: progress });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /projects/my
   */
  async getMyProjects(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const employeeId = await getAuthEmployeeId(req);

      const projects = await projectsService.getMyProjects({
        companyId,
        employeeId
      });

      res.status(200).json({ status: 'ok', success: true, data: projects, projects });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /projects/my/:id
   */
  async getMyProjectDetail(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const employeeId = await getAuthEmployeeId(req);

      const detail = await projectsService.getMyProjectDetail({
        projectId: req.params.id,
        companyId,
        employeeId
      });

      res.status(200).json({ status: 'ok', success: true, data: detail });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /projects/:id/tasks
   */
  async getProjectTasks(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { id: projectId } = req.params;
      const { status, priority, search } = req.query;

      const tasks = await projectsService.getProjectTasks({
        projectId,
        companyId,
        status,
        priority,
        search
      });

      res.status(200).json({
        status: 'ok',
        success: true,
        data: tasks,
        tasks,
        message: 'Tasks retrieved'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /projects/:id/tasks
   */
  async createProjectTask(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { id: projectId } = req.params;
      const { title, description, assigneeId, priority, status, estimatedHours, dueDate } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ status: 'error', success: false, message: 'Task title is required' });
      }

      const task = await projectsService.createProjectTask({
        projectId,
        companyId,
        data: {
          title: title.trim(),
          description: description?.trim(),
          assigneeId,
          priority,
          status,
          estimatedHours,
          dueDate
        },
        createdBy: req.user.id
      });

      res.status(201).json({
        status: 'ok',
        success: true,
        data: task,
        task,
        message: 'Task created successfully'
      });
    } catch (err) {
      next(err);
    }
  }
};

export const listProjects = projectsController.listProjects;
export const createProject = projectsController.createProject;
export const getProjectDetail = projectsController.getProjectDetail;
export const assignManager = projectsController.assignManager;
export const listMembers = projectsController.listMembers;
export const addMember = projectsController.addMember;
export const removeMember = projectsController.removeMember;
export const getMemberProgress = projectsController.getMemberProgress;
export const getMyProjects = projectsController.getMyProjects;
export const getMyProjectDetail = projectsController.getMyProjectDetail;
export const getProjectTasks = projectsController.getProjectTasks;
export const createProjectTask = projectsController.createProjectTask;

export default projectsController;
