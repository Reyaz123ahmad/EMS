import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fingerAttendanceService } from '../services/finger-attendance.service';
import { toast } from 'sonner';


export function useEmployeeFingerEnrollments(employeeId) {
  return useQuery({
    queryKey: ['employeeFingerEnrollments', employeeId],
    queryFn: () => fingerAttendanceService.getEmployeeEnrollments(employeeId),
    enabled: Boolean(employeeId)
  });
}

export function useFingerPunches(params = {}) {
  return useQuery({
    queryKey: ['fingerPunches', params],
    queryFn: () => fingerAttendanceService.listFingerPunches(params)
  });
}

export function useFingerStats() {
  return useQuery({
    queryKey: ['fingerStats'],
    queryFn: () => fingerAttendanceService.getStats()
  });
}

export function useEnrollFinger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fingerAttendanceService.enrollFinger(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Fingerprint template enrolled successfully');
      queryClient.invalidateQueries({ queryKey: ['employeeFingerEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['fingerStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to enroll fingerprint');
    }
  });
}

export function useDeleteFingerEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, fingerIndex }) =>
      fingerAttendanceService.deleteFingerEnrollment(employeeId, fingerIndex),
    onSuccess: (data) => {
      toast.success(data?.message || 'Fingerprint enrollment removed');
      queryClient.invalidateQueries({ queryKey: ['employeeFingerEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['fingerStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove fingerprint template');
    }
  });
}

export function useSyncFingerToDevice() {
  return useMutation({
    mutationFn: (deviceId) => fingerAttendanceService.syncToDevice(deviceId),
    onSuccess: (data) => {
      toast.success(data?.message || 'Fingerprint templates synchronized with device');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Hardware template sync failed');
    }
  });
}
