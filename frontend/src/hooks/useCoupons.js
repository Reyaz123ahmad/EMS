import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import couponService from '../services/coupon.service.js';
import { toast } from 'sonner';

export function useCoupons(params = {}) {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => couponService.listCoupons(params),
  });
}

export function useCouponStats(params = {}) {
  return useQuery({
    queryKey: ['coupon-stats', params],
    queryFn: () => couponService.getCouponStats(params),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => couponService.createCoupon(data),
    onSuccess: () => {
      toast.success('Coupon created successfully');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => couponService.updateCoupon(id, data),
    onSuccess: () => {
      toast.success('Coupon updated successfully');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update coupon');
    }
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => couponService.deleteCoupon(id),
    onSuccess: () => {
      toast.success('Coupon deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (data) => couponService.validateCoupon(data),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    }
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => couponService.applyCoupon(data),
    onSuccess: () => {
      toast.success('Coupon applied successfully');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to apply coupon');
    }
  });
}

export default {
  useCoupons,
  useCouponStats,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useValidateCoupon,
  useApplyCoupon
};
