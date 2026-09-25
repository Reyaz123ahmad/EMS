import { prisma } from '../../config/prisma.js';

export const attendanceRepository = {
  /**
   * Find today's attendance log for an employee
   */
  async findTodayAttendance(employeeId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    return prisma.attendanceLog.findFirst({
      where: {
        employeeId,
        attendanceDate: startOfDay
      },
      include: {
        breaks: {
          orderBy: { breakStartAt: 'asc' }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            branch: true,
            department: true
          }
        }
      }
    });
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

    return prisma.attendanceLog.create({
      data: {
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
        isDeviceTrusted: data.isDeviceTrusted || true,
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
        requiredMinutes: data.requiredMinutes || null,
        actualMinutes: data.actualMinutes || null,
        shortfallMinutes: data.shortfallMinutes || null,
        totalBreaks: data.totalBreaks || 0,
        totalBreakMinutes: data.totalBreakMinutes || 0,
        remainingBreaks: data.remainingBreaks !== undefined ? data.remainingBreaks : null,
        remainingBreakMinutes: data.remainingBreakMinutes !== undefined ? data.remainingBreakMinutes : null,
        status: data.status || 'PRESENT',
        remarks: data.remarks || null
      }
    });
  },

  /**
   * Update attendance log (e.g. check-out, duration, status)
   */
  async updateAttendanceLog(id, data) {
    return prisma.attendanceLog.update({
      where: { id },
      data,
      include: {
        breaks: true
      }
    });
  },

  /**
   * List attendance logs with multi-parameter filtering and pagination
   */
  async findAttendanceLogs(companyId, filters = {}, pagination = { page: 1, limit: 20 }) {
    const { employeeId, departmentId, branchId, status, startDate, endDate, search } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

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
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setUTCHours(0, 0, 0, 0);
        where.attendanceDate.gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setUTCHours(23, 59, 59, 999);
        where.attendanceDate.lte = eDate;
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
              branch: { select: { id: true, name: true } }
            }
          },
          breaks: true
        },
        orderBy: { attendanceDate: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      logs,
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
    return prisma.attendanceBreak.create({
      data: {
        attendanceLogId: data.attendanceLogId,
        employeeId: data.employeeId,
        breakStartAt: data.breakStartAt || new Date(),
        breakType: data.breakType || 'SHORT',
        breakPhotoUrl: data.breakPhotoUrl || null,
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
    return prisma.attendanceBreak.update({
      where: { id },
      data
    });
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
    return prisma.employee.findFirst({
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
   * Find card by unique number within company
   */
  async findCardByNumber(companyId, cardNumber) {
    return prisma.employeeCard.findFirst({
      where: { companyId, cardNumber, isActive: true },
      include: { employee: { include: { branch: true } } }
    });
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

    if (filters.employeeId) where.employeeId = filters.employeeId;
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
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [totalEmployees, logs] = await Promise.all([
      prisma.employee.count({
        where: { companyId, status: 'ACTIVE' }
      }),
      prisma.attendanceLog.findMany({
        where: {
          companyId,
          attendanceDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
    ]);

    let present = 0;
    let late = 0;
    let halfDay = 0;

    logs.forEach((log) => {
      if (log.status === 'PRESENT') present += 1;
      else if (log.status === 'LATE') late += 1;
      else if (log.status === 'HALF_DAY') halfDay += 1;
    });

    const clockedInCount = logs.length;
    const absent = Math.max(0, totalEmployees - clockedInCount);
    const presentRate = totalEmployees > 0 ? Math.round(((present + late + halfDay) / totalEmployees) * 100) : 0;

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalEmployees,
      clockedIn: clockedInCount,
      present,
      late,
      halfDay,
      absent,
      presentRate: `${presentRate}%`
    };
  }
};

export default attendanceRepository;
