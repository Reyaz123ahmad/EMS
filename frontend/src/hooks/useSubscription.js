import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import subscriptionService from '../services/subscription.service.js';
import useSubscriptionStore from '../store/subscription.store.js';

export function useCurrentSubscription() {
  const { setSubscription } = useSubscriptionStore();
  return useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      try {
        const data = await subscriptionService.getCurrentSubscription();
        if (data && setSubscription) setSubscription(data);
        return data;
      } catch (err) {
        if (err.response?.status === 402 && setSubscription) {
          setSubscription({ status: 'EXPIRED' });
        }
        throw err;
      }
    },
    retry: false,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getPlans(),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data) => subscriptionService.createOrder(typeof data === 'string' ? { planId: data } : data),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentData) => subscriptionService.verifyPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
    },
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => subscriptionService.renewSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason) => subscriptionService.cancelSubscription(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
    },
  });
}

export function useSubscriptionHistory() {
  return useQuery({
    queryKey: ['subscription-history'],
    queryFn: () => subscriptionService.getSubscriptionHistory(),
  });
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: () => subscriptionService.getSubscriptionStats(),
  });
}

export function useCheckExpiry() {
  return useQuery({
    queryKey: ['subscription-expiry'],
    queryFn: () => subscriptionService.checkSubscriptionExpiry(),
  });
}

export function useSubscription() {
  const currentSubQuery = useCurrentSubscription();
  const plansQuery = usePlans();
  const createOrderMutation = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const renewMutation = useRenewSubscription();
  const cancelMutation = useCancelSubscription();
  const historyQuery = useSubscriptionHistory();
  const statsQuery = useSubscriptionStats();
  const expiryQuery = useCheckExpiry();

  return {
    subscription: currentSubQuery.data,
    isLoading: currentSubQuery.isLoading,
    plans: plansQuery.data || [],
    isLoadingPlans: plansQuery.isLoading,
    history: historyQuery.data || [],
    stats: statsQuery.data,
    expiry: expiryQuery.data,
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifyingPayment: verifyPaymentMutation.isPending,
    renewSubscription: renewMutation.mutateAsync,
    isRenewing: renewMutation.isPending,
    cancelSubscription: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}

export default useSubscription;
