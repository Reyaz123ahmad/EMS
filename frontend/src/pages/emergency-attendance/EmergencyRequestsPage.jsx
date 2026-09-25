import React, { useState } from 'react';
import { useEmergencyRequests, useApproveEmergency, useRejectEmergency, useBulkApproveEmergency } from '../../hooks/useEmergencyAttendance.js';
import EmergencyRequestCard from '../../components/emergency/EmergencyRequestCard.jsx';
import EmergencyApprovalModal from '../../components/emergency/EmergencyApprovalModal.jsx';
import { AlertCircle, CheckCheck, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function EmergencyRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('APPROVE');

  const { data: requests = [], isLoading } = useEmergencyRequests(
    statusFilter !== 'ALL' ? { status: statusFilter } : {}
  );
  const { mutateAsync: approveReq, isPending: isApproving } = useApproveEmergency();
  const { mutateAsync: rejectReq, isPending: isRejecting } = useRejectEmergency();
  const { mutateAsync: bulkApprove, isPending: isBulkApproving } = useBulkApproveEmergency();

  const handleOpenAction = (req, action) => {
    setSelectedRequest(req);
    setActionType(action);
  };

  const handleConfirmAction = async (requestId, action, notes) => {
    try {
      if (action === 'APPROVE') {
        await approveReq({ requestId, notes });
        toast.success('Emergency attendance approved');
      } else {
        await rejectReq({ requestId, reason: notes });
        toast.success('Emergency attendance rejected');
      }
      setSelectedRequest(null);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleBulkApprove = async () => {
    const pendingIds = requests.filter((r) => r.status === 'PENDING').map((r) => r.id);
    if (pendingIds.length === 0) {
      toast.info('No pending emergency requests to approve');
      return;
    }
    try {
      await bulkApprove(pendingIds);
      toast.success(`Approved ${pendingIds.length} requests in bulk`);
    } catch (err) {
      toast.error(err.message || 'Bulk approval failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Emergency Attendance Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and authorize off-site attendance and hardware failure exceptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={handleBulkApprove}
            disabled={isBulkApproving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Bulk Approve
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Requests Found</h3>
          <p className="text-xs text-slate-400">Emergency attendance requests will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <EmergencyRequestCard
              key={req.id}
              request={req}
              onApprove={(r) => handleOpenAction(r, 'APPROVE')}
              onReject={(r) => handleOpenAction(r, 'REJECT')}
            />
          ))}
        </div>
      )}

      <EmergencyApprovalModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        action={actionType}
        onConfirm={handleConfirmAction}
        isSubmitting={isApproving || isRejecting}
      />
    </div>
  );
}

export default EmergencyRequestsPage;
