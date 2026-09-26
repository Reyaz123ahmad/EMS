import crypto from 'crypto';
import companiesRepository from './companies.repository.js';
import authRepository from '../auth/auth.repository.js';
import { hashPassword } from '../../security/password.js';
import { addOTPEmail, addCredentialsEmail } from '../../queues/email.queue.js';
import { COMPANY_SETTINGS_DEFAULTS, DEFAULT_TRIAL_DAYS } from './companies.constants.js';
import { generateCompanyCode, generateBranchCode, generateDepartmentCode, generateEmployeeCode } from '../../utils/id-generator.js';
import prisma from '../../config/prisma.js';

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

export const companiesService = {
  /**
   * Step 1: Send OTP to prospective company admin email
   */
  async sendCompanyOTP({ companyData, adminData, planId }) {
    const existingUser = await authRepository.findUserByEmail(adminData.email);
    if (existingUser) {
      throw new Error(`An account with email ${adminData.email} is already registered.`);
    }

    if (companyData.domain) {
      const existingCompany = await companiesRepository.findCompanyByDomain(companyData.domain);
      if (existingCompany) {
        throw new Error(`Company domain ${companyData.domain} is already in use.`);
      }
    }

    const sessionId = crypto.randomUUID();
    const otp = crypto.randomInt(100000, 999999).toString();

    const sessionPayload = {
      sessionId,
      otp,
      attempts: 0,
      verified: false,
      companyData,
      adminData,
      planId: planId || companyData?.planId || null,
      createdAt: Date.now()
    };

    // Store in Redis for 15 minutes
    await authRepository.storeOTP(
      `session:${sessionId}`,
      JSON.stringify(sessionPayload),
      'COMPANY_ADMIN_CREATE',
      15
    );

    // Queue OTP email
    try {
      await addOTPEmail({
        to: adminData.email,
        name: `${adminData.firstName} ${adminData.lastName}`,
        otp,
        purpose: 'COMPANY_ADMIN_CREATE',
        expiryMinutes: 15,
        companyName: companyData.name
      });
    } catch (emailErr) {
      console.warn('[companies.service] Could not queue OTP email:', emailErr.message);
    }

    return {
      sessionId,
      message: `Verification code sent to ${adminData.email}`
    };
  },

  /**
   * Step 2: Verify OTP
   */
  async verifyCompanyOTP({ email, otp, sessionId }) {
    const rawData = await authRepository.getOTP(`session:${sessionId}`, 'COMPANY_ADMIN_CREATE');
    if (!rawData) {
      throw new Error('Verification session has expired or does not exist. Please request a new code.');
    }

    const session = parseSessionData(rawData);
    if (!session || !session.adminData) {
      throw new Error('Invalid verification session format. Please request a new code.');
    }

    if (session.adminData.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Email does not match this verification session.');
    }

    if (session.attempts >= 5) {
      throw new Error('Maximum verification attempts exceeded. Please restart registration.');
    }

    if (session.otp !== String(otp).trim()) {
      session.attempts += 1;
      await authRepository.storeOTP(
        `session:${sessionId}`,
        JSON.stringify(session),
        'COMPANY_ADMIN_CREATE',
        15
      );
      throw new Error(`Invalid verification code. ${5 - session.attempts} attempts remaining.`);
    }

    session.verified = true;
    await authRepository.storeOTP(
      `session:${sessionId}`,
      JSON.stringify(session),
      'COMPANY_ADMIN_CREATE',
      30
    );

    return {
      verified: true,
      sessionId,
      message: 'Email successfully verified. You may now complete registration.'
    };
  },

  /**
   * Step 3: Complete Company Creation & Admin Provisioning
   */
  async createCompanyWithAdmin({ sessionId, companyData, adminData, planId }) {
    const rawData = await authRepository.getOTP(`session:${sessionId}`, 'COMPANY_ADMIN_CREATE');
    if (!rawData) {
      throw new Error('Verification session expired. Please verify OTP again.');
    }

    const session = parseSessionData(rawData);
    if (!session || !session.verified) {
      throw new Error('Please verify OTP code before creating company.');
    }

    // Resolve subscription plan
    const selectedPlanId = planId || companyData?.planId || session?.planId;
    let plan = null;
    if (selectedPlanId) {
      plan = await companiesRepository.findPlanById(selectedPlanId);
    }
    if (!plan) {
      plan = await companiesRepository.findDefaultPlan();
    }

    // Generate random temporary password
    const temporaryPassword = `Temp@${crypto.randomBytes(4).toString('hex')}!`;
    const passwordHash = await hashPassword(temporaryPassword);

    const isTrial = plan?.name?.toUpperCase() === 'TRIAL';
    const initialStatus = isTrial ? 'TRIAL' : 'ACTIVE';
    const trialDurationDays = isTrial ? DEFAULT_TRIAL_DAYS : 365;
    const subscriptionEndDate = new Date(Date.now() + trialDurationDays * 86400000);

    // Generate company code
    const companyCode = await generateCompanyCode();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company with default JSON settings
      const company = await tx.company.create({
        data: {
          name: companyData.name,
          companyCode,
          domain: companyData.domain || null,
          email: companyData.email || adminData.email,
          phone: companyData.phone || adminData.phone || null,
          address: companyData.address || null,
          status: initialStatus,
          attendanceSettings: COMPANY_SETTINGS_DEFAULTS.attendanceSettings,
          securitySettings: COMPANY_SETTINGS_DEFAULTS.securitySettings,
          leaveSettings: COMPANY_SETTINGS_DEFAULTS.leaveSettings,
          payrollSettings: COMPANY_SETTINGS_DEFAULTS.payrollSettings,
          notificationSettings: COMPANY_SETTINGS_DEFAULTS.notificationSettings,
          generalSettings: COMPANY_SETTINGS_DEFAULTS.generalSettings
        }
      });

      // 2. Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          status: initialStatus,
          trialEndsAt: isTrial ? subscriptionEndDate : null,
          startDate: new Date(),
          endDate: subscriptionEndDate,
          autoRenew: true
        }
      });

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: adminData.email,
          phone: adminData.phone || null,
          passwordHash,
          status: 'ACTIVE',
          twoFactorEnabled: false
        }
      });

      // 4. Assign COMPANY_ADMIN role
      const companyAdminRole = await tx.role.findFirst({
        where: { name: 'COMPANY_ADMIN', companyId: null }
      });

      if (companyAdminRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: companyAdminRole.id
          }
        });
      }

      // 5. Create default Branch
      const branchCode = `${company.companyCode || 'COMP'}-BR-0001`;
      const mainBranch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: 'Headquarters',
          code: 'HQ-01',
          branchCode,
          city: 'Main Branch',
          country: 'India',
          isGeofenceActive: true,
          geofenceRadius: 100
        }
      });

      // 6. Create default Department
      const departmentCode = `${company.companyCode || 'COMP'}-DEPT-0001`;
      const mainDept = await tx.department.create({
        data: {
          companyId: company.id,
          name: 'Administration',
          code: 'ADM',
          departmentCode
        }
      });

      // 7. Create Employee profile for Admin
      const employeeCode = `${company.companyCode || 'COMP'}-EMP-0001`;
      const employee = await tx.employee.create({
        data: {
          companyId: company.id,
          userId: user.id,
          employeeCode,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          phone: adminData.phone || null,
          branchId: mainBranch.id,
          departmentId: mainDept.id,
          joiningDate: new Date(),
          employmentType: 'FULL_TIME',
          status: 'ACTIVE'
        }
      });

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_COMPANY',
          entity: 'Company',
          entityId: company.id,
          newValues: {
            companyName: company.name,
            adminEmail: user.email,
            plan: plan.name
          }
        }
      });

      return { company, user, employee, subscription };
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    // Cleanup session
    await authRepository.deleteOTP(`session:${sessionId}`, 'COMPANY_ADMIN_CREATE');

    // Queue credentials email
    try {
      await addCredentialsEmail({
        to: adminData.email,
        name: `${adminData.firstName} ${adminData.lastName}`,
        email: adminData.email,
        password: temporaryPassword,
        role: 'COMPANY_ADMIN',
        companyName: companyData.name,
        employeeCode: 'EMP001',
        department: 'Administration',
        loginUrl: 'http://localhost:3000/login'
      });
    } catch (emailErr) {
      console.warn('[companies.service] Could not queue credentials email:', emailErr.message);
    }

    return {
      company: result.company,
      admin: {
        id: result.user.id,
        email: result.user.email,
        name: `${adminData.firstName} ${adminData.lastName}`
      },
      message: 'Company and Administrator account provisioned successfully.'
    };
  },

  /**
   * Fetch company structured settings
   */
  async getCompanySettings(companyId) {
    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) throw new Error('Company not found');

    return {
      attendanceSettings: company.attendanceSettings,
      securitySettings: company.securitySettings,
      leaveSettings: company.leaveSettings,
      payrollSettings: company.payrollSettings,
      notificationSettings: company.notificationSettings,
      generalSettings: company.generalSettings
    };
  },

  /**
   * Update specific structured settings tab
   */
  async updateCompanySettings(companyId, settingsType, settingsData) {
    const fieldMap = {
      attendance: 'attendanceSettings',
      security: 'securitySettings',
      leave: 'leaveSettings',
      payroll: 'payrollSettings',
      notifications: 'notificationSettings',
      general: 'generalSettings'
    };

    const field = fieldMap[settingsType];
    if (!field) throw new Error(`Invalid settings type: ${settingsType}`);

    const updated = await companiesRepository.updateCompanySettings(companyId, field, settingsData);
    return updated;
  },

  /**
   * Get company dashboard metrics
   */
  async getCompanyDashboard(companyId) {
    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) throw new Error('Company not found');

    const totalEmployees = await prisma.employee.count({ where: { companyId } });
    const activeEmployees = await prisma.employee.count({ where: { companyId, status: 'ACTIVE' } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await prisma.attendanceLog.count({
      where: {
        companyId,
        attendanceDate: today,
        status: 'PRESENT'
      }
    });

    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: 'PENDING'
      }
    });

    return {
      company,
      metrics: {
        totalEmployees,
        activeEmployees,
        todayAttendance,
        pendingLeaves
      }
    };
  },

  /**
   * List companies with search and filters
   */
  async listCompanies(filters, pagination) {
    return companiesRepository.findAllCompanies(filters, pagination);
  },

  /**
   * Get single company by ID
   */
  async getCompanyById(id) {
    const company = await companiesRepository.findCompanyById(id);
    if (!company) throw new Error('Company not found');
    return company;
  },

  /**
   * Get company stats
   */
  async getCompanyStats(companyId) {
    if (!companyId) {
      const [totalCompanies, activeCompanies, totalEmployees] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { status: 'ACTIVE' } }),
        prisma.employee.count()
      ]);
      return {
        totalCompanies,
        activeCompanies,
        totalEmployees
      };
    }

    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) {
      return {
        companyId,
        companyName: 'N/A',
        status: 'ACTIVE',
        stats: { totalEmployees: 0, activeEmployees: 0, presentToday: 0 }
      };
    }

    const totalEmployees = await prisma.employee.count({ where: { companyId } });
    const activeEmployees = await prisma.employee.count({ where: { companyId, status: 'ACTIVE' } });
    const departmentCount = await prisma.department.count({ where: { companyId } });
    const branchCount = await prisma.branch.count({ where: { companyId } });
    const deviceCount = await prisma.biometricDevice.count({ where: { companyId } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [presentCount, lateCount, leaveCount] = await Promise.all([
      prisma.attendanceLog.count({
        where: { companyId, attendanceDate: today, status: 'PRESENT' }
      }),
      prisma.attendanceLog.count({
        where: { companyId, attendanceDate: today, status: 'LATE' }
      }),
      prisma.leaveRequest.count({
        where: { employee: { companyId }, status: 'APPROVED', startDate: { lte: today }, endDate: { gte: today } }
      })
    ]);

    const absentCount = Math.max(0, activeEmployees - presentCount - lateCount - leaveCount);

    return {
      companyId,
      companyName: company.name,
      status: company.status,
      subscription: company.subscription,
      stats: {
        totalEmployees,
        activeEmployees,
        presentToday: presentCount + lateCount,
        onTimeToday: presentCount,
        lateToday: lateCount,
        absentToday: absentCount,
        onLeaveToday: leaveCount,
        departmentCount,
        branchCount,
        deviceCount
      }
    };
  },

  /**
   * Get company analytics across date range
   */
  async getCompanyAnalytics(companyId, dateRange = {}) {
    if (!companyId) {
      const [totalCompanies, totalEmployees] = await Promise.all([
        prisma.company.count(),
        prisma.employee.count()
      ]);
      return {
        totalCompanies,
        totalEmployees,
        growth: '+14.2%'
      };
    }

    const company = await companiesRepository.findCompanyById(companyId);
    if (!company) {
      return {
        companyId,
        totalLogs: 0,
        departmentDistribution: []
      };
    }

    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: {
        companyId,
        attendanceDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        attendanceDate: true,
        status: true
      }
    });

    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    return {
      companyId,
      dateRange: { startDate, endDate },
      totalLogs: attendanceLogs.length,
      departmentDistribution: departments.map((d) => ({
        id: d.id,
        name: d.name,
        employeeCount: d._count.employees
      }))
    };
  },

  /**
   * Get company by ID
   */
  async getCompanyById(id) {
    const company = await companiesRepository.findCompanyById(id);
    if (!company) {
      const err = new Error('Company not found');
      err.statusCode = 404;
      throw err;
    }
    return company;
  },

  /**
   * List all companies
   */
  async listCompanies(filters = {}, pagination = { page: 1, limit: 10 }) {
    return companiesRepository.findAllCompanies(filters, pagination);
  },

  /**
   * Update company details
   */
  async updateCompany(id, data) {
    return companiesRepository.updateCompany(id, data);
  },

  /**
   * Activate company
   */
  async activateCompany(id) {
    const company = await companiesRepository.findCompanyById(id);
    if (!company) {
      const err = new Error('Company not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.update({
        where: { id },
        data: { status: 'ACTIVE' }
      });
      await tx.subscription.updateMany({
        where: { companyId: id },
        data: { status: 'ACTIVE' }
      });
      await tx.user.updateMany({
        where: { companyId: id },
        data: { status: 'ACTIVE' }
      });
      return comp;
    });
    return updated;
  },

  /**
   * Deactivate company
   */
  async deactivateCompany(id) {
    const company = await companiesRepository.findCompanyById(id);
    if (!company) {
      const err = new Error('Company not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.update({
        where: { id },
        data: { status: 'EXPIRED' }
      });
      await tx.subscription.updateMany({
        where: { companyId: id },
        data: { status: 'EXPIRED' }
      });
      return comp;
    });
    return updated;
  },

  /**
   * Suspend company
   */
  async suspendCompany(id) {
    const company = await companiesRepository.findCompanyById(id);
    if (!company) {
      const err = new Error('Company not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.update({
        where: { id },
        data: { status: 'SUSPENDED' }
      });
      await tx.subscription.updateMany({
        where: { companyId: id },
        data: { status: 'CANCELLED' }
      });
      return comp;
    });
    return updated;
  },

  /**
   * Delete company
   */
  async deleteCompany(id) {
    const company = await companiesRepository.findCompanyById(id);
    if (!company) {
      const err = new Error('Company not found');
      err.statusCode = 404;
      throw err;
    }
    return companiesRepository.deleteCompany(id);
  }
};

export default companiesService;
