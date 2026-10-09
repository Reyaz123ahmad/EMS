import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import breakService from '../services/break.service.js';

export function useBreakRules(params = {}) {
  return useQuery({
    queryKey: ['break-rules', params],
    queryFn: () => breakService.getBreakRules(params),
  });
}

export function useBreakRule(id) {
  return useQuery({
    queryKey: ['break-rules', id],
    queryFn: () => breakService.getBreakRule(id),
    enabled: !!id,
  });
}

export function useCreateBreakRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => breakService.createBreakRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-rules'] });
    },
  });
}

export function useUpdateBreakRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => breakService.updateBreakRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-rules'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useDeleteBreakRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => breakService.deleteBreakRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-rules'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}
