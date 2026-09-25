import React, { useState } from 'react';
import { useApprovalHistory } from '../../hooks/useApprovals.js';
import ApprovalRequestCard from '../../components/approvals/ApprovalRequestCard.jsx';
import { History, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

export function ApprovalHistoryPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: history = [], isLoading } = useApprovalHistory(
    statusFilter ? { status: statusFilter } : {}
  );

  const handleExport = () => {
    toast.success('Exporting approval decision logs...');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Approval History & Decisions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Archived record of approved and rejected employee submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
          >
            <option value="">All Decisions</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <History className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Decision History</h3>
          <p className="text-xs text-slate-400">Past processed approvals will show here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((req) => (
            <ApprovalRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalHistoryPage;
