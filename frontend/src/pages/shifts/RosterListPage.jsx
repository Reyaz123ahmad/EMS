import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit, Trash2, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EditRosterModal from '../../components/shifts/EditRosterModal';
import rosterService from '../../services/roster.service.js';
import useAuthStore from '../../store/auth.store.js';
import { formatDate } from '../../utils/formatters';

export default function RosterListPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [deleteId, setDeleteId] = useState(null);
  const [editRoster, setEditRoster] = useState(null);

  const { data: rostersData, isLoading, refetch } = useQuery({
    queryKey: ['rosters', companyId, month, year],
    queryFn: () => rosterService.getRosters({
      companyId,
      month,
      year,
      page: 1,
      limit: 100
    })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rosterService.deleteRoster(id),
    onSuccess: () => {
      toast.success('Roster entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete roster entry');
      setDeleteId(null);
    }
  });

  const publishMutation = useMutation({
    mutationFn: (id) => rosterService.publishRoster(id),
    onSuccess: () => {
      toast.success('Roster published successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to publish roster');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rosterService.updateRoster(id, data),
    onSuccess: () => {
      toast.success('Roster updated successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      setEditRoster(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update roster');
    }
  });

  const rosters = Array.isArray(rostersData)
    ? rostersData
    : Array.isArray(rostersData?.rosters)
    ? rostersData.rosters
    : Array.isArray(rostersData?.data?.rosters)
    ? rostersData.data.rosters
    : Array.isArray(rostersData?.data?.data)
    ? rostersData.data.data
    : Array.isArray(rostersData?.data)
    ? rostersData.data
    : [];

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white">
            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {row.employee?.employeeCode || row.employee?.designation?.name || row.employee?.department?.name || 'Staff'}
          </div>
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
        <Badge variant={row.isPublished ? 'success' : 'warning'}>
          {row.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Dropdown
            align="right"
            width="w-44"
            trigger={
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            }
          >
            <Dropdown.Item
              icon={Eye}
              onClick={() => navigate(`/rosters/calendar?employeeId=${row.employeeId || row.employee?.id}`)}
            >
              View
            </Dropdown.Item>
            <Dropdown.Item
              icon={Edit}
              onClick={() => setEditRoster(row)}
            >
              Edit
            </Dropdown.Item>
            {!row.isPublished && (
              <Dropdown.Item
                icon={CheckCircle}
                onClick={() => publishMutation.mutate(row.id)}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Publish
              </Dropdown.Item>
            )}
            <Dropdown.Separator />
            <Dropdown.Item
              icon={Trash2}
              danger
              onClick={() => setDeleteId(row.id)}
            >
              Delete
            </Dropdown.Item>
          </Dropdown>
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
          <h3 className="text-lg font-bold text-white">Scheduled Roster Entries ({rosters.length})</h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {rosters.length === 0 && !isLoading ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-slate-400">No rosters found for this period.</p>
            <Button variant="primary" onClick={() => navigate('/rosters/generate')}>
              + Generate Roster
            </Button>
          </div>
        ) : (
          <Table columns={columns} data={rosters} isLoading={isLoading} />
        )}
      </Card>

      {/* Edit Modal */}
      {editRoster && (
        <EditRosterModal
          roster={editRoster}
          onClose={() => setEditRoster(null)}
          onSave={(data) => updateMutation.mutate({ id: editRoster.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Roster Entry"
        message="Are you sure you want to delete this roster entry? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
