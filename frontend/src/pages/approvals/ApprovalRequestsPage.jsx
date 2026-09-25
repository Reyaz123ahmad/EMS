import React, { useState } from 'react';
import { usePendingApprovals, useActOnRequest } from '../../hooks/useApprovals.js';
import ApprovalRequestCard from '../../components/approvals/ApprovalRequestCard.jsx';
import ApprovalActionModal from '../../components/approvals/ApprovalActionModal.jsx';
import { CheckCircle2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function ApprovalRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('APPROVE');
  const [filterType, setFilterType] = useState('ALL');

  const { data: requests = [], isLoading } = usePendingApprovals(
    filterType !== 'ALL' ? { entityType: filterType } : {}
  );
  const { mutateAsync: actOnReq, isPending: isActing } = useActOnRequest();

  const handleOpenAction = (req, action) => {
    setSelectedRequest(req);
    setActionType(action);
  };

  const handleConfirmAction = async (requestId, action, notes) => {
    try {
      await actOnReq({ requestId, action, notes });
      toast.success(`Request ${action.toLowerCase()}ed successfully`);
      setSelectedRequest(null);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Pending Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Requests awaiting your review and authorization at your tier level.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
          >
            <option value="ALL">All Categories</option>
            <option value="LEAVE">Leave</option>
            <option value="OVERTIME">Overtime</option>
            <option value="EXPENSE">Expense</option>
            <option value="ATTENDANCE">Emergency Attendance</option>
            <option value="ASSET">Asset</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Inbox Zero</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have no pending requests awaiting approval right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <ApprovalRequestCard
              key={req.id}
              request={req}
              onAction={handleOpenAction}
            />
          ))}
        </div>
      )}

      <ApprovalActionModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        action={actionType}
        onConfirm={handleConfirmAction}
        isSubmitting={isActing}
      />
    </div>
  );
}

export default ApprovalRequestsPage;
