import tasksService from './tasks.service.js';
import { getAuthEmployeeId } from '../../security/data-scope.js';

export const tasksController = {
  /**
   * GET /tasks
   */
  async listTasks(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const role = req.user?.role || 'EMPLOYEE';
      const employeeId = await getAuthEmployeeId(req);

      const tasks = await tasksService.listTasks({
        companyId,
        employeeId,
        role,
        status: req.query.status,
        priority: req.query.priority,
        search: req.query.search
      });

      res.status(200).json({ status: 'ok', success: true, data: tasks, tasks });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /tasks/:id
   */
  async getTaskDetail(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const task = await tasksService.getTaskDetail(req.params.id, companyId);
      res.status(200).json({ status: 'ok', success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /tasks/:id/progress
   */
  async updateTaskProgress(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const employeeId = await getAuthEmployeeId(req);
      const { status, comment } = req.body;

      const updated = await tasksService.updateProgress({
        taskId: req.params.id,
        status,
        comment,
        userId,
        employeeId,
        companyId
      });

      res.status(200).json({ status: 'ok', success: true, message: 'Task progress updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /tasks/:id/comments
   */
  async addTaskComment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ status: 'error', success: false, message: 'Comment content is required' });
      }

      const comment = await tasksService.addComment({
        taskId: req.params.id,
        content: content.trim(),
        userId,
        companyId
      });

      res.status(201).json({ status: 'ok', success: true, message: 'Comment added to task', data: comment });
    } catch (err) {
      next(err);
    }
  }
};

export const listTasks = tasksController.listTasks;
export const getTaskDetail = tasksController.getTaskDetail;
export const updateTaskProgress = tasksController.updateTaskProgress;
export const addTaskComment = tasksController.addTaskComment;

export default tasksController;
