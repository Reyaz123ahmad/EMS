import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import assetsService from '../services/assets.service.js';

export function useAssets(params = {}) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetsService.getAssets(params),
  });
}

export function useMyAssets() {
  return useQuery({
    queryKey: ['assets', 'my'],
    queryFn: () => assetsService.getMyAssets(),
  });
}

export function useAsset(id) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsService.getAssetById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => assetsService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => assetsService.updateAsset(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', variables.id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => assetsService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, data }) => assetsService.assignAsset(assetId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, data }) => assetsService.returnAsset(assetId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });
}

export function useAssetHistory(assetId) {
  return useQuery({
    queryKey: ['asset-history', assetId],
    queryFn: () => assetsService.getAssetHistory(assetId),
    enabled: Boolean(assetId),
  });
}

export function useEmployeeAssets(employeeId) {
  return useQuery({
    queryKey: ['employee-assets', employeeId],
    queryFn: () => assetsService.getEmployeeAssets(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: () => assetsService.getAssetStats(),
  });
}

export function useBulkImportAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => assetsService.bulkImportAssets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });
}

export function useExportAssets() {
  return useMutation({
    mutationFn: (params) => assetsService.exportAssets(params),
  });
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: () => assetsService.getAssetCategories(),
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => assetsService.createAssetCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
    },
  });
}

export default {
  useAssets,
  useMyAssets,
  useAsset,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAssignAsset,
  useReturnAsset,
  useAssetHistory,
  useEmployeeAssets,
  useAssetStats,
  useBulkImportAssets,
  useExportAssets,
  useAssetCategories,
  useCreateAssetCategory,
};
