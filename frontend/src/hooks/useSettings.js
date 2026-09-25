import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import settingsService from '../services/settings.service.js';
import useAuthStore from '../store/auth.store.js';

export function useSettings(settingType) {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  return useQuery({
    queryKey: ['company-settings', companyId, settingType],
    queryFn: () => settingsService.getSettings(companyId, settingType),
    enabled: Boolean(companyId && settingType),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  return useMutation({
    mutationFn: ({ type, data }) => settingsService.updateSettings(companyId, type, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId, variables.type] });
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });
}

export function useResetSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  return useMutation({
    mutationFn: (settingType) => settingsService.resetSettings(companyId, settingType),
    onSuccess: (data, settingType) => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId, settingType] });
    },
  });
}

export function useSettingsSchema() {
  return useQuery({
    queryKey: ['company-settings-schema'],
    queryFn: () => settingsService.getSettingsSchema(),
  });
}

export default {
  useSettings,
  useUpdateSettings,
  useResetSettings,
  useSettingsSchema,
};
