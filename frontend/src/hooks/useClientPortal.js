import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientPortalService from '../services/client-portal.service.js';
import { toast } from 'sonner';

export function useClientDashboard() {
  return useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => clientPortalService.getDashboard(),
  });
}

export function useClientProjects(params = {}) {
  return useQuery({
    queryKey: ['client-projects', params],
    queryFn: () => clientPortalService.getProjects(params),
  });
}

export function useClientProjectDetail(id) {
  return useQuery({
    queryKey: ['client-project', id],
    queryFn: () => clientPortalService.getProjectDetail(id),
    enabled: Boolean(id),
  });
}

export function useCreateRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => clientPortalService.createRequirement(data),
    onSuccess: () => {
      toast.success('Requirement submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['client-project'] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit requirement');
    }
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => clientPortalService.addComment(data),
    onSuccess: () => {
      toast.success('Comment posted successfully');
      queryClient.invalidateQueries({ queryKey: ['client-project'] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    }
  });
}

export function useClientInvoices(params = {}) {
  return useQuery({
    queryKey: ['client-invoices', params],
    queryFn: () => clientPortalService.getInvoices(params),
  });
}

export function useClientPayments(params = {}) {
  return useQuery({
    queryKey: ['client-payments', params],
    queryFn: () => clientPortalService.getPayments(params),
  });
}

export default {
  useClientDashboard,
  useClientProjects,
  useClientProjectDetail,
  useCreateRequirement,
  useAddComment,
  useClientInvoices,
  useClientPayments
};
