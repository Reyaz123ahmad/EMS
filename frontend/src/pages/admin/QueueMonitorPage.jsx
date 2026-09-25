import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, RefreshCw, Activity, Layers, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useQueueStats, useQueueHealth, usePauseQueue, useResumeQueue, useCleanQueue } from '../../hooks/useQueueMonitor.js';
import QueueStatsCard from '../../components/admin/QueueStatsCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export function QueueMonitorPage() {
  const navigate = useNavigate();
  const { data: statsRes, isLoading: isLoadingStats, refetch: refetchStats } = useQueueStats();
  const { data: healthRes, isLoading: isLoadingHealth, refetch: refetchHealth } = useQueueHealth();
  const { mutate: pauseQueue } = usePauseQueue();
  const { mutate: resumeQueue } = useResumeQueue();
  const { mutate: cleanQueue } = useCleanQueue();

  const queues = statsRes?.data?.queues || statsRes?.data || [];
  const health = healthRes?.data || { status: 'healthy', memory: {} };

  const handleRefresh = () => {
    refetchStats();
    refetchHealth();
  };

  const totalWaiting = queues.reduce((acc, q) => acc + (q.waiting || 0), 0);
  const totalActive = queues.reduce((acc, q) => acc + (q.active || 0), 0);
  const totalCompleted = queues.reduce((acc, q) => acc + (q.completed || 0), 0);
  const totalFailed = queues.reduce((acc, q) => acc + (q.failed || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-indigo-600" />
            Background Queue Monitor
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time BullMQ background asynchronous job processing and worker pipelines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleRefresh} isLoading={isLoadingStats || isLoadingHealth}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health and Aggregation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">System Health</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 capitalize">
              {health.status || 'OK'}
            </span>
            <span className="text-xs text-slate-400">Redis Connected</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Jobs</span>
            <Activity className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-600">{totalActive}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Waiting / Delayed</span>
            <Layers className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-amber-600">{totalWaiting}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Failed Total</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600">{totalFailed}</div>
        </div>
      </div>

      {/* Queue Cards Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">All Active Queues</h2>
        {isLoadingStats ? (
          <div className="py-12 text-center">
            <Spinner size="lg" />
            <p className="mt-2 text-xs text-slate-400">Loading BullMQ queues status...</p>
          </div>
        ) : queues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-400">
            No registered background queues found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map((q) => (
              <QueueStatsCard
                key={q.name}
                queue={q}
                onPause={(name) => pauseQueue(name)}
                onResume={(name) => resumeQueue(name)}
                onClean={(name) => cleanQueue({ queueName: name, data: { grace: 0 } })}
                onClick={() => navigate(`/admin/queues/${q.name}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueMonitorPage;
