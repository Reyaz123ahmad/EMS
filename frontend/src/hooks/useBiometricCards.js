import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { biometricCardsService } from '../services/biometric-cards.service';

export function useCards(params = {}) {
  return useQuery({
    queryKey: ['biometric-cards', params],
    queryFn: () => biometricCardsService.listCards(params)
  });
}

export function useCardByEmployee(employeeId) {
  return useQuery({
    queryKey: ['biometric-card-employee', employeeId],
    queryFn: () => biometricCardsService.getCardByEmployee(employeeId),
    enabled: Boolean(employeeId)
  });
}

export function useGenerateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => biometricCardsService.generateCard(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Employee card generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['biometric-cards'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate employee card');
    }
  });
}

export function useAssignCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => biometricCardsService.assignCard(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Card assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['biometric-cards'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to assign card');
    }
  });
}

export function useRegenerateQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId) => biometricCardsService.regenerateQR(cardId),
    onSuccess: (data) => {
      toast.success(data?.message || 'QR code regenerated successfully!');
      queryClient.invalidateQueries({ queryKey: ['biometric-cards'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to regenerate QR code');
    }
  });
}

export function useDeactivateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, reason }) => biometricCardsService.deactivateCard(cardId, reason),
    onSuccess: (data) => {
      toast.success(data?.message || 'Card deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['biometric-cards'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate card');
    }
  });
}

export function useVerifyQR() {
  return useMutation({
    mutationFn: (qrData) => biometricCardsService.verifyQR(qrData)
  });
}
