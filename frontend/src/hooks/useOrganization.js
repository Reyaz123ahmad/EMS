import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import organizationService from '../services/organization.service.js';

// Branches
export function useBranches(params = {}) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: () => organizationService.getBranches(params)
  });
}

export function useBranch(id) {
  return useQuery({
    queryKey: ['branch', id],
    queryFn: () => organizationService.getBranch(id),
    enabled: !!id
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => organizationService.createBranch(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] })
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => organizationService.updateBranch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    }
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => organizationService.deleteBranch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] })
  });
}

export function useBulkImportBranches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => organizationService.bulkImportBranches(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] })
  });
}

export function useExportBranches() {
  return useMutation({
    mutationFn: (params) => organizationService.exportBranches(params)
  });
}

// Departments
export function useDepartments(params = {}) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () => organizationService.getDepartments(params)
  });
}

export function useDepartment(id) {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => organizationService.getDepartment(id),
    enabled: !!id
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => organizationService.createDepartment(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => organizationService.updateDepartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    }
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => organizationService.deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });
}

export function useBulkImportDepartments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => organizationService.bulkImportDepartments(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });
}

export function useExportDepartments() {
  return useMutation({
    mutationFn: (params) => organizationService.exportDepartments(params)
  });
}

// Designations
export function useDesignations(params = {}) {
  return useQuery({
    queryKey: ['designations', params],
    queryFn: () => organizationService.getDesignations(params)
  });
}

export function useDesignation(id) {
  return useQuery({
    queryKey: ['designation', id],
    queryFn: () => organizationService.getDesignation(id),
    enabled: !!id
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => organizationService.createDesignation(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] })
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => organizationService.updateDesignation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['designation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    }
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => organizationService.deleteDesignation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] })
  });
}

export function useBulkImportDesignations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => organizationService.bulkImportDesignations(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] })
  });
}

export function useExportDesignations() {
  return useMutation({
    mutationFn: (params) => organizationService.exportDesignations(params)
  });
}

export default {
  useBranches,
  useBranch,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  useBulkImportBranches,
  useExportBranches,
  useDepartments,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useBulkImportDepartments,
  useExportDepartments,
  useDesignations,
  useDesignation,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
  useBulkImportDesignations,
  useExportDesignations
};
