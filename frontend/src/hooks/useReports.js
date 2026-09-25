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

export default {
  useGenerateReport,
  useExportReport,
  useReportStats,
  useReportHistory
};
