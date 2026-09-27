import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import overtimeService from '../../services/overtime.service.js';
import { useAuthStore } from '../../store/authStore';
import { formatDate, formatDuration } from '../../utils/formatters';

export default function OvertimeRequestsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const [processingId, setProcessingId] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Fetch overtime requests
  const { data: requestsData, isLoading, refetch } = useQuery({
    queryKey: ['overtime-requests', companyId],
    queryFn: () => overtimeService.getRequests({ companyId }),
  });

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

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id) => overtimeService.approveOvertime(id),
    onMutate: (id) => {
      setProcessingId(id);
    },
    onSuccess: () => {
      toast.success('Overtime request approved');
      queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'records'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'stats'] });
      setIsReviewOpen(false);
      setSelectedReq(null);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to approve';
      const code = error.response?.data?.code;
      if (code === 'REQUEST_NOT_FOUND') {
        toast.error('Request not found. Please refresh the page.');
        queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      } else if (code === 'ALREADY_PROCESSED') {
        toast.error('This request has already been processed');
        queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      } else {
        toast.error(msg);
      }
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => overtimeService.rejectOvertime(id, reason),
    onMutate: ({ id }) => {
      setProcessingId(id);
    },
    onSuccess: () => {
      toast.success('Overtime request rejected');
      queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'records'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'stats'] });
      setRejectDialog(null);
      setRejectReason('');
      setIsReviewOpen(false);
      setSelectedReq(null);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to reject';
      const code = error.response?.data?.code;
      
      if (code === 'REQUEST_NOT_FOUND') {
        toast.error('Request not found. Please refresh the page.');
        queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      } else if (code === 'ALREADY_PROCESSED') {
        toast.error('This request has already been processed');
        queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      } else {
        toast.error(msg);
      }
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const handleApprove = (request) => {
    if (processingId) return;
    approveMutation.mutate(request.id);
  };

  const handleOpenRejectModal = (request) => {
    setRejectDialog(request);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectDialog || processingId) return;
    rejectMutation.mutate({
      id: rejectDialog.id,
      reason: rejectReason || 'Rejected by manager'
    });
  };

  const handleOpenReview = (req) => {
    setSelectedReq(req);
    setReviewRemarks(req.reason || '');
    setIsReviewOpen(true);
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white">
            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">{row.employee?.employeeCode || 'Staff'}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      cell: (row) => <span className="text-slate-200">{formatDate(row.date)}</span>,
    },
    {
      header: 'Hours Claimed',
      accessor: 'minutes',
      cell: (row) => {
        const mins = Number(row.minutes || row.requestedMinutes || 0);
        return (
          <span className="font-bold text-amber-400">
            {formatDuration(mins)}
          </span>
        );
      },
    },
    {
      header: 'Reason',
      accessor: 'reason',
      cell: (row) => <p className="text-xs text-slate-300 max-w-xs truncate">{row.reason || 'N/A'}</p>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => {
        const isCurrentPending = row.status === 'PENDING';
        const isThisProcessing = processingId === row.id;

        if (!isCurrentPending) {
          return (
            <span className="text-xs text-slate-500 font-medium">Processed</span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleApprove(row)}
              disabled={!!processingId}
            >
              {isThisProcessing && approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleOpenRejectModal(row)}
              disabled={!!processingId}
            >
              {isThisProcessing && rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Overtime Requests</h1>
          <p className="text-sm text-slate-400">Review and manage overtime approval requests</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <Table columns={columns} data={requests} isLoading={isLoading} />
      </Card>

      {/* Reject Modal */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-white">Reject Overtime Request</h3>
            <p className="text-sm text-slate-400">
              Rejecting request for{' '}
              <span className="text-white font-medium">
                {rejectDialog.employee?.firstName} {rejectDialog.employee?.lastName}
              </span>{' '}
              ({formatDate(rejectDialog.date)})
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setRejectDialog(null)}
                disabled={!!processingId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmReject}
                disabled={!!processingId}
              >
                {processingId === rejectDialog.id && rejectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Confirm Reject'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
