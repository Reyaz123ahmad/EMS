import { useQuery } from '@tanstack/react-query';
import paymentAnalyticsService from '../services/payment-analytics.service.js';

export function useRevenueStats(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-revenue', params],
    queryFn: () => paymentAnalyticsService.getRevenueStats(params),
  });
}

export function useMRR(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-mrr', params],
    queryFn: () => paymentAnalyticsService.getMRR(params),
  });
}

export function useARR(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-arr', params],
    queryFn: () => paymentAnalyticsService.getARR(params),
  });
}

export function useChurnRate(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-churn', params],
    queryFn: () => paymentAnalyticsService.getChurnRate(params),
  });
}

export function usePaymentSuccessRate(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-success-rate', params],
    queryFn: () => paymentAnalyticsService.getPaymentSuccessRate(params),
  });
}

export function useRefundRate(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-refund-rate', params],
    queryFn: () => paymentAnalyticsService.getRefundRate(params),
  });
}

export function usePaymentMethodStats(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-methods', params],
    queryFn: () => paymentAnalyticsService.getPaymentMethodStats(params),
  });
}

export function useRevenueByPlan(params = {}) {
  return useQuery({
    queryKey: ['payment-analytics-plan-revenue', params],
    queryFn: () => paymentAnalyticsService.getRevenueByPlan(params),
  });
}

export default {
  useRevenueStats,
  useMRR,
  useARR,
  useChurnRate,
  usePaymentSuccessRate,
  useRefundRate,
  usePaymentMethodStats,
  useRevenueByPlan
};
