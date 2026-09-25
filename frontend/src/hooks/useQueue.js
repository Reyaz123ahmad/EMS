import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import queueService from '../services/queue.service.js';
import { toast } from 'sonner';

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => queueService.getQueueStats(),
    refetchInterval: 10000 // Refresh every 10s
  });
}

export function useQueueJobs(queueName, status = 'all') {
  return useQuery({
    queryKey: ['queue-jobs', queueName, status],
    queryFn: () => queueService.getQueueJobs(queueName, status),
    enabled: !!queueName,
    refetchInterval: 15000
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queueName, jobId }) => queueService.retryJob(queueName, jobId),
    onSuccess: (_, variables) => {
      toast.success(`Job ${variables.jobId} submitted for retry`);
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-jobs', variables.queueName] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to retry job');
    }
  });
}

export default {
  useQueueStats,
  useQueueJobs,
  useRetryJob
};
