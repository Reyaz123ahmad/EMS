import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import queueMonitorService from '../services/queue-monitor.service.js';

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => queueMonitorService.getQueueStats(),
    refetchInterval: 30000,
  });
}

export function useQueueHealth() {
  return useQuery({
    queryKey: ['queue-health'],
    queryFn: () => queueMonitorService.getQueueHealth(),
    refetchInterval: 30000,
  });
}

export function useQueueJobs(queueName, params = {}) {
  return useQuery({
    queryKey: ['queue-jobs', queueName, params],
    queryFn: () => queueMonitorService.getQueueJobs(queueName, params),
    enabled: Boolean(queueName),
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queueName, jobId }) => queueMonitorService.retryJob(queueName, jobId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs', variables.queueName] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
}

export function useRemoveJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queueName, jobId }) => queueMonitorService.removeJob(queueName, jobId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs', variables.queueName] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
}

export function usePauseQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName) => queueMonitorService.pauseQueue(queueName),
    onSuccess: (data, queueName) => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-jobs', queueName] });
    },
  });
}

export function useResumeQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName) => queueMonitorService.resumeQueue(queueName),
    onSuccess: (data, queueName) => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-jobs', queueName] });
    },
  });
}

export function useCleanQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queueName, data }) => queueMonitorService.cleanQueue(queueName, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs', variables.queueName] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
}

export default {
  useQueueStats,
  useQueueHealth,
  useQueueJobs,
  useRetryJob,
  useRemoveJob,
  usePauseQueue,
  useResumeQueue,
  useCleanQueue,
};
