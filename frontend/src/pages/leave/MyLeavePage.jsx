import React from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useMyLeaveRequests } from '../../hooks/useLeave';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export default function MyLeavePage() {
  const { data: requestsData, isLoading, refetch } = useMyLeaveRequests();

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
            row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'
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
  ];

  return (
    <div className="space-y-6">
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
    </div>
  );
}
