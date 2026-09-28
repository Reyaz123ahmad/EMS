import { prisma } from '../../config/prisma.js';

export const projectsService = {
  /**
   * Create Project
   */
  async createProject({ companyId, data, createdBy }) {
    // Validate client
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, companyId }
      });
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // Validate manager (must have MANAGER role)
    let validatedManagerEmployee = null;
    if (data.managerId) {
      const managerUser = await prisma.user.findFirst({
        where: {
          companyId,
          OR: [
            { id: data.managerId },
            { employee: { id: data.managerId } }
          ],
          userRoles: { some: { role: { name: 'MANAGER' } } }
        },
        include: {
          employee: true
        }
      });

      if (!managerUser) {
        const error = new Error('Selected user is not a Manager');
        error.statusCode = 400;
        throw error;
      }

      validatedManagerEmployee = managerUser.employee;
    }

    // Validate Team Members (must belong to the same company)
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds.filter(Boolean) : [];
    if (memberIds.length > 0) {
      const validEmployees = await prisma.employee.findMany({
        where: {
          id: { in: memberIds },
          companyId,
          status: 'ACTIVE'
        },
        select: { id: true }
      });

      if (validEmployees.length !== memberIds.length) {
        const error = new Error('One or more selected team members are invalid or do not belong to your organization');
        error.statusCode = 400;
        throw error;
      }
    }

    // Atomically create project + members inside transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          companyId,
          name: data.name,
          description: data.description || null,
          clientId: data.clientId || null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          budget: data.budget ? parseFloat(data.budget) : null,
          status: data.status || 'ACTIVE'
        }
      });

      // Add Manager if selected
      if (validatedManagerEmployee) {
        await tx.projectMember.create({
          data: {
            projectId: newProj.id,
            employeeId: validatedManagerEmployee.id,
            role: 'MANAGER'
          }
        });
      }

      // Add Selected Team Members (default role: DEVELOPER)
      for (const empId of memberIds) {
        if (validatedManagerEmployee && empId === validatedManagerEmployee.id) {
          continue; // Manager already added
        }
        await tx.projectMember.create({
          data: {
            projectId: newProj.id,
            employeeId: empId,
            role: 'DEVELOPER'
          }
        });
      }

      return newProj;
    });

    // Return project with full populated details
    return this.getProjectDetail({ projectId: project.id, companyId });
  },

  /**
   * List Projects
   */
  async listProjects({ companyId, role, employeeId, clientId, teamIds = [] }) {
    const where = { companyId };

    if (role === 'CLIENT' && clientId) {
      where.clientId = clientId;
    } else if (role === 'EMPLOYEE' && employeeId) {
      where.members = { some: { employeeId } };
    } else if (role === 'MANAGER' && teamIds.length > 0) {
      where.members = { some: { employeeId: { in: teamIds } } };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        members: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true }
            }
          }
        },
        _count: {
          select: { tasks: true, milestones: true, requirements: true, members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return projects.map(p => {
      const managerMember = p.members?.find(m => m.role === 'MANAGER' || m.role === 'PROJECT_MANAGER');
      return {
        ...p,
        manager: managerMember ? managerMember.employee : null,
        managerId: managerMember ? managerMember.employeeId : null,
        teamSize: p.members?.length || 0
      };
    });
  },

  /**
   * Get Project Detail
   */
  async getProjectDetail({ projectId, companyId }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        client: true,
        members: {
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
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        modules: {
          orderBy: { order: 'asc' }
        },
        milestones: {
          orderBy: { createdAt: 'asc' }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        },
        requirements: {
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const managerMember = project.members?.find(m => m.role === 'MANAGER' || m.role === 'PROJECT_MANAGER');

    return {
      ...project,
      manager: managerMember ? managerMember.employee : null,
      managerId: managerMember ? managerMember.employeeId : null
    };
  },

  /**
   * Assign Project Manager
   */
  async assignManager({ projectId, managerId, companyId, updatedBy }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const managerUser = await prisma.user.findFirst({
      where: {
        companyId,
        OR: [
          { id: managerId },
          { employee: { id: managerId } }
        ],
        userRoles: { some: { role: { name: 'MANAGER' } } }
      },
      include: { employee: true }
    });

    if (!managerUser || !managerUser.employee) {
      const error = new Error('Selected user is not a Manager');
      error.statusCode = 400;
      throw error;
    }

    const empId = managerUser.employee.id;

    // Remove existing manager role in project members if any
    await prisma.projectMember.deleteMany({
      where: { projectId, role: { in: ['MANAGER', 'PROJECT_MANAGER'] } }
    }).catch(() => {});

    // Upsert new manager as project member
    const member = await prisma.projectMember.upsert({
      where: {
        projectId_employeeId: { projectId, employeeId: empId }
      },
      update: { role: 'MANAGER' },
      create: { projectId, employeeId: empId, role: 'MANAGER' },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        }
      }
    });

    return {
      projectId,
      manager: member.employee,
      managerId: empId
    };
  },

  /**
   * List Project Members
   */
  async listMembers(projectId, companyId) {
    return prisma.projectMember.findMany({
      where: {
        projectId,
        project: { companyId }
      },
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
        }
      },
      orderBy: { joinedAt: 'asc' }
    });
  },

  /**
   * Add Member to Project
   */
  async addMember({ projectId, employeeId, role, companyId, addedBy }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const existing = await prisma.projectMember.findFirst({
      where: { projectId, employeeId }
    });

    if (existing) {
      const error = new Error('Already a member of this project');
      error.statusCode = 400;
      throw error;
    }

    return prisma.projectMember.create({
      data: {
        projectId,
        employeeId,
        role: role || 'DEVELOPER'
      },
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
        }
      }
    });
  },

  /**
   * Remove Member from Project
   */
  async removeMember({ projectId, memberId, companyId }) {
    return prisma.projectMember.deleteMany({
      where: {
        projectId,
        OR: [
          { id: memberId },
          { employeeId: memberId }
        ],
        project: { companyId }
      }
    });
  },

  /**
   * Get Member Progress
   */
  async getMemberProgress(arg1, arg2) {
    const projectId = typeof arg1 === 'object' ? arg1.projectId : arg1;
    const companyId = typeof arg1 === 'object' ? arg1.companyId : arg2;

    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
        project: { companyId }
      },
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
        }
      }
    });

    // Fetch tasks related to project (or company tasks assigned to members)
    const tasks = await prisma.task.findMany({
      where: { companyId }
    });

    return members.map(m => {
      const memberTasks = tasks.filter(t => t.employeeId === m.employeeId);
      const total = memberTasks.length;
      const completed = memberTasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
      const inProgress = memberTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const pending = memberTasks.filter(t => t.status === 'TODO' || t.status === 'PENDING').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: m.id,
        employeeId: m.employeeId,
        employee: m.employee,
        role: m.role,
        joinedAt: m.joinedAt,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        progress
      };
    });
  },

  /**
   * Get My Projects (Employee/Manager view)
   */
  async getMyProjects({ companyId, employeeId }) {
    if (!employeeId) return [];

    const memberships = await prisma.projectMember.findMany({
      where: {
        employeeId,
        project: { companyId }
      },
      include: {
        project: {
          include: {
            client: true,
            members: {
              include: {
                employee: {
                  select: { id: true, firstName: true, lastName: true, employeeCode: true }
                }
              }
            },
            _count: {
              select: { tasks: true, milestones: true, requirements: true }
            }
          }
        }
      }
    });

    const tasks = await prisma.task.findMany({
      where: { companyId, employeeId }
    });

    return memberships.map(m => {
      const p = m.project;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const managerMember = p.members?.find(mem => mem.role === 'MANAGER' || mem.role === 'PROJECT_MANAGER');

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget,
        client: p.client,
        myRole: m.role,
        manager: managerMember ? managerMember.employee : null,
        totalTasks,
        completedTasks,
        progress,
        teamSize: p.members?.length || 0
      };
    });
  },

  /**
   * Get My Project Detail
   */
  async getMyProjectDetail({ projectId, companyId, employeeId }) {
    const detail = await this.getProjectDetail({ projectId, companyId });
    const myMembership = detail.members?.find(m => m.employeeId === employeeId);

    const myTasks = await prisma.task.findMany({
      where: { companyId, employeeId },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      ...detail,
      myRole: myMembership?.role || 'MEMBER',
      myTasks
    };
  },

  /**
   * Get Tasks for a Project (GET /projects/:id/tasks)
   */
  async getProjectTasks({ projectId, companyId, status, priority, search }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const where = {
      projectId,
      project: { companyId }
    };

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

    const projectTasks = await prisma.projectTask.findMany({
      where,
      include: {
        module: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const assigneeIds = [...new Set(projectTasks.map(t => t.assigneeId).filter(Boolean))];
    const employees = assigneeIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: assigneeIds }, companyId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { name: true } }
          }
        })
      : [];
    const empMap = new Map(employees.map(e => [e.id, e]));

    return projectTasks.map(t => ({
      ...t,
      employee: t.assigneeId ? empMap.get(t.assigneeId) || null : null
    }));
  },

  /**
   * Create Project Task (POST /projects/:id/tasks)
   */
  async createProjectTask({ projectId, companyId, data, createdBy }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        assigneeId: data.assigneeId || null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'TODO',
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    let employee = null;
    if (task.assigneeId) {
      employee = await prisma.employee.findFirst({
        where: { id: task.assigneeId, companyId },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
      });
    }

    return { ...task, employee };
  }
};

export default projectsService;
