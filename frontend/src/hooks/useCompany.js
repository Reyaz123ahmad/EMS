import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import companyService from '../services/company.service.js';

export function useCompanies(params = {}) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyService.getCompanies(params)
  });
}

export function useCompany(id) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompany(id),
    enabled: !!id
  });
}

export function useSendCompanyOTP() {
  return useMutation({
    mutationFn: (data) => companyService.sendCompanyOTP(data)
  });
}

export function useVerifyCompanyOTP() {
  return useMutation({
    mutationFn: (data) => companyService.verifyCompanyOTP(data)
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => companyService.createCompanyWithAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    }
  });
}

export function useCompanySettings(id) {
  return useQuery({
    queryKey: ['company', id, 'settings'],
    queryFn: () => companyService.getCompanySettings(id),
    enabled: !!id
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, settingsType, settingsData }) =>
      companyService.updateCompanySettings(id, settingsType, settingsData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.id, 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    }
  });
}

export function useCompanyDashboard(id) {
  return useQuery({
    queryKey: ['company', id, 'dashboard'],
    queryFn: () => companyService.getCompanyDashboard(id),
    enabled: !!id
  });
}

export function useCompanyStats() {
  return useQuery({
    queryKey: ['company-stats'],
    queryFn: () => companyService.getCompanyStats()
  });
}

export function useCompanyAnalytics(params = {}) {
  return useQuery({
    queryKey: ['company-analytics', params],
    queryFn: () => companyService.getCompanyAnalytics(params)
  });
}

export default {
  useCompanies,
  useCompany,
  useSendCompanyOTP,
  useVerifyCompanyOTP,
  useCreateCompany,
  useCompanySettings,
  useUpdateCompanySettings,
  useCompanyDashboard,
  useCompanyStats,
  useCompanyAnalytics
};
