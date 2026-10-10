import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import planService from '../services/plan.service.js';
import { useCurrentSubscription } from './useSubscription.js';

export { useCurrentSubscription };

export function usePlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => planService.getPlans(),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => planService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => planService.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => planService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export default usePlans;
