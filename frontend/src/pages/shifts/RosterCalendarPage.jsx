import React, { useState } from 'react';
import RosterCalendar from '../../components/shifts/RosterCalendar';
import Button from '../../components/ui/Button';
import { useRosters, usePublishRoster } from '../../hooks/useShifts';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function RosterCalendarPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: rostersData, refetch } = useRosters({
    companyId,
    month,
    year,
  });

  const publishRoster = usePublishRoster();

  const rosters = rostersData?.data?.data || rostersData?.data || [];

  const handlePublishAll = async () => {
    // Publish any draft rosters for this month
    for (const r of rosters) {
      if (r.status !== 'PUBLISHED') {
        await publishRoster.mutateAsync({ rosterId: r.id, publishedBy: user?.id });
      }
    }
    refetch();
  };

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
          <Button variant="success" onClick={handlePublishAll}>
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
