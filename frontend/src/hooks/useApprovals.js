import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import approvalsService from '../services/approvals.service.js';

export function useWorkflows(params = {}) {
  return useQuery({
    queryKey: ['approval-workflows', params],
    queryFn: () => approvalsService.getWorkflows(params),
  });
}

export function useWorkflow(id) {
  return useQuery({
    queryKey: ['approval-workflow', id],
    queryFn: () => approvalsService.getWorkflowById(id),
    enabled: Boolean(id),
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => approvalsService.createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => approvalsService.updateWorkflow(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['approval-workflow', variables.id] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => approvalsService.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
  });
}

export function useApprovalRequests(params = {}) {
  return useQuery({
    queryKey: ['approval-requests', params],
    queryFn: () => approvalsService.getRequests(params),
  });
}

export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => approvalsService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
    },
  });
}

export function useActOnRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, action, notes }) =>
      approvalsService.actOnRequest(requestId, { action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
    },
  });
}

export function usePendingApprovals(params = {}) {
  return useQuery({
    queryKey: ['pending-approvals', params],
    queryFn: () => approvalsService.getPendingApprovals(params),
  });
}

export function useApprovalHistory(params = {}) {
  return useQuery({
    queryKey: ['approval-history', params],
    queryFn: () => approvalsService.getApprovalHistory(params),
  });
}

export function useApprovalStats() {
  return useQuery({
    queryKey: ['approval-stats'],
    queryFn: () => approvalsService.getApprovalStats(),
  });
}

export default {
  useWorkflows,
  useWorkflow,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useApprovalRequests,
  useCreateApprovalRequest,
  useActOnRequest,
  usePendingApprovals,
  useApprovalHistory,
  useApprovalStats,
};
