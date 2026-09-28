import prisma from '../config/prisma.js';

export class ForbiddenError extends Error {
  constructor(message = 'Access denied: You do not have permission to access this resource') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

/**
 * Resolve authenticated user's Employee record safely from DB
 */
export async function getAuthEmployee(req) {
  if (req.user?.employee && req.user.employee.id) {
    return req.user.employee;
  }

  const userId = req.user?.id || req.user?.userId;
  if (!userId) return null;

  let employee = await prisma.employee.findFirst({
    where: { userId },
    include: { department: true, designation: true, branch: true }
  });

  // If missing but user belongs to a company and is not super admin, auto-link/create
  if (!employee && req.user.companyId && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      employee = await prisma.employee.create({
        data: {
          companyId: req.user.companyId,
          userId: user.id,
          employeeCode: empCode,
          firstName: user.email.split('@')[0],
          lastName: 'User',
          email: user.email,
          joiningDate: new Date(),
          status: 'ACTIVE'
        },
        include: { department: true, designation: true, branch: true }
      }).catch(async () => {
        return await prisma.employee.findFirst({ where: { userId } });
      });
    }
  }

  if (employee) {
    req.user.employee = employee;
    req.user.employeeId = employee.id;
  }

  return employee;
}

/**
 * Get authenticated user's employeeId
 */
export async function getAuthEmployeeId(req) {
  const emp = await getAuthEmployee(req);
  return emp ? emp.id : null;
}

/**
 * Get authenticated user's clientId
 */
export async function getAuthClientId(req) {
  if (req.user?.clientId) return req.user.clientId;
  const userId = req.user?.id || req.user?.userId;
  if (!userId) return null;

  let client = await prisma.client.findFirst({
    where: { userId }
  });

  if (!client && req.user.companyId && req.user.role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      client = await prisma.client.create({
        data: {
          companyId: req.user.companyId,
          userId: user.id,
          name: user.email.split('@')[0],
          email: user.email,
          isActive: true
        }
      }).catch(async () => {
        return await prisma.client.findFirst({ where: { userId } });
      });
    }
  }

  if (client) {
    req.user.clientId = client.id;
    return client.id;
  }
  return null;
}

/**
 * Resolve manager team employee IDs (manager + direct/indirect subordinates)
 */
export async function getManagerTeamIds(managerEmployeeId) {
  if (!managerEmployeeId) return [];
  const subordinates = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId },
    select: { id: true }
  });
  const subIds = subordinates.map((s) => s.id);
  return [managerEmployeeId, ...subIds];
}

/**
 * Generate role-scoped WHERE clause for list queries across any entity
 */
export async function getScopeWhere(req, entityType = 'employee') {
  const role = req.user?.role || 'EMPLOYEE';
  const companyId = req.user?.companyId;

  // 1. SUPER_ADMIN sees everything (or company-filtered if requested)
  if (role === 'SUPER_ADMIN') {
    return companyId ? { companyId } : {};
  }

  // 2. COMPANY_ADMIN & HR_ADMIN see full company data
  if (role === 'COMPANY_ADMIN' || role === 'HR_ADMIN') {
    if (entityType === 'document' || entityType === 'performanceReview' || entityType === 'salarySlip') {
      return { employee: { companyId } };
    }
    return { companyId };
  }

  // 3. HR_MANAGER: scoped to own department
  if (role === 'HR_MANAGER') {
    const emp = await getAuthEmployee(req);
    const departmentId = emp?.departmentId;

    if (entityType === 'employee') {
      return departmentId ? { companyId, departmentId } : { companyId, id: emp?.id };
    }
    if (entityType === 'attendance' || entityType === 'leave' || entityType === 'overtime' || entityType === 'document' || entityType === 'performanceReview' || entityType === 'salarySlip') {
      return departmentId
        ? { companyId, employee: { departmentId } }
        : { companyId, employeeId: emp?.id };
    }
    if (entityType === 'task') {
      return departmentId
        ? { companyId, employee: { departmentId } }
        : { companyId, employeeId: emp?.id };
    }
    return { companyId };
  }

  // 4. MANAGER: scoped to own team (self + direct subordinates)
  if (role === 'MANAGER') {
    const emp = await getAuthEmployee(req);
    const teamIds = await getManagerTeamIds(emp?.id);

    if (entityType === 'employee') {
      return { companyId, id: { in: teamIds } };
    }
    if (entityType === 'attendance' || entityType === 'leave' || entityType === 'overtime' || entityType === 'task' || entityType === 'salarySlip' || entityType === 'performanceReview') {
      return { companyId, employeeId: { in: teamIds } };
    }
    if (entityType === 'document') {
      return { employeeId: { in: teamIds } };
    }
    if (entityType === 'project') {
      return { companyId, members: { some: { employeeId: { in: teamIds } } } };
    }
    if (entityType === 'asset') {
      return { companyId, assignments: { some: { employeeId: { in: teamIds } } } };
    }
    return { companyId };
  }

  // 5. EMPLOYEE: scoped strictly to own data
  if (role === 'EMPLOYEE') {
    const emp = await getAuthEmployee(req);
    const ownId = emp?.id || '__NO_ACCESS__';

    if (entityType === 'employee') {
      return { companyId, id: ownId };
    }
    if (entityType === 'attendance' || entityType === 'leave' || entityType === 'overtime' || entityType === 'task' || entityType === 'salarySlip' || entityType === 'performanceReview' || entityType === 'document') {
      return { employeeId: ownId };
    }
    if (entityType === 'project') {
      return { companyId, members: { some: { employeeId: ownId } } };
    }
    if (entityType === 'asset') {
      return { companyId, assignments: { some: { employeeId: ownId } } };
    }
    return { companyId };
  }

  // 6. CLIENT: scoped strictly to own projects & invoices
  if (role === 'CLIENT') {
    const clientId = await getAuthClientId(req);
    const ownClientId = clientId || '__NO_ACCESS__';

    if (entityType === 'project') {
      return { companyId, clientId: ownClientId };
    }
    if (entityType === 'invoice') {
      return { clientId: ownClientId };
    }
    return { id: '__NO_ACCESS__' };
  }

  return { companyId };
}

/**
 * Verify resource ownership on single-resource operations (/:id)
 * Throws ForbiddenError (403) if access is denied
 */
export async function assertResourceAccess(req, resource, entityType = 'general') {
  if (!resource) return;

  const role = req.user?.role || 'EMPLOYEE';
  const companyId = req.user?.companyId;

  // SUPER_ADMIN has global access
  if (role === 'SUPER_ADMIN') return;

  // COMPANY_ADMIN & HR_ADMIN: verify company boundary
  if (role === 'COMPANY_ADMIN' || role === 'HR_ADMIN') {
    const resCompanyId = resource.companyId || resource.employee?.companyId;
    if (resCompanyId && resCompanyId !== companyId) {
      throw new ForbiddenError('Access denied: Resource belongs to a different organization');
    }
    return;
  }

  // HR_MANAGER: verify department boundary
  if (role === 'HR_MANAGER') {
    const emp = await getAuthEmployee(req);
    const deptId = emp?.departmentId;
    const resDeptId = resource.departmentId || resource.employee?.departmentId;

    if (deptId && resDeptId && deptId !== resDeptId) {
      throw new ForbiddenError('Access denied: Resource belongs to a different department');
    }
    return;
  }

  // MANAGER: verify team membership
  if (role === 'MANAGER') {
    const emp = await getAuthEmployee(req);
    const teamIds = await getManagerTeamIds(emp?.id);
    const targetEmpId = resource.employeeId || resource.id;

    if (targetEmpId && !teamIds.includes(targetEmpId)) {
      throw new ForbiddenError('Access denied: Resource belongs outside your team');
    }
    return;
  }

  // EMPLOYEE: verify strict own identity
  if (role === 'EMPLOYEE') {
    const emp = await getAuthEmployee(req);
    const ownId = emp?.id;
    const targetEmpId = resource.employeeId || resource.id;

    if (targetEmpId && targetEmpId !== ownId) {
      throw new ForbiddenError('Access denied: You can only view and manage your own records');
    }
    return;
  }

  // CLIENT: verify client ownership
  if (role === 'CLIENT') {
    const clientId = await getAuthClientId(req);
    const targetClientId = resource.clientId || resource.id;

    if (targetClientId && targetClientId !== clientId) {
      throw new ForbiddenError('Access denied: You can only view your own client projects and billing');
    }
    return;
  }
}

/**
 * Helper functions for direct userId filtering
 */
export async function getEmployeeFilter(userId) {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  return { employeeId: emp ? emp.id : '__NO_ACCESS__' };
}

export async function getManagerFilter(userId) {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  if (!emp) return { teamEmployeeIds: [] };
  const teamIds = await getManagerTeamIds(emp.id);
  return { teamEmployeeIds: teamIds };
}

export async function getHRManagerFilter(userId) {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  return { departmentId: emp?.departmentId || '__NO_ACCESS__' };
}

export async function getClientFilter(userId) {
  const client = await prisma.client.findFirst({ where: { userId } });
  return { clientId: client ? client.id : '__NO_ACCESS__' };
}

export default {
  ForbiddenError,
  getAuthEmployee,
  getAuthEmployeeId,
  getAuthClientId,
  getManagerTeamIds,
  getScopeWhere,
  assertResourceAccess,
  getEmployeeFilter,
  getManagerFilter,
  getHRManagerFilter,
  getClientFilter
};

