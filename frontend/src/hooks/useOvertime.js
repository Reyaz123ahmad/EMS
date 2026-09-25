import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import overtimeService from '../services/overtime.service.js';

export function useOvertimeRules() {
  return useQuery({
    queryKey: ['overtime', 'rules'],
    queryFn: () => overtimeService.getRules()
  });
}

export function useCreateOvertimeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => overtimeService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'rules'] });
    }
  });
}

export function useUpdateOvertimeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => overtimeService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'rules'] });
    }
  });
}

export function useDeleteOvertimeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => overtimeService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'rules'] });
    }
  });
}

export function useOvertimeRecords(params = {}) {
  return useQuery({
    queryKey: ['overtime', 'records', params],
    queryFn: () => overtimeService.getRecords(params)
  });
}

export function useApplyOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => overtimeService.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
    }
  });
}

export function useOvertimeRequests(params = {}) {
  return useQuery({
    queryKey: ['overtime', 'requests', params],
    queryFn: () => overtimeService.getRequests(params)
  });
}

export function useApproveOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => overtimeService.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'records'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'stats'] });
    }
  });
}

export function useRejectOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => overtimeService.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
    }
  });
}

export function useBulkApproveOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => overtimeService.bulkApprove(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'records'] });
    }
  });
}

export function useOvertimeStats(params = {}) {
  return useQuery({
    queryKey: ['overtime', 'stats', params],
    queryFn: () => overtimeService.getStats(params)
  });
}

export default {
  useOvertimeRules,
  useCreateOvertimeRule,
  useUpdateOvertimeRule,
  useDeleteOvertimeRule,
  useOvertimeRecords,
  useApplyOvertime,
  useOvertimeRequests,
  useApproveOvertime,
  useRejectOvertime,
  useBulkApproveOvertime,
  useOvertimeStats
};
