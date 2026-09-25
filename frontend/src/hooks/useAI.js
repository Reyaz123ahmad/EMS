import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import aiService from '../services/ai.service';

export const useAIUsageStats = () => {
  return useQuery({
    queryKey: ['ai-usage-stats'],
    queryFn: () => aiService.getUsageStats(),
    refetchInterval: 30000 // Polling every 30 seconds
  });
};

export const useAICompanyAnalytics = (period = 'current_month') => {
  return useQuery({
    queryKey: ['ai-company-analytics', period],
    queryFn: () => aiService.getCompanyAnalytics(period),
    staleTime: 1000 * 60 * 30 // 30 min client cache
  });
};

export const useAIPlatformAnalytics = (period = 'monthly') => {
  return useQuery({
    queryKey: ['ai-platform-analytics', period],
    queryFn: () => aiService.getPlatformAnalytics(period),
    staleTime: 1000 * 60 * 30
  });
};

export const useAIAttendancePrediction = (month = 'next_month') => {
  return useQuery({
    queryKey: ['ai-attendance-prediction', month],
    queryFn: () => aiService.getAttendancePrediction(month),
    staleTime: 1000 * 60 * 60
  });
};

export const useAIAnomalies = (dataType = 'ATTENDANCE_AND_PAYROLL') => {
  return useQuery({
    queryKey: ['ai-anomalies', dataType],
    queryFn: () => aiService.getAnomalyDetection(dataType),
    staleTime: 1000 * 60 * 15
  });
};

export const useAIBusinessRecommendations = () => {
  return useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => aiService.getBusinessRecommendations(),
    staleTime: 1000 * 60 * 60
  });
};

export const useAIEmployeePerformance = (employeeId, period = 'current') => {
  return useQuery({
    queryKey: ['ai-employee-performance', employeeId, period],
    queryFn: () => aiService.getEmployeePerformance(employeeId, period),
    enabled: Boolean(employeeId),
    staleTime: 1000 * 60 * 60
  });
};

export const useAIEmployeeImprovement = (employeeId) => {
  return useQuery({
    queryKey: ['ai-employee-improvement', employeeId],
    queryFn: () => aiService.getEmployeeImprovementPlan(employeeId),
    enabled: Boolean(employeeId),
    staleTime: 1000 * 60 * 60
  });
};

export const useAIAttritionPrediction = (employeeId) => {
  return useQuery({
    queryKey: ['ai-attrition-prediction', employeeId],
    queryFn: () => aiService.getAttritionPrediction(employeeId),
    enabled: Boolean(employeeId),
    staleTime: 1000 * 60 * 60
  });
};

export const useAIChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, sessionId, context }) => aiService.chat({ message, sessionId, context }),
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Failed to get AI response';
      toast.error(msg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage-stats'] });
    }
  });
};

export default {
  useAIUsageStats,
  useAICompanyAnalytics,
  useAIPlatformAnalytics,
  useAIAttendancePrediction,
  useAIAnomalies,
  useAIBusinessRecommendations,
  useAIEmployeePerformance,
  useAIEmployeeImprovement,
  useAIAttritionPrediction,
  useAIChat
};
