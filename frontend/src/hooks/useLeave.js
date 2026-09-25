import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import leaveService from '../services/leave.service.js';

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave', 'types'],
    queryFn: () => leaveService.getLeaveTypes()
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveService.createLeaveType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
    }
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveService.updateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
    }
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => leaveService.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
    }
  });
}

export function useLeaveBalances(params = {}) {
  return useQuery({
    queryKey: ['leave', 'balances', params],
    queryFn: () => leaveService.getBalances(params)
  });
}

export function useEmployeeLeaveBalances(employeeId, params = {}) {
  return useQuery({
    queryKey: ['leave', 'balances', employeeId, params],
    queryFn: () => leaveService.getEmployeeBalances(employeeId, params),
    enabled: !!employeeId
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveService.applyLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    }
  });
}

export function useLeaveRequests(params = {}) {
  return useQuery({
    queryKey: ['leave', 'requests', params],
    queryFn: () => leaveService.getLeaveRequests(params)
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => leaveService.approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    }
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveService.rejectLeave(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
    }
  });
}

export function useBulkApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveService.bulkApproveLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    }
  });
}

export function useLeaveCalendar(params = {}) {
  return useQuery({
    queryKey: ['leave', 'calendar', params],
    queryFn: () => leaveService.getLeaveCalendar(params)
  });
}

export function useLeaveBalanceReport(params = {}) {
  return useQuery({
    queryKey: ['leave', 'balance-report', params],
    queryFn: () => leaveService.getLeaveBalanceReport(params)
  });
}

export function useBulkAllocateLeaves() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveService.bulkAllocateLeaves(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    }
  });
}

export function useCarryForwardLeaves() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveService.carryForwardLeaves(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    }
  });
}

export function useLeaveStats(params = {}) {
  return useQuery({
    queryKey: ['leave', 'stats', params],
    queryFn: () => leaveService.getStats(params)
  });
}

export function useEmployeeLeaveHistory(employeeId, params = {}) {
  return useQuery({
    queryKey: ['leave', 'history', employeeId, params],
    queryFn: () => leaveService.getEmployeeHistory(employeeId, params),
    enabled: !!employeeId
  });
}

export default {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  useLeaveBalances,
  useEmployeeLeaveBalances,
  useApplyLeave,
  useLeaveRequests,
  useApproveLeave,
  useRejectLeave,
  useBulkApproveLeave,
  useLeaveCalendar,
  useLeaveBalanceReport,
  useBulkAllocateLeaves,
  useCarryForwardLeaves,
  useLeaveStats,
  useEmployeeLeaveHistory
};
