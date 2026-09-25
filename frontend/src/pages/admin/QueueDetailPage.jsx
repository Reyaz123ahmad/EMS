import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Cpu, Pause, Play, Trash2, Layers } from 'lucide-react';
import {
  useQueueJobs,
  useRetryJob,
  useRemoveJob,
  usePauseQueue,
  useResumeQueue,
  useCleanQueue,
} from '../../hooks/useQueueMonitor.js';
import JobTable from '../../components/admin/JobTable.jsx';
import JobDetailModal from '../../components/admin/JobDetailModal.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export function QueueDetailPage() {
  const { queue: queueName } = useParams();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  const {
    data: jobsRes,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQueueJobs(queueName, { status: statusFilter === 'all' ? undefined : statusFilter });

  const { mutate: retryJob, isPending: isRetrying } = useRetryJob();
  const { mutate: removeJob, isPending: isRemoving } = useRemoveJob();
  const { mutate: pauseQueue } = usePauseQueue();
  const { mutate: resumeQueue } = useResumeQueue();
  const { mutate: cleanQueue } = useCleanQueue();

  const jobs = jobsRes?.data?.jobs || jobsRes?.data || [];

  const handleRetry = (jobId) => {
    retryJob({ queueName, jobId });
  };

  const handleRemove = (jobId) => {
    removeJob({ queueName, jobId });
  };

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/queues')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="h-6 w-6 text-indigo-600" />
              {queueName}
            </h1>
            <p className="text-xs text-slate-500">Inspecting jobs and tasks in this queue</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetchJobs()} isLoading={isLoadingJobs}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pauseQueue(queueName)}
            title="Pause Queue"
          >
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resumeQueue(queueName)}
            title="Resume Queue"
          >
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => cleanQueue({ queueName, data: { grace: 0 } })}
            title="Clean All Finished"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clean
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'waiting', 'active', 'completed', 'failed', 'delayed', 'paused'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
              statusFilter === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      {isLoadingJobs ? (
        <div className="py-16 text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-xs text-slate-400">Loading jobs list...</p>
        </div>
      ) : (
        <JobTable
          jobs={jobs}
          onRetry={handleRetry}
          onRemove={handleRemove}
          onInspect={(job) => setSelectedJob(job)}
          isActioning={isRetrying || isRemoving}
        />
      )}

      {/* Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onRetry={(id) => {
            handleRetry(id);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}

export default QueueDetailPage;
