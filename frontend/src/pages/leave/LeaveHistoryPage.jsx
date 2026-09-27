import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useEmployeeLeaveHistory } from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';

export default function LeaveHistoryPage() {
  const { user } = useAuthStore();
  const employeeId = user?.employeeId || user?.id;

  const { data: historyData, isLoading, refetch } = useEmployeeLeaveHistory(employeeId);
  const history = Array.isArray(historyData)
    ? historyData
    : Array.isArray(historyData?.leaves)
    ? historyData.leaves
    : Array.isArray(historyData?.history)
    ? historyData.history
    : Array.isArray(historyData?.data?.leaves)
    ? historyData.data.leaves
    : Array.isArray(historyData?.data?.history)
    ? historyData.data.history
    : Array.isArray(historyData?.data?.data)
    ? historyData.data.data
    : Array.isArray(historyData?.data)
    ? historyData.data
    : [];

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
      accessor: 'days',
      cell: (row) => (
        <span className="font-semibold text-slate-100">
          {row.days} {row.days === 1 ? 'day' : 'days'}
        </span>
      ),
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
            row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      cell: (row) => (
        <span className="text-xs text-slate-400">
          {row.remarks || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Leave History</h1>
          <p className="text-sm text-slate-400">View personal past and upcoming time-off records</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <Table columns={columns} data={history} isLoading={isLoading} />
      </Card>
    </div>
  );
}
