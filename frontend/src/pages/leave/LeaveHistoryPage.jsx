import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useMyLeaveRequests, useLeaveHistory } from '../../hooks/useLeave';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export default function LeaveHistoryPage() {
  const { data: myRequestsData, isLoading: loadingMy, refetch: refetchMy } = useMyLeaveRequests();
  const { data: historyData, isLoading: loadingHist, refetch: refetchHist } = useLeaveHistory();

  const isLoading = loadingMy && loadingHist;

  const raw = myRequestsData || historyData;
  const history = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.requests)
    ? raw.requests
    : Array.isArray(raw?.leaves)
    ? raw.leaves
    : Array.isArray(raw?.history)
    ? raw.history
    : Array.isArray(raw?.data?.requests)
    ? raw.data.requests
    : Array.isArray(raw?.data?.leaves)
    ? raw.data.leaves
    : Array.isArray(raw?.data?.data)
    ? raw.data.data
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  const handleRefresh = () => {
    refetchMy();
    refetchHist();
  };

  const columns = [
    {
      header: 'Leave Type',
      accessor: 'leaveType',
      cell: (row) => (
        <div>
          <Badge variant="primary">{row.leaveType?.name || 'General Leave'}</Badge>
          {row.leaveType?.code && (
            <span className="text-[11px] text-slate-400 block font-mono mt-0.5">{row.leaveType.code}</span>
          )}
        </div>
      ),
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
        <span className="text-xs text-slate-300 italic max-w-xs truncate block">
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
          {row.status || 'PENDING'}
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Leave History</h1>
          <p className="text-sm text-slate-400">View personal past, pending, and approved leave records</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leave/apply">
            <Button variant="primary" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Apply Leave
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <Table columns={columns} data={history} isLoading={isLoading} />
      </Card>
    </div>
  );
}
