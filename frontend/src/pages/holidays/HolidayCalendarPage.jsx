import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import HolidayCalendar from '../../components/holidays/HolidayCalendar';
import HolidayForm from '../../components/holidays/HolidayForm';
import {
  useHolidayCalendars,
  useHolidayCalendar,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  useBulkImportHolidays,
} from '../../hooks/useHolidays';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function HolidayCalendarPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [importJson, setImportJson] = useState('');

  const { data: calendarsData } = useHolidayCalendars(companyId);
  const calendars = calendarsData?.data?.data || calendarsData?.data || [];
  const defaultCalendar = calendars[0];

  const { data: calendarData, refetch } = useHolidayCalendar({
    companyId,
    year,
    calendarId: defaultCalendar?.id,
  });

  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday();
  const deleteHoliday = useDeleteHoliday();
  const bulkImport = useBulkImportHolidays();

  const holidays = Array.isArray(calendarData)
    ? calendarData
    : Array.isArray(calendarData?.calendar?.holidays)
    ? calendarData.calendar.holidays
    : Array.isArray(calendarData?.holidays)
    ? calendarData.holidays
    : Array.isArray(calendarData?.data?.calendar?.holidays)
    ? calendarData.data.calendar.holidays
    : Array.isArray(calendarData?.data?.data?.holidays)
    ? calendarData.data.data.holidays
    : Array.isArray(calendarData?.data?.holidays)
    ? calendarData.data.holidays
    : Array.isArray(calendarData?.data)
    ? calendarData.data
    : [];

  const handleOpenAdd = () => {
    setSelectedHoliday(null);
    setIsModalOpen(true);
  };

  const handleSelectHoliday = (h) => {
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

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      await bulkImport.mutateAsync({
        companyId,
        calendarId: defaultCalendar?.id,
        holidays: Array.isArray(parsed) ? parsed : [parsed],
        importedBy: user?.id,
      });
      setIsImportModalOpen(false);
      setImportJson('');
      refetch();
    } catch (err) {
      alert('Invalid JSON array format: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Public & Festival Holidays</h1>
          <p className="text-sm text-slate-400">View and administer annual organizational holiday schedules</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/holidays/list')}>
            List View
          </Button>
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            Import JSON
          </Button>
          <Button variant="primary" onClick={handleOpenAdd}>
            + Add Holiday
          </Button>
        </div>
      </div>

      <HolidayCalendar
        year={year}
        holidays={holidays}
        onYearChange={setYear}
        onSelectHoliday={handleSelectHoliday}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedHoliday ? 'Edit Holiday' : 'Add Holiday to Calendar'}
      >
        <HolidayForm
          initialData={selectedHoliday}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createHoliday.isPending || updateHoliday.isPending}
        />
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Holidays"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">
            Paste a JSON array of holiday objects with `name`, `date` (YYYY-MM-DD), and optional `isOptional`.
          </p>
          <textarea
            rows="8"
            required
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder={`[\n  {\n    "name": "New Year's Day",\n    "date": "${year}-01-01",\n    "isOptional": false\n  }\n]`}
            className="w-full bg-slate-900 border border-slate-700 font-mono text-xs rounded-xl p-3 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={bulkImport.isPending}>
              Import Holidays
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
