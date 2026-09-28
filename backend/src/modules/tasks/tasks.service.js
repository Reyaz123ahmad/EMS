import { prisma } from '../../config/prisma.js';

export const tasksService = {
  /**
   * List Tasks
   */
  async listTasks({ companyId, employeeId, role, status, priority, search }) {
    const where = { companyId };

    if (employeeId && role === 'EMPLOYEE') {
      where.employeeId = employeeId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { name: true } }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { comments: true, history: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Get Task Detail
   */
  async getTaskDetail(id, companyId) {
    const task = await prisma.task.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { name: true } }
          }
        },
        comments: {
          orderBy: { createdAt: 'asc' }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    return task;
  },

  /**
   * Update Task Progress (Employee / Manager)
   */
  async updateProgress({ taskId, status, comment, userId, employeeId, companyId }) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, companyId }
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const oldStatus = task.status;
    const newStatus = status || oldStatus;
    const isCompleted = newStatus === 'COMPLETED' || newStatus === 'DONE';

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: isCompleted ? (task.completedAt || new Date()) : null
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true }
        },
        comments: { orderBy: { createdAt: 'asc' } }
      }
    });

    // Record status history if changed
    if (oldStatus !== newStatus) {
      await prisma.taskHistory.create({
        data: {
          taskId,
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
          changedBy: userId || 'User'
        }
      }).catch(() => {});
    }

    // Add optional comment
    if (comment && comment.trim()) {
      await prisma.taskComment.create({
        data: {
          taskId,
          userId: userId || 'system',
          content: comment.trim()
        }
      }).catch(() => {});
    }

    return updatedTask;
  },

  /**
   * Create Task (supports both project tasks and standalone employee tasks)
   */
  async createTask({ companyId, projectId, employeeId, title, description, assigneeId, priority, status, dueDate, createdBy }) {
    if (!title || !title.trim()) {
      const error = new Error('Task title is required');
      error.statusCode = 400;
      throw error;
    }

    if (projectId) {
      // Validate project exists and belongs to company
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId }
      });
      if (!project) {
        const error = new Error('Project not found or does not belong to this company');
        error.statusCode = 404;
        throw error;
      }

      const projectTask = await prisma.projectTask.create({
        data: {
          projectId,
          title: title.trim(),
          description: description || null,
          assigneeId: assigneeId || employeeId || null,
          priority: priority || 'MEDIUM',
          status: status || 'TODO',
          dueDate: dueDate ? new Date(dueDate) : null
        }
      });

      let employee = null;
      if (projectTask.assigneeId) {
        employee = await prisma.employee.findFirst({
          where: { id: projectTask.assigneeId, companyId },
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        });
      }

      return { ...projectTask, employee, project: { id: project.id, name: project.name } };
    }

    // Standalone employee task
    const targetEmployeeId = employeeId || assigneeId;
    if (!targetEmployeeId) {
      const error = new Error('Employee ID or Project ID is required to create a task');
      error.statusCode = 400;
      throw error;
    }

    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId }
    });
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.task.create({
      data: {
        companyId,
        employeeId: targetEmployeeId,
        title: title.trim(),
        description: description || null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      }
    });
  },

  /**
   * Add Task Comment
   */
  async addComment({ taskId, content, userId, companyId }) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, companyId }
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.taskComment.create({
      data: {
        taskId,
        userId: userId || 'user',
        content
      }
    });
  }
};

export default tasksService;
