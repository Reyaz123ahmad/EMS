import { prisma } from '../../../config/prisma.js';

// In-memory cache for shift resolution (<0.01ms)
const shiftResolverCache = new Map();
const inFlightShiftPromises = new Map();

export function clearShiftResolutionCache() {
  shiftResolverCache.clear();
  inFlightShiftPromises.clear();
}

export function calculateShiftDurationHours(startTime = '09:00', endTime = '18:00', isNightShift = false) {
  const [startH, startM] = (startTime || '09:00').split(':').map(Number);
  const [endH, endM] = (endTime || '18:00').split(':').map(Number);
  let startMinutes = startH * 60 + (startM || 0);
  let endMinutes = endH * 60 + (endM || 0);
  if (isNightShift || endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  return Number(((endMinutes - startMinutes) / 60).toFixed(2));
}

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
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  const localDateStr = `${y}-${m}-${d}`;
  const utcDateStr = targetDate.toISOString().slice(0, 10);

  const cacheKey = `shift:${employeeId}:${companyId || 'default'}:${localDateStr}`;
  const cached = shiftResolverCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  if (inFlightShiftPromises.has(cacheKey)) {
    return inFlightShiftPromises.get(cacheKey);
  }

  const queryPromise = (async () => {
    try {
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      // 1. Daily Roster (Published discrete day shift override)
      const roster = await prisma.roster.findFirst({
        where: {
          employeeId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          isPublished: true
        },
        include: { shift: true }
      });

      let s = null;
      let source = 'NONE';
      let validTill = null;

      if (roster && roster.shift && roster.shift.isActive !== false) {
        s = roster.shift;
        source = 'ROSTER';
        validTill = localDateStr;
      }

      // 2. Direct indexed ShiftAssignment lookup
      if (!s) {
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

        if (assignment && assignment.shift && assignment.shift.isActive !== false) {
          s = assignment.shift;
          source = 'ASSIGNMENT';
          validTill = assignment.effectiveTo ? assignment.effectiveTo.toISOString().slice(0, 10) : null;
        }
      }

      // 3. Fallback Company Default Shift
      if (!s) {
        let resolvedCompanyId = companyId;
        if (!resolvedCompanyId && employeeId) {
          const emp = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { companyId: true }
          });
          resolvedCompanyId = emp?.companyId;
        }

        if (resolvedCompanyId) {
          s = await prisma.shift.findFirst({
            where: { companyId: resolvedCompanyId, isActive: true },
            orderBy: { createdAt: 'asc' }
          });
          if (s) {
            source = 'COMPANY_DEFAULT';
          }
        }
      }

      if (s) {
        const isNight = Boolean(s.isNightShift || (s.endTime && s.startTime && s.endTime <= s.startTime));
        const calculatedHours = calculateShiftDurationHours(s.startTime, s.endTime, isNight);
        const res = {
          hasShift: true,
          source,
          shift: {
            id: s.id,
            name: s.name,
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '18:00',
            graceMinutes: s.graceMinutes !== undefined && s.graceMinutes !== null ? s.graceMinutes : 15,
            workingHours: s.workingHours || calculatedHours,
            isNightShift: isNight,
            breakRules: []
          },
          validTill
        };
        shiftResolverCache.set(cacheKey, { data: res, expiresAt: Date.now() + 300000 });
        return res;
      }

      const res = { hasShift: false, source: 'NONE', shift: null, validTill: null };
      shiftResolverCache.set(cacheKey, { data: res, expiresAt: Date.now() + 300000 });
      return res;
    } finally {
      inFlightShiftPromises.delete(cacheKey);
    }
  })();

  inFlightShiftPromises.set(cacheKey, queryPromise);
  return queryPromise;
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
