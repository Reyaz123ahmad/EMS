import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import OvertimeApprovalModal from '../../components/overtime/OvertimeApprovalModal';
import {
  useOvertimeRequests,
  useApproveOvertime,
  useRejectOvertime,
  useBulkApproveOvertime,
} from '../../hooks/useOvertime';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';

export default function OvertimeRequestsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const [selectedReq, setSelectedReq] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: requestsData, isLoading, refetch } = useOvertimeRequests({
    companyId,
  });

  const approveOt = useApproveOvertime();
  const rejectOt = useRejectOvertime();
  const bulkApprove = useBulkApproveOvertime();

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

  const handleOpenReview = (req) => {
    setSelectedReq(req);
    setIsModalOpen(true);
  };

  const handleApprove = async (id, remarks) => {
    await approveOt.mutateAsync({ id, approvedBy: user?.id, remarks });
    setIsModalOpen(false);
    refetch();
  };

  const handleReject = async (id, remarks) => {
    await rejectOt.mutateAsync({ id, rejectedBy: user?.id, remarks });
    setIsModalOpen(false);
    refetch();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await bulkApprove.mutateAsync({
      requestIds: selectedIds,
      approvedBy: user?.id,
    });
    setSelectedIds([]);
    refetch();
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(requests.map((r) => r.id));
            } else {
              setSelectedIds([]);
            }
          }}
          checked={selectedIds.length > 0 && selectedIds.length === requests.length}
          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
        />
      ),
      accessor: 'select',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => {
            if (selectedIds.includes(row.id)) {
              setSelectedIds(selectedIds.filter((id) => id !== row.id));
            } else {
              setSelectedIds([...selectedIds, row.id]);
            }
          }}
          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
        />
      ),
    },
    {
      header: 'Employee',
      accessor: 'employee',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white">
            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">{row.employee?.designation?.title || 'Staff'}</div>
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
      cell: (row) => (
        <span className="font-bold text-amber-400">
          {(row.minutes / 60).toFixed(1)} hrs ({row.minutes}m)
        </span>
      ),
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
      header: 'Action',
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenReview(row)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Overtime Approval Requests</h1>
          <p className="text-sm text-slate-400">Approve or reject employee overtime hours before payroll closing</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <Button variant="success" onClick={handleBulkApprove} loading={bulkApprove.isPending}>
              Approve Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <Table columns={columns} data={requests} isLoading={isLoading} />
      </Card>

      <OvertimeApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedReq}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={approveOt.isPending || rejectOt.isPending}
      />
    </div>
  );
}
