import crypto from 'crypto';
import employeesRepository from './employees.repository.js';
import authRepository from '../auth/auth.repository.js';
import companiesRepository from '../companies/companies.repository.js';
import { hashPassword } from '../../security/password.js';
import { addOTPEmail, addCredentialsEmail } from '../../queues/email.queue.js';
import { DEFAULT_LEAVE_QUOTAS } from './employees.constants.js';
import { prisma } from '../../config/prisma.js';

function parseSessionData(rawData) {
  if (!rawData) return null;
  const payload = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  if (payload && typeof payload.otp === 'string' && payload.otp.startsWith('{')) {
    try {
      return JSON.parse(payload.otp);
    } catch {
      return payload;
    }
  }
  return payload;
}

export const ROLE_ASSIGNMENT_MATRIX = {
  SUPER_ADMIN: ['COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  COMPANY_ADMIN: ['HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  HR_ADMIN: ['HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  HR_MANAGER: ['EMPLOYEE'],
  MANAGER: [],
  EMPLOYEE: []
};

export function checkRoleAssignmentPermission(creatorRoleOrRoles, targetRoleName) {
  const roles = Array.isArray(creatorRoleOrRoles) ? creatorRoleOrRoles : [creatorRoleOrRoles];
  if (roles.includes('SUPER_ADMIN')) return true;

  let allowed = [];
  for (const r of roles) {
    if (ROLE_ASSIGNMENT_MATRIX[r]) {
      allowed = allowed.concat(ROLE_ASSIGNMENT_MATRIX[r]);
    }
  }

  return allowed.includes(targetRoleName);
}

export const employeesService = {
  /**
   * Step 1: Send Employee Verification OTP
   */
  async sendEmployeeOTP({ employeeData, companyId, reqUser }) {
    const existingUser = await authRepository.findUserByEmail(employeeData.email);
    if (existingUser) {
      throw new Error(`An account with email ${employeeData.email} already exists.`);
    }

    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) {
      throw new Error('Target company not found.');
    }

    // Validate role permissions upfront if roleId or role name provided
    if (employeeData.roleId || employeeData.role) {
      let targetRole = null;
      if (employeeData.roleId) {
        targetRole = await prisma.role.findFirst({
          where: {
            id: employeeData.roleId,
            OR: [{ companyId: null }, { companyId }]
          }
        });
      } else {
        targetRole = await prisma.role.findFirst({
          where: {
            name: employeeData.role,
            OR: [{ companyId: null }, { companyId }]
          }
        });
      }

      if (!targetRole) {
        const error = new Error('Selected role does not exist.');
        error.statusCode = 400;
        throw error;
      }

      const creatorRoles = Array.isArray(reqUser?.roles)
        ? reqUser.roles
        : [reqUser?.role || 'EMPLOYEE'];

      if (!checkRoleAssignmentPermission(creatorRoles, targetRole.name)) {
        const error = new Error(`You do not have permission to assign the ${targetRole.name} role.`);
        error.statusCode = 403;
        throw error;
      }
    }

    const sessionId = crypto.randomUUID();
    const otp = crypto.randomInt(100000, 999999).toString();

    const sessionPayload = {
      sessionId,
      otp,
      attempts: 0,
      verified: false,
      employeeData,
      companyId,
      companyName: company.name,
      createdAt: Date.now()
    };

    // Store in Redis for 15 minutes
    await authRepository.storeOTP(
      `session:${sessionId}`,
      JSON.stringify(sessionPayload),
      'EMPLOYEE_CREATE',
      15
    );

    // Queue OTP email via BullMQ
    await addOTPEmail({
      to: employeeData.email,
      name: `${employeeData.firstName} ${employeeData.lastName}`,
      otp,
      purpose: 'EMPLOYEE_CREATE',
      expiryMinutes: 15,
      companyName: company.name
    });

    return {
      sessionId,
      message: `Verification code sent to ${employeeData.email}`
    };
  },

  /**
   * Step 2: Verify Employee OTP
   */
  async verifyEmployeeOTP({ email, otp, sessionId }) {
    const rawData = await authRepository.getOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');
    if (!rawData) {
      throw new Error('Verification session has expired or does not exist. Please request a new code.');
    }

    const session = parseSessionData(rawData);
    if (!session || !session.employeeData) {
      throw new Error('Invalid verification session format. Please request a new code.');
    }

    if (session.employeeData.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Email does not match this verification session.');
    }

    if (session.attempts >= 5) {
      throw new Error('Maximum verification attempts exceeded.');
    }

    if (session.otp !== String(otp).trim()) {
      session.attempts += 1;
      await authRepository.storeOTP(
        `session:${sessionId}`,
        JSON.stringify(session),
        'EMPLOYEE_CREATE',
        15
      );
      throw new Error(`Invalid verification code. ${5 - session.attempts} attempts remaining.`);
    }

    session.verified = true;
    await authRepository.storeOTP(
      `session:${sessionId}`,
      JSON.stringify(session),
      'EMPLOYEE_CREATE',
      30
    );

    return {
      verified: true,
      sessionId,
      message: 'Email successfully verified. You may now complete employee onboarding.'
    };
  },

  /**
   * Step 3: Create Employee, User account, and initial allocations
   */
  async createEmployeeWithUser({ sessionId, employeeData, companyId, createdBy, reqUser }) {
    const rawData = await authRepository.getOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');
    if (!rawData) {
      throw new Error('Verification session expired. Please verify OTP again.');
    }

    const session = parseSessionData(rawData);
    if (!session || !session.verified) {
      throw new Error('Please verify OTP code before creating employee record.');
    }

    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) throw new Error('Company not found');

    // Determine target role (prioritize explicit employeeData, then session data, fallback to EMPLOYEE)
    let targetRole = null;
    const roleIdToUse = employeeData?.roleId || session?.employeeData?.roleId;
    const roleNameToUse = employeeData?.role || session?.employeeData?.role;

    if (roleIdToUse) {
      targetRole = await prisma.role.findFirst({
        where: {
          id: roleIdToUse,
          OR: [{ companyId: null }, { companyId }]
        }
      });
    } else if (roleNameToUse) {
      targetRole = await prisma.role.findFirst({
        where: {
          name: roleNameToUse,
          OR: [{ companyId: null }, { companyId }]
        }
      });
    }

    if (!targetRole) {
      targetRole = await prisma.role.findFirst({
        where: { name: 'EMPLOYEE', companyId: null }
      });
    }

    if (!targetRole) {
      throw new Error('Default EMPLOYEE role not found.');
    }

    if (reqUser && targetRole.name !== 'EMPLOYEE') {
      const creatorRoles = Array.isArray(reqUser.roles) ? reqUser.roles : [reqUser.role || 'EMPLOYEE'];
      if (!checkRoleAssignmentPermission(creatorRoles, targetRole.name)) {
        const error = new Error(`You do not have permission to assign the ${targetRole.name} role.`);
        error.statusCode = 403;
        throw error;
      }
    }

    // Generate employee code if not provided
    const employeeCode =
      employeeData.employeeCode || (await employeesRepository.generateEmployeeCode(companyId));

    // Generate temporary password
    const temporaryPassword = `Emp@${crypto.randomBytes(4).toString('hex')}!`;
    const passwordHash = await hashPassword(temporaryPassword);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          companyId,
          email: employeeData.email,
          phone: employeeData.phone || null,
          passwordHash,
          status: 'ACTIVE',
          twoFactorEnabled: false
        }
      });

      // 2. Assign Target role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: targetRole.id
        }
      });

      // 3. Fallback branch/department if not supplied
      let branchId = employeeData.branchId;
      if (!branchId) {
        const defaultBranch = await tx.branch.findFirst({ where: { companyId } });
        branchId = defaultBranch?.id;
      }

      let departmentId = employeeData.departmentId;
      if (!departmentId) {
        const defaultDept = await tx.department.findFirst({ where: { companyId } });
        departmentId = defaultDept?.id;
      }

      // 4. Create Employee Record
      const employee = await tx.employee.create({
        data: {
          companyId,
          userId: user.id,
          employeeCode,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone || null,
          branchId,
          departmentId,
          designationId: employeeData.designationId || null,
          joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate) : new Date(),
          employmentType: employeeData.employmentType || 'FULL_TIME',
          status: 'ACTIVE'
        }
      });

      // 5. Assign Shift
      let finalShiftId = employeeData.shiftId;
      if (!finalShiftId) {
        const defaultShift = await tx.shift.findFirst({
          where: { companyId, isActive: true },
          orderBy: { createdAt: 'asc' }
        });
        finalShiftId = defaultShift?.id;
      }

      if (finalShiftId) {
        await tx.shiftAssignment.create({
          data: {
            employeeId: employee.id,
            shiftId: finalShiftId,
            effectiveFrom: new Date()
          }
        });
      }

      // 6. Initialize Leave Balances
      const currentYear = new Date().getFullYear();
      for (const quota of DEFAULT_LEAVE_QUOTAS) {
        let leaveType = await tx.leaveType.findFirst({
          where: { companyId, name: quota.name }
        });

        if (!leaveType) {
          leaveType = await tx.leaveType.create({
            data: {
              companyId,
              name: quota.name,
              code: quota.code,
              maxDaysPerYear: quota.days,
              isPaid: quota.isPaid
            }
          });
        }

        await tx.leaveBalance.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
            totalDays: quota.days,
            usedDays: 0,
            remainingDays: quota.days
          }
        });
      }

      // 7. Audit Log
      let auditUserId = user.id;
      if (createdBy) {
        const creatorExists = await tx.user.findUnique({ where: { id: createdBy } });
        if (creatorExists) auditUserId = createdBy;
      }

      await tx.auditLog.create({
        data: {
          userId: auditUserId,
          action: 'CREATE_EMPLOYEE',
          entity: 'Employee',
          entityId: employee.id,
          newValues: {
            employeeCode,
            email: employee.email,
            companyName: company.name,
            shiftId: finalShiftId,
            role: targetRole.name
          }
        }
      });

      return { employee, user };
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    // Cleanup session
    await authRepository.deleteOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');

    // Queue Credentials Email via BullMQ
    await addCredentialsEmail({
      to: employeeData.email,
      name: `${employeeData.firstName} ${employeeData.lastName}`,
      email: employeeData.email,
      password: temporaryPassword,
      role: targetRole.name || 'EMPLOYEE',
      companyName: company.name,
      employeeCode,
      department: employeeData.department || 'General',
      loginUrl: 'http://localhost:3000/login'
    });

    return {
      employee: result.employee,
      user: {
        id: result.user.id,
        email: result.user.email
      },
      message: 'Employee record and user portal access provisioned successfully.'
    };
  },

  /**
   * List employees with filters
   */
  async listEmployees(companyId, filters, pagination) {
    return employeesRepository.findAllEmployees(companyId, filters, pagination);
  },

  /**
   * Get single employee by ID
   */
  async getEmployeeById(id) {
    const employee = await employeesRepository.findEmployeeById(id);
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }
    return employee;
  },

  /**
   * Update employee
   */
  async updateEmployee(id, data, companyId, updatedBy) {
    if (typeof id === 'object' && id !== null) {
      const params = id;
      id = params.id;
      companyId = params.companyId || companyId;
      data = params.data || data;
      updatedBy = params.updatedBy || updatedBy;
    }

    // Validate employee exists
    const existing = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existing) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const compId = companyId || existing.companyId;

    // Validate department if provided
    if (data.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: data.departmentId, companyId: compId }
      });
      if (!dept) {
        const error = new Error('Department not found');
        error.statusCode = 400;
        error.code = 'DEPARTMENT_NOT_FOUND';
        throw error;
      }
    }

    // Validate designation if provided
    if (data.designationId) {
      const desig = await prisma.designation.findFirst({
        where: { id: data.designationId, companyId: compId }
      });
      if (!desig) {
        const error = new Error('Designation not found');
        error.statusCode = 400;
        error.code = 'DESIGNATION_NOT_FOUND';
        throw error;
      }
    }

    // Validate branch if provided
    if (data.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: data.branchId, companyId: compId }
      });
      if (!branch) {
        const error = new Error('Branch not found');
        error.statusCode = 400;
        error.code = 'BRANCH_NOT_FOUND';
        throw error;
      }
    }

    // Validate manager if provided
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: data.managerId, companyId: compId }
      });
      if (!manager) {
        const error = new Error('Manager not found');
        error.statusCode = 400;
        error.code = 'MANAGER_NOT_FOUND';
        throw error;
      }
    }

    // Now update
    return await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  },

  /**
   * Delete employee
   */
  async deleteEmployee(id) {
    return employeesRepository.deleteEmployee(id);
  },

  /**
   * Employee personal dashboard data
   */
  async getEmployeeDashboard(employeeId) {
    const employee = await employeesRepository.findEmployeeById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const recentAttendance = await prisma.attendanceLog.findMany({
      where: { employeeId },
      orderBy: { attendanceDate: 'desc' },
      take: 7
    });

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId },
      include: { leaveType: true }
    });

    return {
      employee,
      recentAttendance,
      leaveBalances
    };
  },

  /**
   * Register Face Embedding and photo URL
   */
  async registerFace(employeeId, photoUrl, embedding) {
    return employeesRepository.updateEmployee(employeeId, {
      facePhotoUrl: photoUrl,
      faceEmbedding: typeof embedding === 'string' ? embedding : JSON.stringify(embedding),
      faceRegisteredAt: new Date()
    });
  },

  /**
   * Bulk Import Employees
   */
  async bulkImportEmployees({ rows = [], companyId, createdBy }) {
    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) throw new Error('Company not found');

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const [index, row] of rows.entries()) {
      try {
        if (!row.firstName || !row.lastName || !row.email) {
          throw new Error('firstName, lastName, and email are required');
        }

        const existingUser = await authRepository.findUserByEmail(row.email);
        if (existingUser) {
          throw new Error(`Email ${row.email} is already in use`);
        }

        const employeeCode = row.employeeCode || `EMP${String(index + 1).padStart(3, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const tempPassword = `Temp@${crypto.randomInt(100000, 999999)}`;
        const passwordHash = await hashPassword(tempPassword);

        // Fetch or assign role
        const employeeRole = await prisma.role.findFirst({
          where: { name: 'EMPLOYEE' }
        });

        const created = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              companyId,
              email: row.email.toLowerCase().trim(),
              phone: row.phone || null,
              passwordHash,
              status: 'ACTIVE'
            }
          });

          if (employeeRole) {
            await tx.userRole.create({
              data: {
                userId: user.id,
                roleId: employeeRole.id
              }
            });
          }

          const emp = await tx.employee.create({
            data: {
              companyId,
              userId: user.id,
              employeeCode,
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              email: row.email.toLowerCase().trim(),
              phone: row.phone || null,
              departmentId: row.departmentId || null,
              designationId: row.designationId || null,
              branchId: row.branchId || null,
              joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
              employmentType: row.employmentType || 'FULL_TIME',
              status: 'ACTIVE'
            }
          });

          return { user, emp };
        });

        results.push({
          row: index + 1,
          email: row.email,
          status: 'SUCCESS',
          employeeId: created.emp.id
        });
        successCount++;
      } catch (err) {
        results.push({
          row: index + 1,
          email: row.email || 'N/A',
          status: 'FAILED',
          error: err.message
        });
        failedCount++;
      }
    }

    return {
      total: rows.length,
      successful: successCount,
      failed: failedCount,
      results
    };
  },

  /**
   * Export Employees Data
   */
  async exportEmployees(companyId, filters = {}) {
    const where = { companyId };
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.designationId) where.designationId = filters.designationId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.status) where.status = filters.status;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const exportData = employees.map((e) => ({
      ID: e.id,
      Code: e.employeeCode,
      FirstName: e.firstName,
      LastName: e.lastName,
      Email: e.email,
      Phone: e.phone,
      Department: e.department?.name || 'N/A',
      Designation: e.designation?.name || 'N/A',
      Branch: e.branch?.name || 'N/A',
      JoiningDate: e.joiningDate ? e.joiningDate.toISOString().split('T')[0] : 'N/A',
      EmploymentType: e.employmentType,
      Status: e.status
    }));

    return {
      totalRows: exportData.length,
      downloadUrl: `https://storage.googleapis.com/ems-exports/employees_${Date.now()}.csv`,
      rows: exportData
    };
  },

  /**
   * Get Employee Stats
   */
  async getEmployeeStats(companyId) {
    const where = companyId ? { companyId } : {};
    try {
      const [total, active, inactive, departments, branches] = await Promise.all([
        prisma.employee.count({ where }),
        prisma.employee.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.employee.count({ where: { ...where, status: { not: 'ACTIVE' } } }),
        prisma.department.count({ where }),
        prisma.branch.count({ where })
      ]);

      return {
        companyId: companyId || 'ALL',
        total,
        active,
        inactive,
        departments,
        branches
      };
    } catch (err) {
      const total = await prisma.employee.count({ where }).catch(() => 0);
      return {
        companyId: companyId || 'ALL',
        total,
        active: total,
        inactive: 0,
        departments: 1,
        branches: 1
      };
    }
  },

  /**
   * Get Employee Analytics
   */
  async getEmployeeAnalytics(companyId, dateRange = {}) {
    const where = companyId ? { companyId } : {};
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

    const joiners = await prisma.employee.findMany({
      where: {
        ...where,
        joiningDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        joiningDate: true,
        employmentType: true,
        status: true
      }
    });

    const totalHeadcount = await prisma.employee.count({ where });

    return {
      companyId: companyId || 'ALL',
      dateRange: { startDate, endDate },
      totalHeadcount,
      totalNewJoiners: joiners.length,
      joiners
    };
  },

  /**
   * Update an employee's system role
   */
  async updateEmployeeRole(employeeId, { roleId, role: roleName }, reqUser) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true }
            }
          }
        }
      }
    });

    if (!employee || !employee.user) {
      const error = new Error('Employee user account not found');
      error.statusCode = 404;
      throw error;
    }

    const companyId = employee.companyId;
    let targetRole = null;

    if (roleId) {
      targetRole = await prisma.role.findFirst({
        where: {
          id: roleId,
          OR: [{ companyId: null }, { companyId }]
        }
      });
    } else if (roleName) {
      targetRole = await prisma.role.findFirst({
        where: {
          name: roleName,
          OR: [{ companyId: null }, { companyId }]
        }
      });
    }

    if (!targetRole) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    // Permission check
    const creatorRoles = Array.isArray(reqUser?.roles)
      ? reqUser.roles
      : [reqUser?.role || 'EMPLOYEE'];

    if (!checkRoleAssignmentPermission(creatorRoles, targetRole.name)) {
      const error = new Error(`You do not have permission to assign the ${targetRole.name} role.`);
      error.statusCode = 403;
      throw error;
    }

    // Transaction to update role and create audit log
    const updatedUserRole = await prisma.$transaction(async (tx) => {
      // Remove previous user roles
      await tx.userRole.deleteMany({
        where: { userId: employee.user.id }
      });

      // Add new role
      const newUserRole = await tx.userRole.create({
        data: {
          userId: employee.user.id,
          roleId: targetRole.id
        },
        include: { role: true }
      });

      // Audit Log
      let auditUserId = employee.user.id;
      if (reqUser?.id) {
        const creatorExists = await tx.user.findUnique({ where: { id: reqUser.id } });
        if (creatorExists) auditUserId = reqUser.id;
      }

      await tx.auditLog.create({
        data: {
          userId: auditUserId,
          action: 'UPDATE_EMPLOYEE_ROLE',
          entity: 'UserRole',
          entityId: newUserRole.id,
          oldValues: {
            roles: employee.user.userRoles.map((ur) => ur.role.name)
          },
          newValues: {
            role: targetRole.name,
            roleId: targetRole.id
          }
        }
      });

      return newUserRole;
    });

    return {
      employeeId: employee.id,
      userId: employee.user.id,
      role: targetRole,
      userRole: updatedUserRole
    };
  }
};

export default employeesService;
