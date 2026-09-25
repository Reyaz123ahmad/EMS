import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import advancedSecurityService from '../services/advanced-security.service.js';

export function useSecurityScore(params = {}) {
  return useQuery({
    queryKey: ['security-score', params],
    queryFn: () => advancedSecurityService.getSecurityScore(params),
  });
}

export function useSecurityDashboard() {
  return useQuery({
    queryKey: ['security-dashboard'],
    queryFn: () => advancedSecurityService.getSecurityDashboard(),
    refetchInterval: 30000,
  });
}

export function useFraudSignals(params = {}) {
  return useQuery({
    queryKey: ['fraud-signals', params],
    queryFn: () => advancedSecurityService.getFraudSignals(params),
  });
}

export function useReviewFraudSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ signalId, data }) => advancedSecurityService.reviewFraudSignal(signalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-signals'] });
      queryClient.invalidateQueries({ queryKey: ['security-dashboard'] });
    },
  });
}

export function useSecurityEvents(params = {}) {
  return useQuery({
    queryKey: ['security-events', params],
    queryFn: () => advancedSecurityService.getSecurityEvents(params),
  });
}

export function useAuditLogs(params = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => advancedSecurityService.getAuditLogs(params),
  });
}

export function useBlockedEmployees() {
  return useQuery({
    queryKey: ['blocked-employees'],
    queryFn: () => advancedSecurityService.getBlockedEmployees(),
  });
}

export function useBlockEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => advancedSecurityService.blockEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-employees'] });
      queryClient.invalidateQueries({ queryKey: ['security-dashboard'] });
    },
  });
}

export function useUnblockEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => advancedSecurityService.unblockEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-employees'] });
    },
  });
}

export function useAdvancedSecurity() {
  const dashboardQuery = useSecurityDashboard();
  const scoreQuery = useSecurityScore();
  const reviewMutation = useReviewFraudSignal();

  return {
    dashboard: dashboardQuery.data,
    isLoadingDashboard: dashboardQuery.isLoading,
    score: scoreQuery.data,
    isLoadingScore: scoreQuery.isLoading,
    reviewFraudSignal: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
  };
}

export default useAdvancedSecurity;
