import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useRosters, usePublishRoster } from '../../hooks/useShifts';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

export default function RosterListPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: rostersData, isLoading, refetch } = useRosters({
    companyId,
    month,
    year,
  });

  const publishRoster = usePublishRoster();

  const rosters = rostersData?.data?.data || rostersData?.data || [];

  const handlePublish = async (id) => {
    await publishRoster.mutateAsync({ rosterId: id, publishedBy: user?.id });
    refetch();
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
      header: 'Assigned Shift',
      accessor: 'shift',
      cell: (row) => (
        <Badge variant="primary">
          {row.shift?.name || 'Standard'} ({row.shift?.startTime} - {row.shift?.endTime})
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'PUBLISHED' ? 'success' : 'warning'}>
          {row.status || 'DRAFT'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex gap-2">
          {row.status !== 'PUBLISHED' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handlePublish(row.id)}
              loading={publishRoster.isPending}
            >
              Publish
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shift Rosters & Rotations</h1>
          <p className="text-sm text-slate-400">Manage monthly shift schedules and employee rotations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/rosters/calendar')}>
            Calendar View
          </Button>
          <Button variant="primary" onClick={() => navigate('/rosters/generate')}>
            + Generate Roster
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Scheduled Roster Entries</h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
        <Table columns={columns} data={rosters} isLoading={isLoading} />
      </Card>
    </div>
  );
}
