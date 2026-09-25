import { useMemo } from 'react';
import { useTodayStatus } from './useAttendance.js';

/**
 * Hook to inspect assigned shift, timings, and late calculation
 */
export function useShiftRules(employeeId) {
  const { data: todayData, isLoading } = useTodayStatus(employeeId ? { employeeId } : {});

  const shift = todayData?.data?.shift?.shift || todayData?.data?.attendance?.shift || null;
  const hasShift = Boolean(todayData?.data?.shift?.hasShift ?? shift);

  const lateMinutes = todayData?.data?.attendance?.lateMinutes || 0;
  const isLate = Boolean(todayData?.data?.attendance?.isLate || lateMinutes > 0);
  const adjustedCheckOutTime = todayData?.data?.attendance?.adjustedCheckOutTime || null;

  const timingInfo = useMemo(() => {
    if (!shift) {
      return {
        startTime: '09:00',
        endTime: '18:00',
        workingHours: 8,
        graceMinutes: 15
      };
    }
    return {
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '18:00',
      workingHours: shift.workingHours || 8,
      graceMinutes: shift.graceMinutes !== undefined ? shift.graceMinutes : 15
    };
  }, [shift]);

  return {
    isLoading,
    hasShift,
    shift,
    timingInfo,
    isLate,
    lateMinutes,
    adjustedCheckOutTime
  };
}

export function useShiftAssignment(employeeId) {
  const { hasShift, shift, isLoading } = useShiftRules(employeeId);
  return { hasShift, shift, isLoading };
}

export function useShiftTiming(employeeId) {
  const { timingInfo, isLoading } = useShiftRules(employeeId);
  return { timingInfo, isLoading };
}

export function useLateCalculation(employeeId) {
  const { isLate, lateMinutes, adjustedCheckOutTime, isLoading } = useShiftRules(employeeId);
  return { isLate, lateMinutes, adjustedCheckOutTime, isLoading };
}

export default useShiftRules;
