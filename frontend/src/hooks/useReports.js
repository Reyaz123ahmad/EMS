import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import reportService from '../services/report.service.js';

export function useGenerateReport() {
  return useMutation({
    mutationFn: (data) => reportService.generateReport(data)
  });
}

export function useExportReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reportService.exportReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
      queryClient.invalidateQueries({ queryKey: ['report-stats'] });
    }
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: ['report-stats'],
    queryFn: () => reportService.getReportStats()
  });
}

export function useReportHistory(params = {}) {
  return useQuery({
    queryKey: ['report-history', params],
    queryFn: () => reportService.getReportHistory(params)
  });
}

export function useBreaksReport(params = {}) {
  return useQuery({
    queryKey: ['breaks-report', params],
    queryFn: () => reportService.getBreaksReport(params),
    enabled: Boolean(params.from && params.to)
  });
}

export function useBreaksSummary(params = {}) {
  return useQuery({
    queryKey: ['breaks-summary', params],
    queryFn: () => reportService.getBreaksSummary(params),
    enabled: Boolean(params.from && params.to)
  });
}

export function useEmployeeBreaksReport(employeeId, params = {}) {
  return useQuery({
    queryKey: ['employee-breaks-report', employeeId, params],
    queryFn: () => reportService.getEmployeeBreaksReport(employeeId, params),
    enabled: Boolean(employeeId && params.from && params.to)
  });
}

export default {
  useGenerateReport,
  useExportReport,
  useReportStats,
  useReportHistory,
  useBreaksReport,
  useBreaksSummary,
  useEmployeeBreaksReport
};
