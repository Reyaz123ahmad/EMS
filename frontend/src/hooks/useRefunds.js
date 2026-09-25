import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import refundService from '../services/refund.service.js';
import { toast } from 'sonner';

export function useRefunds(params = {}) {
  return useQuery({
    queryKey: ['refunds', params],
    queryFn: () => refundService.listRefunds(params),
  });
}

export function useAllRefunds(params = {}) {
  return useQuery({
    queryKey: ['admin-refunds', params],
    queryFn: () => refundService.listAllRefunds(params),
  });
}

export function useRefund(id) {
  return useQuery({
    queryKey: ['refund-detail', id],
    queryFn: () => refundService.getRefundById(id),
    enabled: Boolean(id),
  });
}

export function useRefundStats(params = {}) {
  return useQuery({
    queryKey: ['refund-stats', params],
    queryFn: () => refundService.getRefundStats(params),
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => refundService.requestRefund(data),
    onSuccess: () => {
      toast.success('Refund request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit refund request');
    }
  });
}

export function useApproveRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNotes }) => refundService.approveRefund(id, { adminNotes }),
    onSuccess: () => {
      toast.success('Refund request approved');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve refund');
    }
  });
}

export function useRejectRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }) => refundService.rejectRefund(id, { rejectionReason }),
    onSuccess: () => {
      toast.success('Refund request rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject refund');
    }
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, speed }) => refundService.processRefund(id, { speed }),
    onSuccess: () => {
      toast.success('Refund processed successfully through gateway');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    }
  });
}

export function useRetryRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => refundService.retryRefund(id),
    onSuccess: () => {
      toast.success('Refund re-attempted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to retry refund');
    }
  });
}

export function useSystemIssueRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => refundService.systemIssueRefund(data),
    onSuccess: () => {
      toast.success('System refund issued and processed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to issue system refund');
    }
  });
}

export default {
  useRefunds,
  useAllRefunds,
  useRefund,
  useRefundStats,
  useRequestRefund,
  useApproveRefund,
  useRejectRefund,
  useProcessRefund,
  useRetryRefund,
  useSystemIssueRefund
};
