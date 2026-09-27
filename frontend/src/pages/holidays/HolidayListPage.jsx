import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import HolidayForm from '../../components/holidays/HolidayForm';
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  useHolidayCalendars,
} from '../../hooks/useHolidays';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

export default function HolidayListPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: calendarsData } = useHolidayCalendars(companyId);
  const defaultCalendar = calendarsData?.data?.data?.[0];

  const { data: holidaysData, isLoading, refetch } = useHolidays({
    companyId,
    year,
  });

  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const holidays = Array.isArray(holidaysData)
    ? holidaysData
    : Array.isArray(holidaysData?.holidays)
    ? holidaysData.holidays
    : Array.isArray(holidaysData?.data?.holidays)
    ? holidaysData.data.holidays
    : Array.isArray(holidaysData?.data?.data)
    ? holidaysData.data.data
    : Array.isArray(holidaysData?.data)
    ? holidaysData.data
    : [];

  const handleOpenAdd = () => {
    setSelectedHoliday(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h) => {
    setSelectedHoliday(h);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (selectedHoliday) {
      await updateHoliday.mutateAsync({ id: selectedHoliday.id, data: formData });
    } else {
      await createHoliday.mutateAsync({
        companyId,
        calendarId: defaultCalendar?.id,
        ...formData,
      });
    }
    setIsModalOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteHoliday.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  const columns = [
    {
      header: 'Holiday Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white">{row.name}</div>
          <div className="text-xs text-slate-400">{row.description || 'General Holiday'}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      cell: (row) => <span className="text-slate-200 font-medium">{formatDate(row.date)}</span>,
    },
    {
      header: 'Day of Week',
      accessor: 'dayOfWeek',
      cell: (row) => (
        <span className="text-slate-300">
          {new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'isOptional',
      cell: (row) => (
        <Badge variant={row.isOptional ? 'warning' : 'primary'}>
          {row.isOptional ? 'Floating / Optional' : 'Mandatory'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteId(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Holiday List</h1>
          <p className="text-sm text-slate-400">Manage all recognized company holidays</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/holidays')}>
            Calendar View
          </Button>
          <Button variant="primary" onClick={handleOpenAdd}>
            + Add Holiday
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <Table columns={columns} data={holidays} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedHoliday ? 'Edit Holiday' : 'Create Holiday'}
      >
        <HolidayForm
          initialData={selectedHoliday}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createHoliday.isPending || updateHoliday.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday?"
      />
    </div>
  );
}
