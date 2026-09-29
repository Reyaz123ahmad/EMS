import { prisma } from '../../../config/prisma.js';

/**
 * Enterprise Shift Resolver Service
 * Canonical single source of truth for resolving active employee shifts
 * 
 * Priority:
 * 1. Daily Roster (Published discrete day shift override)
 * 2. ShiftAssignment (Active date-range or permanent recurring assignment)
 * 3. Company Default Shift (Fallback active shift)
 */
export async function resolveShiftForEmployee({ employeeId, companyId, date = new Date() }) {
  if (!employeeId) {
    return { hasShift: false, shift: null, source: 'NONE' };
  }

  const targetDate = new Date(date);
  const targetDateStr = targetDate.toISOString().slice(0, 10);
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // 1. PRIORITY 1: Published Daily Roster (Date-specific shift override)
  const roster = await prisma.roster.findFirst({
    where: {
      employeeId,
      isPublished: true,
      OR: [
        { date: new Date(targetDateStr) },
        { date: { gte: startOfDay, lte: endOfDay } }
      ],
      ...(companyId ? { companyId } : {})
    },
    include: {
      shift: {
        include: {
          shiftBreakRules: {
            include: { breakRule: true }
          }
        }
      }
    }
  });

  if (roster && roster.shift && roster.shift.isActive) {
    const s = roster.shift;
    return {
      hasShift: true,
      source: 'ROSTER',
      shift: {
        id: s.id,
        name: s.name,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '18:00',
        graceMinutes: s.graceMinutes !== undefined ? s.graceMinutes : 15,
        workingHours: s.workingHours || 8,
        isNightShift: s.isNightShift || false,
        breakRules: s.shiftBreakRules?.map(r => r.breakRule) || []
      },
      validTill: targetDateStr,
      rosterId: roster.id
    };
  }

  // 2. PRIORITY 2: Active ShiftAssignment (Date-ranged or permanent assignment)
  const assignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: targetDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: targetDate } }
      ],
      ...(companyId ? { shift: { companyId } } : {})
    },
    include: {
      shift: {
        include: {
          shiftBreakRules: {
            include: { breakRule: true }
          }
        }
      }
    },
    orderBy: { effectiveFrom: 'desc' }
  });

  if (assignment && assignment.shift && assignment.shift.isActive) {
    const s = assignment.shift;
    return {
      hasShift: true,
      source: 'ASSIGNMENT',
      shift: {
        id: s.id,
        name: s.name,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '18:00',
        graceMinutes: s.graceMinutes !== undefined ? s.graceMinutes : 15,
        workingHours: s.workingHours || 8,
        isNightShift: s.isNightShift || false,
        breakRules: s.shiftBreakRules?.map(r => r.breakRule) || []
      },
      validTill: assignment.effectiveTo ? assignment.effectiveTo.toISOString().slice(0, 10) : null,
      assignmentId: assignment.id
    };
  }

  // 3. PRIORITY 3: Fallback Company Default Shift
  const resolvedCompanyId = companyId || (await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true }
  }))?.companyId;

  if (resolvedCompanyId) {
    const companyShift = await prisma.shift.findFirst({
      where: { companyId: resolvedCompanyId, isActive: true },
      include: {
        shiftBreakRules: {
          include: { breakRule: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (companyShift) {
      return {
        hasShift: true,
        source: 'COMPANY_DEFAULT',
        shift: {
          id: companyShift.id,
          name: companyShift.name,
          startTime: companyShift.startTime || '09:00',
          endTime: companyShift.endTime || '18:00',
          graceMinutes: companyShift.graceMinutes !== undefined ? companyShift.graceMinutes : 15,
          workingHours: companyShift.workingHours || 8,
          isNightShift: companyShift.isNightShift || false,
          breakRules: companyShift.shiftBreakRules?.map(r => r.breakRule) || []
        },
        validTill: null
      };
    }
  }

  return { hasShift: false, source: 'NONE', shift: null, validTill: null };
}

/**
 * Helper to fetch full effective shift overview including default fallback
 */
export async function getEffectiveShiftOverview({ employeeId, companyId, date = new Date() }) {
  const current = await resolveShiftForEmployee({ employeeId, companyId, date });

  // Resolve what the default baseline shift is (Employee ShiftAssignment > Company First Active Shift)
  const targetDate = new Date(date);
  let defaultShift = null;

  if (employeeId) {
    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        effectiveFrom: { lte: targetDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: targetDate } }
        ]
      },
      include: { shift: true },
      orderBy: { effectiveFrom: 'desc' }
    });
    if (assignment && assignment.shift && assignment.shift.isActive) {
      defaultShift = assignment.shift;
    }
  }

  if (!defaultShift) {
    const resolvedCompanyId = companyId || (employeeId ? (await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { companyId: true }
    }))?.companyId : null);

    if (resolvedCompanyId) {
      defaultShift = await prisma.shift.findFirst({
        where: { companyId: resolvedCompanyId, isActive: true },
        orderBy: { createdAt: 'asc' }
      });
    }
  }

  const isRoster = current.source === 'ROSTER';

  return {
    currentShift: current.shift,
    source: current.source,
    validTill: current.validTill,
    isRosterOverride: isRoster,
    isOverridden: isRoster || (current.source === 'ASSIGNMENT' && current.validTill !== null),
    defaultShift: defaultShift ? {
      id: defaultShift.id,
      name: defaultShift.name,
      startTime: defaultShift.startTime,
      endTime: defaultShift.endTime,
      graceMinutes: defaultShift.graceMinutes
    } : null,
    defaultShiftStatus: isRoster ? 'DEACTIVATED_BY_ROSTER' : 'ACTIVE'
  };
}

export default {
  resolveShiftForEmployee,
  getEffectiveShiftOverview
};
