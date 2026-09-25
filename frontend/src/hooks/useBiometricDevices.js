import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { biometricDevicesService } from '../services/biometric-devices.service';

export function useDevices(params = {}) {
  return useQuery({
    queryKey: ['biometric-devices', params],
    queryFn: () => biometricDevicesService.listDevices(params)
  });
}

export function useDevice(id) {
  return useQuery({
    queryKey: ['biometric-device', id],
    queryFn: () => biometricDevicesService.getDevice(id),
    enabled: Boolean(id)
  });
}

export function useDeviceStatus(id) {
  return useQuery({
    queryKey: ['biometric-device-status', id],
    queryFn: () => biometricDevicesService.getDeviceStatus(id),
    enabled: Boolean(id),
    refetchInterval: 10000 // poll status every 10s
  });
}

export function useDevicePunches(params = {}) {
  return useQuery({
    queryKey: ['biometric-punches', params],
    queryFn: () => biometricDevicesService.listPunches(params)
  });
}

export function useDevicePunchStats(params = {}) {
  return useQuery({
    queryKey: ['biometric-punch-stats', params],
    queryFn: () => biometricDevicesService.getPunchStats(params)
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => biometricDevicesService.createDevice(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Biometric device registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register biometric device');
    }
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => biometricDevicesService.updateDevice(id, data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Device updated successfully');
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-device'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update device');
    }
  });
}

export function useDeactivateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => biometricDevicesService.deactivateDevice(id),
    onSuccess: (data) => {
      toast.success(data?.message || 'Device deactivated');
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate device');
    }
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => biometricDevicesService.regenerateApiKey(id),
    onSuccess: (data) => {
      toast.success(data?.message || 'API key regenerated successfully!');
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-device'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to regenerate API key');
    }
  });
}

export function useReprocessPunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => biometricDevicesService.reprocessPunch(id),
    onSuccess: () => {
      toast.success('Punch reprocessed successfully');
      queryClient.invalidateQueries({ queryKey: ['biometric-punches'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reprocess punch');
    }
  });
}
