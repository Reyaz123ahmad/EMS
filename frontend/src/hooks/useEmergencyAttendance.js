import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import emergencyAttendanceService from '../services/emergency-attendance.service.js';

export function useEmergencyRequests(params = {}) {
  return useQuery({
    queryKey: ['emergency-requests', params],
    queryFn: () => emergencyAttendanceService.getRequests(params),
  });
}

export function useEmergencyRequest(id) {
  return useQuery({
    queryKey: ['emergency-request', id],
    queryFn: () => emergencyAttendanceService.getRequestById(id),
    enabled: Boolean(id),
  });
}

export function useCreateEmergencyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => emergencyAttendanceService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-requests'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-stats'] });
    },
  });
}

export function useApproveEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, notes }) =>
      emergencyAttendanceService.approveRequest(requestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-requests'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-stats'] });
    },
  });
}

export function useRejectEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }) =>
      emergencyAttendanceService.rejectRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-requests'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-stats'] });
    },
  });
}

export function useBulkApproveEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestIds) => emergencyAttendanceService.bulkApprove(requestIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-requests'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-stats'] });
    },
  });
}

export function useEmergencyStats() {
  return useQuery({
    queryKey: ['emergency-stats'],
    queryFn: () => emergencyAttendanceService.getEmergencyStats(),
  });
}

export default {
  useEmergencyRequests,
  useEmergencyRequest,
  useCreateEmergencyRequest,
  useApproveEmergency,
  useRejectEmergency,
  useBulkApproveEmergency,
  useEmergencyStats,
};
