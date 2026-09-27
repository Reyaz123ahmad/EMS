import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import shiftService from '../services/shift.service.js';

export function useShifts(companyId) {
  return useQuery({
    queryKey: ['shifts', companyId],
    queryFn: async () => {
      const data = await shiftService.getShifts();
      
      // Always return array
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.shifts)) return data.shifts;
      if (Array.isArray(data?.data)) return data.data;
      
      return [];
    }
  });
}

export function useShift(id) {
  return useQuery({
    queryKey: ['shifts', id],
    queryFn: () => shiftService.getShift(id),
    enabled: !!id
  });
}

export function useMyShift() {
  return useQuery({
    queryKey: ['my-shift'],
    queryFn: () => shiftService.getMyShift()
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shiftService.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => shiftService.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => shiftService.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
}

export function useAssignShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shiftService.assignShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
}

export function useShiftStats() {
  return useQuery({
    queryKey: ['shifts', 'stats'],
    queryFn: () => shiftService.getShiftStats()
  });
}

export function useRosters(params = {}) {
  return useQuery({
    queryKey: ['rosters', params],
    queryFn: async () => {
      const data = await shiftService.getRosters(params);
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.rosters)) return data.rosters;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    }
  });
}

export function useGenerateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shiftService.generateRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    }
  });
}

export function usePublishRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shiftService.publishRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    }
  });
}

export function useRosterCalendar(params = {}) {
  return useQuery({
    queryKey: ['rosters', 'calendar', params],
    queryFn: async () => {
      const data = await shiftService.getRosterCalendar(params);
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.roster)) return data.roster;
      if (Array.isArray(data?.rosters)) return data.rosters;
      return data || [];
    }
  });
}

export function useBulkAssignRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shiftService.bulkAssignRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    }
  });
}

export default {
  useShifts,
  useShift,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useAssignShift,
  useShiftStats,
  useMyShift,
  useRosters,
  useGenerateRoster,
  usePublishRoster,
  useRosterCalendar,
  useBulkAssignRoster
};
