import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useMyLeaveRequests, useCancelLeave } from '../../hooks/useLeave';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export default function MyLeavePage() {
  const { data: requestsData, isLoading, refetch } = useMyLeaveRequests();
  const cancelLeaveMutation = useCancelLeave();

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    requestId: null,
    reason: '',
  });
  const [toastMessage, setToastMessage] = useState('');

  const requests = Array.isArray(requestsData)
    ? requestsData
    : Array.isArray(requestsData?.requests)
    ? requestsData.requests
    : Array.isArray(requestsData?.data?.requests)
    ? requestsData.data.requests
    : Array.isArray(requestsData?.data?.data)
    ? requestsData.data.data
    : Array.isArray(requestsData?.data)
    ? requestsData.data
    : [];

  const handleConfirmCancel = async () => {
    if (!cancelModal.requestId) return;
    try {
      await cancelLeaveMutation.mutateAsync({
        id: cancelModal.requestId,
        reason: cancelModal.reason,
      });
      setToastMessage('Leave request cancelled successfully.');
      setCancelModal({ isOpen: false, requestId: null, reason: '' });
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel leave request');
    }
  };

  const columns = [
    {
      header: 'Leave Type',
      accessor: 'leaveType',
      cell: (row) => <Badge variant="primary">{row.leaveType?.name || 'General'}</Badge>,
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
      cell: (row) => <span className="text-slate-200">{formatDate(row.startDate)}</span>,
    },
    {
      header: 'End Date',
      accessor: 'endDate',
      cell: (row) => <span className="text-slate-200">{formatDate(row.endDate)}</span>,
    },
    {
      header: 'Duration',
      accessor: 'totalDays',
      cell: (row) => {
        const count = row.totalDays !== undefined ? row.totalDays : (row.days !== undefined ? row.days : 1);
        return (
          <span className="font-semibold text-slate-100">
            {count} {count === 1 ? 'day' : 'days'}
          </span>
        );
      },
    },
    {
      header: 'Reason',
      accessor: 'reason',
      cell: (row) => (
        <span className="text-xs text-slate-400 italic max-w-xs truncate block">
          {row.reason || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' || row.status === 'CANCELLED' ? 'danger' : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Applied On',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-slate-400">
          {row.createdAt ? formatDate(row.createdAt) : '-'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => {
        if (row.status === 'PENDING') {
          return (
            <button
              onClick={() => setCancelModal({ isOpen: true, requestId: row.id, reason: '' })}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              Cancel
            </button>
          );
        }
        return <span className="text-xs text-slate-500">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
          ✓ {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Leave Requests</h1>
          <p className="text-sm text-slate-400">Track and view the status of your applied leaves</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leave/apply">
            <Button variant="primary" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Apply Leave
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <Table columns={columns} data={requests} isLoading={isLoading} />
      </Card>

      {/* Cancel Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Cancel Leave Request</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows="3"
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Why are you cancelling this request?"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                disabled={cancelLeaveMutation.isPending}
                onClick={() => setCancelModal({ isOpen: false, requestId: null, reason: '' })}
              >
                Keep Request
              </Button>
              <Button
                variant="danger"
                loading={cancelLeaveMutation.isPending}
                onClick={handleConfirmCancel}
              >
                Cancel Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
