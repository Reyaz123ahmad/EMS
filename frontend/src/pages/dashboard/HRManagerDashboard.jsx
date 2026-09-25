import React from 'react';
import {
  Users,
  UserCheck,
  CalendarCheck,
  FileCheck2,
  Clock,
  Camera,
  CheckCircle2
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export const HRManagerDashboard = () => {
  const navigate = useNavigate();

  const teamMembers = [
    { name: 'Rahul Sharma', code: 'EMP001', role: 'Frontend Engineer', status: 'PRESENT', inTime: '09:05 AM', method: 'Face' },
    { name: 'Pooja Verma', code: 'EMP002', role: 'UI/UX Designer', status: 'PRESENT', inTime: '09:12 AM', method: 'QR Card' },
    { name: 'Amit Roy', code: 'EMP003', role: 'Backend Developer', status: 'LATE', inTime: '09:48 AM', method: 'Finger' },
    { name: 'Siddharth Sen', code: 'EMP004', role: 'QA Lead', status: 'ON_LEAVE', inTime: '-', method: '-' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            HR Operations & Team Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department roster monitoring, shift check-ins, biometric verifications, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/face-registration')} className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-500" />
            Enroll Face
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Assigned Team"
          value="42"
          change="3 departments"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Team Present"
          value="38"
          change="90.4%"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={Clock}
          label="Late Today"
          value="3"
          change="Average 18 min"
          changeType="neutral"
          variant="amber"
        />
        <StatsCard
          icon={FileCheck2}
          label="Pending Team Approvals"
          value="4"
          change="2 leave, 2 overtime"
          variant="sky"
        />
      </div>

      {/* Charts & Team List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Team Attendance Performance"
            subtitle="Weekly check-in punctuality rate"
          >
            <AttendanceTrendChart />
          </ChartCard>
        </div>

        {/* Team Members Real-Time Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Team Roster Live</span>
            <Badge variant="success" size="sm" dot>Live</Badge>
          </h3>

          <div className="space-y-3">
            {teamMembers.map((m) => (
              <div key={m.code} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{m.name}</h4>
                  <p className="text-slate-500 text-[11px]">{m.role} • {m.code}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Punch: {m.inTime} ({m.method})</p>
                </div>
                <Badge
                  variant={m.status === 'PRESENT' ? 'success' : m.status === 'LATE' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRManagerDashboard;
