import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import employeeService from '../services/employee.service.js';

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.getEmployees(params)
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployee(id),
    enabled: !!id
  });
}

export function useSendEmployeeOTP() {
  return useMutation({
    mutationFn: (data) => employeeService.sendEmployeeOTP(data)
  });
}

export function useVerifyEmployeeOTP() {
  return useMutation({
    mutationFn: (data) => employeeService.verifyEmployeeOTP(data)
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => employeeService.createEmployeeWithUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    }
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => employeeService.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    }
  });
}

export function useEmployeeDashboard(id) {
  return useQuery({
    queryKey: ['employee', id, 'dashboard'],
    queryFn: () => employeeService.getEmployeeDashboard(id),
    enabled: !!id
  });
}

export function useBulkImportEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => employeeService.bulkImportEmployees(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    }
  });
}

export function useExportEmployees() {
  return useMutation({
    mutationFn: (params) => employeeService.exportEmployees(params)
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => employeeService.getEmployeeStats()
  });
}

export function useEmployeeAnalytics(params = {}) {
  return useQuery({
    queryKey: ['employee-analytics', params],
    queryFn: () => employeeService.getEmployeeAnalytics(params)
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => employeeService.getRoles()
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => employeeService.updateEmployeeRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
}

export default {
  useEmployees,
  useEmployee,
  useSendEmployeeOTP,
  useVerifyEmployeeOTP,
  useCreateEmployee,
  useUpdateEmployee,
  useUpdateEmployeeRole,
  useDeleteEmployee,
  useEmployeeDashboard,
  useBulkImportEmployees,
  useExportEmployees,
  useEmployeeStats,
  useEmployeeAnalytics,
  useRoles
};
