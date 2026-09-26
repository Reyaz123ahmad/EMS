import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import LeaveApprovalModal from '../../components/leave/LeaveApprovalModal';
import {
  useLeaveRequests,
  useApproveLeave,
  useRejectLeave,
  useBulkApproveLeave,
} from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';

export default function LeaveRequestsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: requestsData, isLoading, refetch } = useLeaveRequests({
    companyId,
    status: statusFilter || undefined,
  });

  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const bulkApprove = useBulkApproveLeave();

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

  const filteredRequests = Array.isArray(requests)
    ? requests.filter((r) => {
        if (!r) return false;
        const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
        const typeName = (r.leaveType?.name || '').toLowerCase();
        return empName.includes(search.toLowerCase()) || typeName.includes(search.toLowerCase());
      })
    : [];

  const handleOpenReview = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleApprove = async (id, remarks) => {
    await approveLeave.mutateAsync({ id, approvedBy: user?.id, remarks });
    setIsModalOpen(false);
    refetch();
  };

  const handleReject = async (id, remarks) => {
    await rejectLeave.mutateAsync({ id, rejectedBy: user?.id, remarks });
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRequests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={selectedIds.length > 0 && selectedIds.length === filteredRequests.length}
          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
        />
      ),
      accessor: 'select',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => handleToggleSelect(row.id)}
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
          <div className="text-xs text-slate-400">{row.employee?.department?.name || 'Department'}</div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'leaveType',
      cell: (row) => <Badge variant="primary">{row.leaveType?.name || 'General'}</Badge>,
    },
    {
      header: 'Dates',
      accessor: 'startDate',
      cell: (row) => (
        <div className="text-xs">
          <div className="text-slate-200">
            {formatDate(row.startDate)} → {formatDate(row.endDate)}
          </div>
          <div className="text-slate-400 font-medium">
            {row.days} {row.days === 1 ? 'day' : 'days'}
          </div>
        </div>
      ),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      cell: (row) => (
        <p className="text-xs text-slate-300 max-w-xs truncate" title={row.reason}>
          {row.reason || 'No reason specified'}
        </p>
      ),
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
          <h1 className="text-2xl font-bold text-white">Leave Requests</h1>
          <p className="text-sm text-slate-400">Review, approve, and manage employee time-off requests</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="success"
              onClick={handleBulkApprove}
              loading={bulkApprove.isPending}
            >
              Approve Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
          <Input
            placeholder="Search employee or leave type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <Table columns={columns} data={filteredRequests} isLoading={isLoading} />
      </Card>

      <LeaveApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={approveLeave.isPending || rejectLeave.isPending}
      />
    </div>
  );
}
