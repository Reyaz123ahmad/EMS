import { prisma } from '../../config/prisma.js';

export const overtimeService = {
  /**
   * Overtime Rules CRUD
   */
  async getOvertimeRules(arg1) {
    const companyId = typeof arg1 === 'object' && arg1 !== null ? arg1.companyId : arg1;
    if (!companyId) return { rules: [], total: 0 };

    const rules = await prisma.overtimeRule.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      rules,
      total: rules.length
    };
  },

  async listRules(companyId) {
    if (typeof companyId === 'object' && companyId !== null) {
      return this.getOvertimeRules(companyId);
    }
    const res = await this.getOvertimeRules({ companyId });
    return res.rules;
  },

  async createOvertimeRule(arg1, arg2) {
    let companyId, data, createdBy;
    if (typeof arg1 === 'object' && arg1 !== null && arg1.companyId) {
      companyId = arg1.companyId;
      data = arg1.data || arg1;
      createdBy = arg1.createdBy;
    } else {
      companyId = arg1;
      data = arg2 || {};
    }

    const rule = await prisma.overtimeRule.create({
      data: {
        companyId,
        name: data.name,
        multiplier: parseFloat(data.multiplier) || 1.5,
        minMinutes: parseInt(data.minMinutes, 10) || 30,
        maxMinutesPerDay: parseInt(data.maxMinutesPerDay || data.maxDailyMinutes, 10) || 240,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return rule;
  },

  async createRule(companyId, data) {
    return this.createOvertimeRule(companyId, data);
  },

  async updateRule(id, data) {
    return prisma.overtimeRule.update({
      where: { id },
      data: {
        ...data,
        multiplier: data.multiplier !== undefined ? parseFloat(data.multiplier) : undefined,
        minMinutes: data.minMinutes !== undefined ? parseInt(data.minMinutes, 10) : undefined,
        maxMinutesPerDay: (data.maxMinutesPerDay || data.maxDailyMinutes) !== undefined
          ? parseInt(data.maxMinutesPerDay || data.maxDailyMinutes, 10)
          : undefined
      }
    });
  },

  async deleteOvertimeRule(id) {
    return prisma.overtimeRule.delete({
      where: { id }
    });
  },

  async deleteRule(id) {
    return this.deleteOvertimeRule(id);
  },

  /**
   * Overtime Records
   */
  async listOvertimeRecords(arg1, arg2, arg3) {
    let companyId, filters = {}, pagination = { page: 1, limit: 20 };

    if (typeof arg1 === 'object' && arg1 !== null && arg1.companyId) {
      companyId = arg1.companyId;
      filters = arg1.filters || {};
      pagination = {
        page: parseInt(arg1.pagination?.page, 10) || 1,
        limit: parseInt(arg1.pagination?.limit, 10) || 20
      };
    } else {
      companyId = arg1;
      filters = arg2 || {};
      if (arg3) {
        pagination = {
          page: parseInt(arg3.page, 10) || 1,
          limit: parseInt(arg3.limit, 10) || 20
        };
      }
    }

    console.log('=== LIST OVERTIME RECORDS ===');
    console.log('Company ID:', companyId);

    if (!companyId) {
      return {
        records: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };
    }

    const where = {
      employee: { companyId }
    };

    if (filters.employeeIds && Array.isArray(filters.employeeIds)) {
      where.employeeId = { in: filters.employeeIds };
    } else if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.departmentId) {
      where.employee.departmentId = filters.departmentId;
    }
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [records, total] = await Promise.all([
      prisma.overtimeRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.overtimeRequest.count({ where })
    ]);

    console.log('Records found:', records.length);

    // Clean records for frontend
    const cleanRecords = records.map(r => ({
      id: r.id,
      employee: r.employee,
      employeeId: r.employeeId,
      date: r.date,
      minutes: r.requestedMinutes || 0,
      requestedMinutes: r.requestedMinutes || 0,
      duration: parseFloat(((r.requestedMinutes || 0) / 60).toFixed(2)),
      multiplier: 1.5,
      status: r.status,
      reason: r.reason,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      createdAt: r.createdAt
    }));

    return {
      records: cleanRecords,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  },

  async listRecords(companyId, filters = {}) {
    if (typeof companyId === 'object' && companyId !== null && companyId.companyId) {
      const res = await this.listOvertimeRecords(companyId);
      return res.records;
    }
    const res = await this.listOvertimeRecords(companyId, filters);
    return res.records;
  },

  /**
   * Calculate Overtime (Rule multiplier calculation)
   */
  async calculateOvertime({ employeeId, date, minutes }) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true }
    });
    if (!employee) throw new Error('Employee not found');

    const rule = await prisma.overtimeRule.findFirst({
      where: { companyId: employee.companyId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    const multiplier = rule ? Number(rule.multiplier) : 1.5;
    const minMins = rule ? rule.minMinutes : 30;

    const applicableMinutes = minutes >= minMins ? minutes : 0;
    const overtimeHours = parseFloat((applicableMinutes / 60).toFixed(2));
    const effectivePayableHours = parseFloat((overtimeHours * multiplier).toFixed(2));

    return {
      employeeId,
      date,
      actualMinutes: minutes,
      applicableMinutes,
      multiplier,
      overtimeHours,
      effectivePayableHours
    };
  },

  /**
   * Overtime Requests (Apply, List, Approve, Reject, Bulk)
   */
  async applyOvertime(arg1) {
    let userId, companyId, data, employeeId;
    if (typeof arg1 === 'object' && arg1 !== null) {
      userId = arg1.userId;
      companyId = arg1.companyId;
      data = arg1.data || arg1;
      employeeId = arg1.employeeId || data.employeeId;
    }

    console.log('=== APPLY OVERTIME ===');
    console.log('User ID:', userId);
    console.log('Company ID:', companyId);

    // 1. Find employee by employeeId (if valid) or by userId
    let employee = null;
    if (employeeId) {
      employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });
    }

    if (!employee && userId) {
      employee = await prisma.employee.findUnique({
        where: { userId }
      });
    }

    // 2. If not found, try finding by user's email or user relation
    if (!employee && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true }
      });

      if (user?.employee) {
        employee = user.employee;
      } else if (user?.email) {
        employee = await prisma.employee.findFirst({
          where: { email: user.email }
        });
      }
    }

    // 3. If still not found, auto-create employee record
    if (!employee) {
      console.log('Employee not found, auto-creating...');
      
      const user = userId ? await prisma.user.findUnique({
        where: { id: userId }
      }) : null;

      const targetCompanyId = user?.companyId || companyId;

      if (!user || !targetCompanyId) {
        const error = new Error('User not found or not linked to company');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      // Generate employee code
      const count = await prisma.employee.count({
        where: { companyId: targetCompanyId }
      });
      const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;

      const nameParts = (user.email.split('@')[0] || 'User').split('.');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts[1] || '';

      employee = await prisma.employee.create({
        data: {
          companyId: targetCompanyId,
          userId: user.id,
          employeeCode,
          firstName,
          lastName,
          email: user.email,
          phone: user.phone || null,
          joiningDate: new Date(),
          employmentType: 'FULL_TIME',
          status: 'ACTIVE'
        }
      });

      console.log('Employee auto-created:', employee.employeeCode);
    }

    console.log('Employee found:', employee.firstName, employee.lastName);

    // 4. Validate date
    const overtimeDate = new Date(data.date);
    if (isNaN(overtimeDate.getTime())) {
      const error = new Error('Invalid date provided');
      error.statusCode = 400;
      throw error;
    }

    // 5. Check if already applied for this date
    const existing = await prisma.overtimeRequest.findFirst({
      where: {
        employeeId: employee.id,
        date: overtimeDate,
        status: 'PENDING'
      }
    });

    if (existing) {
      const error = new Error('Overtime request already pending for this date');
      error.statusCode = 400;
      error.code = 'ALREADY_PENDING';
      throw error;
    }

    const requestedMinutes = parseInt(data.requestedMinutes || data.minutes || 60, 10);

    // 6. Create overtime request
    const request = await prisma.overtimeRequest.create({
      data: {
        employeeId: employee.id,
        date: overtimeDate,
        requestedMinutes: isNaN(requestedMinutes) ? 60 : requestedMinutes,
        reason: data.reason || null,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        }
      }
    });

    // 7. Audit log
    if (userId) {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CREATE',
            entity: 'OvertimeRequest',
            entityId: request.id,
            newValues: {
              date: data.date,
              requestedMinutes
            }
          }
        });
      } catch (e) {
        // ignore audit log error if any
      }
    }

    console.log('Overtime request created:', request.id);

    return request;
  },

  async listRequests(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return prisma.overtimeRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async approveOvertime({ requestId, companyId, approvedBy }) {
    console.log('=== APPROVE OVERTIME ===');
    console.log('Request ID:', requestId);
    console.log('Company ID:', companyId);

    const request = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });

    if (!request) {
      const error = new Error('Overtime request not found');
      error.statusCode = 404;
      error.code = 'REQUEST_NOT_FOUND';
      throw error;
    }

    if (companyId && request.employee.companyId !== companyId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error = new Error(`Request already ${request.status.toLowerCase()}`);
      error.statusCode = 400;
      error.code = 'ALREADY_PROCESSED';
      throw error;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const approvedReq = await tx.overtimeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: approvedBy || 'ADMIN',
          approvedAt: new Date()
        }
      });

      const rule = await tx.overtimeRule.findFirst({
        where: { companyId: request.employee.companyId, isActive: true }
      });
      const multiplier = rule ? rule.multiplier : 1.5;

      await tx.overtimeRecord.create({
        data: {
          employeeId: request.employeeId,
          date: request.date,
          minutes: request.requestedMinutes,
          multiplier,
          status: 'APPROVED',
          approvedBy: approvedBy || 'ADMIN',
          approvedAt: new Date()
        }
      });

      return approvedReq;
    });

    if (approvedBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: approvedBy,
            action: 'APPROVE',
            entity: 'OvertimeRequest',
            entityId: requestId,
            newValues: { status: 'APPROVED' }
          }
        });
      } catch (e) {
        // ignore audit log error if any
      }
    }

    return updated;
  },

  async approveRequest(arg1, arg2) {
    let requestId, companyId, approvedBy;
    if (typeof arg1 === 'object' && arg1 !== null) {
      requestId = arg1.requestId || arg1.id;
      companyId = arg1.companyId;
      approvedBy = arg1.approvedBy;
    } else {
      requestId = arg1;
      approvedBy = arg2;
    }
    return this.approveOvertime({ requestId, companyId, approvedBy });
  },

  async rejectOvertime({ requestId, companyId, rejectedBy, reason }) {
    console.log('=== REJECT OVERTIME ===');
    console.log('Request ID:', requestId);
    console.log('Company ID:', companyId);

    // 1. Find the request
    const request = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            companyId: true
          }
        }
      }
    });

    if (!request) {
      console.log('Request not found:', requestId);
      const error = new Error('Overtime request not found');
      error.statusCode = 404;
      error.code = 'REQUEST_NOT_FOUND';
      throw error;
    }

    // 2. Check company
    if (companyId && request.employee.companyId !== companyId) {
      const error = new Error('Unauthorized to reject this request');
      error.statusCode = 403;
      throw error;
    }

    // 3. Check status
    if (request.status !== 'PENDING') {
      const error = new Error(`Request already ${request.status.toLowerCase()}`);
      error.statusCode = 400;
      error.code = 'ALREADY_PROCESSED';
      throw error;
    }

    // 4. Update status
    const updated = await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy || 'ADMIN',
        approvedAt: new Date()
      }
    });

    // 5. Audit log
    if (rejectedBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: rejectedBy,
            action: 'REJECT',
            entity: 'OvertimeRequest',
            entityId: requestId,
            newValues: { status: 'REJECTED', reason }
          }
        });
      } catch (e) {
        // ignore audit log error if any
      }
    }

    console.log('Overtime rejected successfully');
    return updated;
  },

  async rejectRequest(arg1, arg2) {
    let requestId, companyId, rejectedBy, reason;
    if (typeof arg1 === 'object' && arg1 !== null) {
      requestId = arg1.requestId || arg1.id;
      companyId = arg1.companyId;
      rejectedBy = arg1.rejectedBy || arg1.approvedBy;
      reason = arg1.reason;
    } else {
      requestId = arg1;
      reason = arg2;
    }
    return this.rejectOvertime({ requestId, companyId, rejectedBy, reason });
  },

  async bulkApproveOvertime({ requestIds = [], approvedBy }) {
    const results = [];
    for (const id of requestIds) {
      try {
        const res = await this.approveRequest({ requestId: id, approvedBy });
        results.push({ id, status: 'SUCCESS', request: res });
      } catch (err) {
        results.push({ id, status: 'FAILED', error: err.message });
      }
    }
    return {
      total: requestIds.length,
      successCount: results.filter((r) => r.status === 'SUCCESS').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      results
    };
  },

  /**
   * Overtime Stats
   */
  async getOvertimeStats(arg1) {
    const companyId = typeof arg1 === 'object' && arg1 !== null ? arg1.companyId : arg1;

    console.log('=== OVERTIME STATS ===');
    console.log('Company ID:', companyId);

    if (!companyId) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        approvedMinutes: 0,
        approvedHours: 0,
        totalApprovedHours: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        estimatedCost: 0,
        totalCost: 0,
        totalRequests: 0
      };
    }

    // Get all overtime requests for this company
    const allRequests = await prisma.overtimeRequest.findMany({
      where: {
        employee: { companyId }
      },
      include: {
        employee: {
          select: {
            salaryStructure: {
              select: { ctc: true }
            }
          }
        }
      }
    });

    console.log('Total requests:', allRequests.length);

    // Calculate stats
    const totalMinutes = allRequests.reduce(
      (sum, r) => sum + (r.requestedMinutes || 0), 
      0
    );

    const approvedRequests = allRequests.filter(r => r.status === 'APPROVED');
    const approvedMinutes = approvedRequests.reduce(
      (sum, r) => sum + (r.requestedMinutes || 0), 
      0
    );

    const pendingCount = allRequests.filter(r => r.status === 'PENDING').length;
    const approvedCount = approvedRequests.length;
    const rejectedCount = allRequests.filter(r => r.status === 'REJECTED').length;

    // Estimated cost: (minutes / 60) * avg_hourly_rate * multiplier
    let estimatedCost = 0;
    for (const req of approvedRequests) {
      const ctc = Number(req.employee?.salaryStructure?.ctc || 0);
      const hourlyRate = ctc > 0 ? ctc / 12 / 22 / 8 : 100; // Default ₹100/hr
      const hours = (req.requestedMinutes || 0) / 60;
      estimatedCost += hours * hourlyRate * 1.5;
    }

    const stats = {
      totalMinutes,
      totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
      approvedMinutes,
      approvedHours: parseFloat((approvedMinutes / 60).toFixed(2)),
      totalApprovedHours: parseFloat((approvedMinutes / 60).toFixed(2)),
      pendingCount,
      approvedCount,
      rejectedCount,
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      totalCost: parseFloat(estimatedCost.toFixed(2)),
      totalRequests: allRequests.length
    };

    console.log('Stats:', stats);
    return stats;
  },

  /**
   * Overtime Report
   */
  async getOvertimeReport(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.departmentId) where.employee.departmentId = filters.departmentId;

    const records = await prisma.overtimeRecord.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return {
      total: records.length,
      records
    };
  }
};

export default overtimeService;
