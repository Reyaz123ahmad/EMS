import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import attendanceService from '../services/attendance.service.js';

export function useTodayStatus(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'today', params],
    queryFn: () => attendanceService.getTodayStatus(params),
    refetchInterval: 30000 // auto-refresh status every 30s
  });
}

export function useCheckoutStatus(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'checkout-status', params],
    queryFn: () => attendanceService.getCheckoutStatus(params),
    refetchInterval: 30000 // auto-refresh status every 30s
  });
}

export function useBreakStatus(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'break-status', params],
    queryFn: () => attendanceService.getBreakStatus(params),
    refetchInterval: 30000 // auto-refresh status every 30s
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'checkout-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'break-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'logs'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
    }
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.checkOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'checkout-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'break-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'logs'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
    }
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.startBreak(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'checkout-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'break-status'] });
    }
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.endBreak(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'checkout-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'break-status'] });
    }
  });
}

export function useAttendanceLogs(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'logs', params],
    queryFn: () => attendanceService.getAttendanceLogs(params)
  });
}

export function useMonthlySummary(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'monthly-summary', params],
    queryFn: () => attendanceService.getMonthlySummary(params)
  });
}

export function useAttendanceStats(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'stats', params],
    queryFn: () => attendanceService.getStats(params)
  });
}

export function useFraudSignals(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'fraud-signals', params],
    queryFn: () => attendanceService.getFraudSignals(params)
  });
}

export function useReviewFraudSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => attendanceService.reviewFraudSignal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'fraud-signals'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-security', 'fraud-stats'] });
    }
  });
}

export function useCardScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.cardScan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'logs'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
    }
  });
}

export function useAttendanceCalendar(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'calendar', params],
    queryFn: () => attendanceService.getCalendar(params)
  });
}

export function useEmployeeAttendanceSummary(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'employee-summary', params],
    queryFn: () => attendanceService.getEmployeeSummary(params)
  });
}

export function useMarkManualAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.markManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
}

export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.bulkMark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
}

export function useAttendanceExceptions(params = {}) {
  return useQuery({
    queryKey: ['attendance', 'exceptions', params],
    queryFn: () => attendanceService.getExceptions(params)
  });
}

export function useUpdateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.updatePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'policy'] });
    }
  });
}

export default {
  useTodayStatus,
  useCheckIn,
  useCheckOut,
  useStartBreak,
  useEndBreak,
  useCardScan,
  useAttendanceLogs,
  useMonthlySummary,
  useAttendanceStats,
  useFraudSignals,
  useReviewFraudSignal,
  useAttendanceCalendar,
  useEmployeeAttendanceSummary,
  useMarkManualAttendance,
  useBulkMarkAttendance,
  useAttendanceExceptions,
  useUpdateAttendancePolicy
};

