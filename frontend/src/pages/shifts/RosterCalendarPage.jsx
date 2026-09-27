import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RosterCalendar from '../../components/shifts/RosterCalendar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useRosterCalendar, usePublishRoster, useShifts } from '../../hooks/useShifts';
import useAuthStore from '../../store/auth.store.js';

export default function RosterCalendarPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: shiftsData } = useShifts(companyId);
  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : Array.isArray(shiftsData?.shifts)
    ? shiftsData.shifts
    : Array.isArray(shiftsData?.data)
    ? shiftsData.data
    : [];

  const { data: calendarData, refetch, isLoading } = useRosterCalendar({
    companyId,
    month,
    year,
  });

  const publishRoster = usePublishRoster();

  const rosters = Array.isArray(calendarData)
    ? calendarData
    : Array.isArray(calendarData?.rosters)
    ? calendarData.rosters
    : Array.isArray(calendarData?.roster)
    ? calendarData.roster
    : Array.isArray(calendarData?.data?.rosters)
    ? calendarData.data.rosters
    : Array.isArray(calendarData?.data?.roster)
    ? calendarData.data.roster
    : Array.isArray(calendarData?.data)
    ? calendarData.data
    : [];

  const handlePublishAll = async () => {
    await publishRoster.mutateAsync({ companyId, month, year, publishedBy: user?.id });
    refetch();
  };

  if (!isLoading && shifts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Monthly Roster Schedule</h1>
            <p className="text-sm text-slate-400">View team schedule and shift distributions</p>
          </div>
        </div>
        <Card className="p-8 text-center space-y-4">
          <p className="text-slate-300 font-medium">No shifts available in the system.</p>
          <Button variant="primary" onClick={() => navigate('/shifts/create')}>
            + Create Shift Schedule
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Roster Schedule</h1>
          <p className="text-sm text-slate-400">View team schedule and shift distributions across the company</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/rosters/generate')}>
            + Generate Roster
          </Button>
          <Button variant="success" onClick={handlePublishAll} loading={publishRoster.isPending}>
            Publish Month Roster
          </Button>
        </div>
      </div>

      <RosterCalendar
        month={month}
        year={year}
        rosters={rosters}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />
    </div>
  );
}
