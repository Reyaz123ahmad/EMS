import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import payrollService from '../services/payroll.service.js';

export function useSalaryComponents() {
  return useQuery({
    queryKey: ['payroll', 'components'],
    queryFn: () => payrollService.getSalaryComponents()
  });
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => payrollService.createSalaryComponent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'components'] });
    }
  });
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollService.updateSalaryComponent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'components'] });
    }
  });
}

export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollService.deleteSalaryComponent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'components'] });
    }
  });
}

export function useEmployeeSalaryStructure(employeeId) {
  return useQuery({
    queryKey: ['payroll', 'structure', employeeId],
    queryFn: () => payrollService.getEmployeeSalaryStructure(employeeId),
    enabled: !!employeeId
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => payrollService.updateEmployeeSalaryStructure(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'structure', variables.employeeId] });
    }
  });
}

export function useBulkUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => payrollService.bulkUpdateSalaryStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'structure'] });
    }
  });
}

export function usePreviewPayroll() {
  return useMutation({
    mutationFn: (data) => payrollService.previewPayroll(data)
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => payrollService.processPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'slips'] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'stats'] });
    }
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollService.approvePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'stats'] });
    }
  });
}

export function usePayrollRuns(params = {}) {
  return useQuery({
    queryKey: ['payroll', 'runs', params],
    queryFn: () => payrollService.getPayrollRuns(params)
  });
}

export function usePayrollDetail(id) {
  return useQuery({
    queryKey: ['payroll', 'runs', id],
    queryFn: () => payrollService.getPayrollRunDetail(id),
    enabled: !!id
  });
}

export function useSalarySlips(params = {}) {
  return useQuery({
    queryKey: ['payroll', 'slips', params],
    queryFn: () => payrollService.getSalarySlips(params)
  });
}

export function usePayrollStats(params = {}) {
  return useQuery({
    queryKey: ['payroll', 'stats', params],
    queryFn: () => payrollService.getStats(params)
  });
}

export default {
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useDeleteSalaryComponent,
  useEmployeeSalaryStructure,
  useUpdateSalaryStructure,
  useBulkUpdateSalaryStructure,
  usePreviewPayroll,
  useProcessPayroll,
  useApprovePayroll,
  usePayrollRuns,
  usePayrollDetail,
  useSalarySlips,
  usePayrollStats
};
