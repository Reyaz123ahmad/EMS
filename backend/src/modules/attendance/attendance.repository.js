import { prisma } from '../../config/prisma.js';

if (!global._todayAttendanceCache) global._todayAttendanceCache = new Map();

export const attendanceRepository = {
  /**
   * Find today's attendance log for an employee (with fast in-memory caching)
   */
  async findTodayAttendance(employeeId, date = new Date()) {
    if (!employeeId) return null;
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const cacheKey = `${employeeId}_${startOfDay.toISOString().split('T')[0]}`;
    
    const cached = global._todayAttendanceCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const data = await prisma.attendanceLog.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate: startOfDay
        }
      },
      include: {
        breaks: {
          orderBy: { breakStartAt: 'asc' }
        }
      }
    });

    global._todayAttendanceCache.set(cacheKey, { data, expiresAt: Date.now() + 60000 });
    return data;
  },

  /**
   * Find attendance log by date
   */
  async findAttendanceByDate(employeeId, date) {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    return prisma.attendanceLog.findFirst({
      where: {
        employeeId,
        attendanceDate: targetDate
      },
      include: {
        breaks: true
      }
    });
  },

  /**
   * Create an attendance check-in record
   */
  async createAttendanceLog(data) {
    const targetDate = new Date(data.attendanceDate || new Date());
    targetDate.setUTCHours(0, 0, 0, 0);
    const cacheKey = `${data.employeeId}_${targetDate.toISOString().split('T')[0]}`;
    global._todayAttendanceCache.delete(cacheKey);

    const logData = {
      companyId: data.companyId,
      employeeId: data.employeeId,
      attendanceDate: targetDate,
      checkInAt: data.checkInAt || new Date(),
      checkInPhotoUrl: data.checkInPhotoUrl || null,
      attendanceMethod: data.attendanceMethod || 'FACE',
      faceMatchScore: data.faceMatchScore ? String(data.faceMatchScore) : null,
      livenessScore: data.livenessScore ? String(data.livenessScore) : null,
      verificationLayers: data.verificationLayers || {},
      checkInLatitude: data.checkInLatitude !== undefined ? data.checkInLatitude : null,
      checkInLongitude: data.checkInLongitude !== undefined ? data.checkInLongitude : null,
      checkInAccuracy: data.checkInAccuracy !== undefined ? data.checkInAccuracy : null,
      checkInDistance: data.checkInDistance !== undefined ? data.checkInDistance : null,
      checkInBranchId: data.checkInBranchId || null,
      cardNumber: data.cardNumber || null,
      deviceId: data.deviceId || null,
      isMockLocation: data.isMockLocation || false,
      isVpnDetected: data.isVpnDetected || false,
      isDeviceTrusted: data.isDeviceTrusted !== undefined ? data.isDeviceTrusted : true,
      ipAddress: data.ipAddress || null,
      lateMinutes: data.lateMinutes || 0,
      isLate: data.isLate || (data.lateMinutes > 0),
      adjustedCheckOutTime: data.adjustedCheckOutTime || null,
      isHoliday: data.isHoliday || false,
      holidayName: data.holidayName || null,
      holidayType: data.holidayType || null,
      shiftId: data.shiftId || null,
      shiftName: data.shiftName || null,
      shiftStartTime: data.shiftStartTime || null,
      shiftEndTime: data.shiftEndTime || null,
      shiftSource: data.shiftSource || null,
      expectedStart: data.expectedStart || null,
      expectedEnd: data.expectedEnd || null,
      isRosterOverride: Boolean(data.isRosterOverride),
      requiredMinutes: data.requiredMinutes || null,
      workedMinutes: data.workedMinutes !== undefined ? data.workedMinutes : data.actualMinutes || null,
      earlyExitMinutes: data.earlyExitMinutes || 0,
      actualMinutes: data.actualMinutes || null,
      shortfallMinutes: data.shortfallMinutes || null,
      totalBreaks: data.totalBreaks || 0,
      totalBreakMinutes: data.totalBreakMinutes || 0,
      remainingBreaks: data.remainingBreaks !== undefined ? data.remainingBreaks : null,
      remainingBreakMinutes: data.remainingBreakMinutes !== undefined ? data.remainingBreakMinutes : null,
      status: data.status || 'PRESENT',
      remarks: data.remarks || null
    };

    const res = await prisma.attendanceLog.upsert({
      where: {
        employeeId_attendanceDate: {
          employeeId: data.employeeId,
          attendanceDate: targetDate
        }
      },
      update: logData,
      create: logData
    });

    const fullResult = { ...res, breaks: [] };
    global._todayAttendanceCache.set(cacheKey, { data: fullResult, expiresAt: Date.now() + 60000 });
    return fullResult;
  },

  /**
   * Update attendance log (e.g. check-out, duration, status)
   */
  async updateAttendanceLog(id, data) {
    const res = await prisma.attendanceLog.update({
      where: { id },
      data
    });

    if (res.employeeId && res.attendanceDate) {
      const startOfDay = new Date(res.attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const cacheKey = `${res.employeeId}_${startOfDay.toISOString().split('T')[0]}`;
      const existing = global._todayAttendanceCache.get(cacheKey)?.data || {};
      const merged = { ...existing, ...res };
      global._todayAttendanceCache.set(cacheKey, { data: merged, expiresAt: Date.now() + 60000 });
    }

    return res;
  },

  /**
   * List attendance logs with multi-parameter filtering and pagination
   */
  async findAttendanceLogs(companyId, filters = {}, pagination = { page: 1, limit: 20 }) {
    const { employeeId, departmentId, branchId, status, startDate, endDate, search } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = { companyId };
    if (filters.employeeIds && Array.isArray(filters.employeeIds)) {
      where.employeeId = { in: filters.employeeIds };
    } else if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status && status !== 'ALL' && String(status).trim() !== '') {
      where.status = status;
    }

    if (departmentId || branchId || search) {
      where.employee = {};
      if (departmentId) where.employee.departmentId = departmentId;
      if (branchId) where.employee.branchId = branchId;
      if (search) {
        where.employee.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeCode: { contains: search, mode: 'insensitive' } }
        ];
      }
    }

    if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        const sDate = new Date(startDate);
        sDate.setUTCHours(0, 0, 0, 0);
        where.attendanceDate.gte = sDate;
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        const eDate = new Date(endDate);
        eDate.setUTCHours(23, 59, 59, 999);
        where.attendanceDate.lte = eDate;
      }
      if (Object.keys(where.attendanceDate).length === 0) {
        delete where.attendanceDate;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.attendanceLog.count({ where }),
      prisma.attendanceLog.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { id: true, name: true } },
              branch: { select: { id: true, name: true } },
              shiftAssignments: {
                where: {
                  OR: [
                    { effectiveTo: null },
                    { effectiveTo: { gte: new Date() } }
                  ]
                },
                select: {
                  shift: {
                    select: { id: true, name: true, startTime: true, endTime: true }
                  }
                },
                orderBy: { effectiveFrom: 'desc' },
                take: 1
              }
            }
          },
          breaks: true
        },
        orderBy: { attendanceDate: 'desc' },
        skip,
        take: limit
      })
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      currentShift: log.shiftId
        ? {
            id: log.shiftId,
            name: log.shiftName,
            startTime: log.shiftStartTime,
            endTime: log.shiftEndTime
          }
        : null,
      defaultShift: log.employee?.shiftAssignments?.[0]?.shift || null
    }));

    return {
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Create an attendance break record
   */
  async createAttendanceBreak(data) {
    if (data.employeeId) {
      const todayStr = new Date().toISOString().split('T')[0];
      global._todayAttendanceCache.delete(`${data.employeeId}_${todayStr}`);
    }
    return prisma.attendanceBreak.create({
      data: {
        attendanceLogId: data.attendanceLogId,
        employeeId: data.employeeId,
        breakStartAt: data.breakStartAt || new Date(),
        breakType: data.breakType || 'SHORT',
        breakPhotoUrl: data.breakPhotoUrl || data.breakStartPhotoUrl || null,
        breakStartPhotoUrl: data.breakStartPhotoUrl || data.breakPhotoUrl || null,
        breakLivenessScore: data.breakLivenessScore ? String(data.breakLivenessScore) : null,
        breakFaceMatchScore: data.breakFaceMatchScore ? String(data.breakFaceMatchScore) : null,
        expectedReturnTime: data.expectedReturnTime || null,
        actualReturnTime: data.actualReturnTime || null,
        lateReturnMinutes: data.lateReturnMinutes || 0,
        allowedDurationMinutes: data.allowedDurationMinutes || null,
        totalBreakMinutes: data.totalBreakMinutes || null
      }
    });
  },

  /**
   * Update break record upon completion
   */
  async updateAttendanceBreak(id, data) {
    const res = await prisma.attendanceBreak.update({
      where: { id },
      data
    });
    if (res.employeeId) {
      const todayStr = new Date().toISOString().split('T')[0];
      global._todayAttendanceCache.delete(`${res.employeeId}_${todayStr}`);
    }
    return res;
  },

  /**
   * Find today's breaks for an attendance log
   */
  async findTodayBreaks(attendanceLogId) {
    return prisma.attendanceBreak.findMany({
      where: { attendanceLogId },
      orderBy: { breakStartAt: 'asc' }
    });
  },

  /**
   * Find currently active ongoing break (breakEndAt is null)
   */
  async findActiveBreak(identifier) {
    return prisma.attendanceBreak.findFirst({
      where: {
        OR: [
          { attendanceLogId: identifier },
          { employeeId: identifier }
        ],
        breakEndAt: null
      }
    });
  },

  /**
   * Find employee with their branch and department
   */
  async findEmployeeWithBranch(employeeId) {
    if (!employeeId) return null;
    if (!global._empBranchCache) global._empBranchCache = new Map();
    if (!global._inFlightEmpBranchPromises) global._inFlightEmpBranchPromises = new Map();

    const cached = global._empBranchCache.get(employeeId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (global._inFlightEmpBranchPromises.has(employeeId)) {
      return global._inFlightEmpBranchPromises.get(employeeId);
    }

    const queryPromise = (async () => {
      try {
        const data = await prisma.employee.findFirst({
          where: {
            OR: [
              { id: employeeId },
              { userId: employeeId }
            ]
          },
          include: {
            branch: true,
            department: true,
            company: true
          }
        });

        if (data) {
          global._empBranchCache.set(employeeId, { data, expiresAt: Date.now() + 300000 });
          if (data.id !== employeeId) global._empBranchCache.set(data.id, { data, expiresAt: Date.now() + 300000 });
          if (data.userId && data.userId !== employeeId) global._empBranchCache.set(data.userId, { data, expiresAt: Date.now() + 300000 });
        }
        return data;
      } finally {
        global._inFlightEmpBranchPromises.delete(employeeId);
      }
    })();

    global._inFlightEmpBranchPromises.set(employeeId, queryPromise);
    return queryPromise;
  },

  /**
   * Find employee RFID/NFC cards
   */
  async findEmployeeCards(employeeId) {
    return prisma.employeeCard.findMany({
      where: { employeeId, isActive: true }
    });
  },

  /**
   * Find card by unique number within company (with 5-min caching)
   */
  async findCardByNumber(companyId, cardNumber) {
    if (!companyId || !cardNumber) return null;
    const cacheKey = `card:${companyId}:${cardNumber}`;
    if (!global._cardLookupCache) global._cardLookupCache = new Map();
    const cached = global._cardLookupCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const data = await prisma.employeeCard.findFirst({
      where: { companyId, cardNumber, isActive: true },
      select: {
        id: true,
        cardNumber: true,
        employeeId: true,
        isActive: true
      }
    });

    if (data) {
      global._cardLookupCache.set(cacheKey, { data, expiresAt: Date.now() + 300000 });
    }
    return data;
  },

  /**
   * Generate monthly attendance summary
   */
  async getMonthlySummary(companyId, month, year, filters = {}) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const where = {
      companyId,
      attendanceDate: {
        gte: startDate,
        lte: endDate
      }
    };

    if (filters.employeeIds && Array.isArray(filters.employeeIds)) {
      where.employeeId = { in: filters.employeeIds };
    } else if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.departmentId) where.employee = { departmentId: filters.departmentId };
    if (filters.branchId) {
      where.employee = { ...(where.employee || {}), branchId: filters.branchId };
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } }
          }
        },
        breaks: true
      },
      orderBy: { attendanceDate: 'asc' }
    });

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalHalfDay = 0;
    let totalWorkedMinutes = 0;
    let totalOvertimeMinutes = 0;

    logs.forEach((log) => {
      if (log.status === 'PRESENT') totalPresent += 1;
      else if (log.status === 'ABSENT') totalAbsent += 1;
      else if (log.status === 'LATE') totalLate += 1;
      else if (log.status === 'HALF_DAY') totalHalfDay += 1;

      totalWorkedMinutes += log.totalWorkedMinutes || 0;
      totalOvertimeMinutes += log.overtimeMinutes || 0;
    });

    return {
      month,
      year,
      totalLogs: logs.length,
      metrics: {
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        halfDay: totalHalfDay,
        totalHoursWorked: Math.round((totalWorkedMinutes / 60) * 10) / 10,
        totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10
      },
      logs
    };
  },

  /**
   * Daily attendance stats for company dashboard
   */
  async getAttendanceStats(companyId, date = new Date()) {
    const targetDate = new Date(date);
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);

    const [totalEmployees, logs, departments] = await Promise.all([
      prisma.employee.count({
        where: { companyId, status: 'ACTIVE' }
      }).catch(() => 0),
      prisma.attendanceLog.findMany({
        where: {
          companyId,
          attendanceDate: startOfDay
        },
        include: {
          employee: { select: { departmentId: true, department: { select: { name: true } } } }
        }
      }).catch(() => []),
      prisma.department.findMany({
        where: { companyId },
        include: { _count: { select: { employees: { where: { status: 'ACTIVE' } } } } }
      }).catch(() => [])
    ]);

    let present = 0;
    let late = 0;
    let halfDay = 0;

    logs.forEach((log) => {
      if (['PRESENT', 'LATE', 'HALF_DAY'].includes(log.status) || log.checkInTime || log.checkInAt) {
        present += 1;
      }
      if (log.status === 'LATE' || log.isLate) {
        late += 1;
      }
      if (log.status === 'HALF_DAY') {
        halfDay += 1;
      }
    });

    const clockedInCount = logs.length;
    const absent = Math.max(0, totalEmployees - clockedInCount);
    const attendanceRate = totalEmployees > 0 ? Math.round((clockedInCount / totalEmployees) * 1000) / 10 : 0;
    const punctualityRate = clockedInCount > 0 ? Math.round(((clockedInCount - late) / clockedInCount) * 1000) / 10 : 100;

    // Real 7-day trend
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = [];
    const now = new Date(startOfDay);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const curDateStr = d.toISOString().split('T')[0];
      const curDayDate = new Date(curDateStr);
      const dayName = days[d.getDay()];

      const [dayPresent, dayLate] = await Promise.all([
        prisma.attendanceLog.count({
          where: { companyId, attendanceDate: curDayDate, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } }
        }).catch(() => 0),
        prisma.attendanceLog.count({
          where: {
            companyId,
            attendanceDate: curDayDate,
            OR: [{ status: 'LATE' }, { isLate: true }]
          }
        }).catch(() => 0)
      ]);

      trend.push({
        date: curDateStr,
        day: dayName,
        present: totalEmployees > 0 ? Math.min(100, Math.round((dayPresent / totalEmployees) * 100)) : 0,
        late: totalEmployees > 0 ? Math.min(100, Math.round((dayLate / totalEmployees) * 100)) : 0
      });
    }

    // Real department breakdown
    const departmentBreakdown = departments.map(dept => {
      const deptTotal = dept._count?.employees || 0;
      const deptPresent = logs.filter(l => l.employee?.departmentId === dept.id).length;
      const pct = deptTotal > 0 ? Math.min(100, Math.round((deptPresent / deptTotal) * 100)) : 0;
      return {
        department: dept.name,
        presentPct: pct
      };
    });

    return {
      date: dateStr,
      totalEmployees: totalEmployees || 0,
      clockedIn: clockedInCount || 0,
      presentCount: present || 0,
      present: present || 0,
      lateCount: late || 0,
      late: late || 0,
      halfDayCount: halfDay || 0,
      halfDay: halfDay || 0,
      absentCount: absent || 0,
      absent: absent || 0,
      attendanceRate,
      punctualityRate,
      presentRate: `${attendanceRate}%`,
      trend,
      departmentBreakdown
    };
  }
};

export default attendanceRepository;
