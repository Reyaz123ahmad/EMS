import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faceRegistrationService } from '../services/face-registration.service';
import { toast } from 'sonner';


export function useEmployeesWithFace(params = {}) {
  return useQuery({
    queryKey: ['employeesWithFace', params],
    queryFn: () => faceRegistrationService.listWithFace(params)
  });
}

export function useEmployeesWithoutFace(params = {}) {
  return useQuery({
    queryKey: ['employeesWithoutFace', params],
    queryFn: () => faceRegistrationService.listWithoutFace(params)
  });
}

export function useFaceStatus(employeeId) {
  return useQuery({
    queryKey: ['faceStatus', employeeId],
    queryFn: () => faceRegistrationService.getFaceStatus(employeeId),
    enabled: Boolean(employeeId)
  });
}

export function useFaceStats() {
  return useQuery({
    queryKey: ['faceStats'],
    queryFn: () => faceRegistrationService.getStats()
  });
}

export function useRegisterFace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => faceRegistrationService.registerFace(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Face registered successfully');
      queryClient.invalidateQueries({ queryKey: ['employeesWithFace'] });
      queryClient.invalidateQueries({ queryKey: ['employeesWithoutFace'] });
      queryClient.invalidateQueries({ queryKey: ['faceStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register face');
    }
  });
}

export function useUpdateFace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => faceRegistrationService.updateFace(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Face biometric updated successfully');
      queryClient.invalidateQueries({ queryKey: ['employeesWithFace'] });
      queryClient.invalidateQueries({ queryKey: ['faceStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update face');
    }
  });
}

export function useDeleteFace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => faceRegistrationService.deleteFace(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Face biometric reset successfully');
      queryClient.invalidateQueries({ queryKey: ['employeesWithFace'] });
      queryClient.invalidateQueries({ queryKey: ['employeesWithoutFace'] });
      queryClient.invalidateQueries({ queryKey: ['faceStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete face biometric');
    }
  });
}

export function useVerifyFace() {
  return useMutation({
    mutationFn: (data) => faceRegistrationService.verifyFace(data),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Face verification failed');
    }
  });
}

export function useBulkRegisterFace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => faceRegistrationService.bulkRegister(data),
    onSuccess: (data) => {
      toast.success(`Bulk registration completed: ${data?.data?.successful} successful`);
      queryClient.invalidateQueries({ queryKey: ['employeesWithFace'] });
      queryClient.invalidateQueries({ queryKey: ['employeesWithoutFace'] });
      queryClient.invalidateQueries({ queryKey: ['faceStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Bulk registration failed');
    }
  });
}
