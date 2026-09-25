import { useMemo } from 'react';
import { useBreakStatus, useTodayStatus } from './useAttendance.js';

/**
 * Hook to inspect break limits, quotas, active break return times, and late warnings
 */
export function useBreakRules(employeeId) {
  const { data: breakData, isLoading: isBreakLoading } = useBreakStatus(employeeId ? { employeeId } : {});
  const { data: todayData, isLoading: isTodayLoading } = useTodayStatus(employeeId ? { employeeId } : {});

  const status = breakData?.data || todayData?.data?.breakStatus || {};
  const activeBreak = status.activeBreak || todayData?.data?.breaks?.find((b) => !b.breakEndAt) || null;

  const returnTimeInfo = useMemo(() => {
    if (!activeBreak || !activeBreak.expectedReturnTime) {
      return {
        hasActiveBreak: false,
        expectedReturnTime: null,
        isLate: false,
        lateMinutes: 0
      };
    }

    const expected = new Date(activeBreak.expectedReturnTime);
    const now = new Date();
    const diffMs = now.getTime() - expected.getTime();
    const lateMinutes = diffMs > 0 ? Math.round(diffMs / 60000) : 0;

    return {
      hasActiveBreak: true,
      expectedReturnTime: expected,
      isLate: lateMinutes > 0,
      lateMinutes
    };
  }, [activeBreak]);

  return {
    isLoading: isBreakLoading || isTodayLoading,
    canTakeBreak: Boolean(status.canTakeBreak ?? !activeBreak),
    totalBreaks: status.totalBreaks || 0,
    remainingBreaks: status.remainingBreaks !== undefined ? status.remainingBreaks : 3,
    totalBreakMinutes: status.totalBreakMinutes || 0,
    remainingMinutes: status.remainingMinutes !== undefined ? status.remainingMinutes : 60,
    maxBreaks: status.maxBreaks || 3,
    maxBreakMinutes: status.maxBreakMinutes || 60,
    breakTypes: status.breakTypes || ['LUNCH', 'SHORT'],
    lunchDurationMinutes: status.lunchDurationMinutes || 30,
    shortDurationMinutes: status.shortDurationMinutes || 10,
    hasActiveBreak: Boolean(activeBreak),
    activeBreak,
    reason: status.reason || '',
    returnTimeInfo
  };
}

export function useBreakLimit(employeeId) {
  const { canTakeBreak, totalBreaks, remainingBreaks, totalBreakMinutes, remainingMinutes, maxBreaks, reason, isLoading } = useBreakRules(employeeId);
  return { canTakeBreak, totalBreaks, remainingBreaks, totalBreakMinutes, remainingMinutes, maxBreaks, reason, isLoading };
}

export function useBreakReturnTime(employeeId) {
  const { returnTimeInfo, activeBreak, isLoading } = useBreakRules(employeeId);
  return { returnTimeInfo, activeBreak, isLoading };
}

export default useBreakRules;
