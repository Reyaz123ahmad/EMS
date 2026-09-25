import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useOvertimeStats } from '../../hooks/useOvertime';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatters';

export default function OvertimeStatsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const { data: statsData, isLoading, refetch } = useOvertimeStats({
    companyId,
  });

  const stats = statsData?.data?.data || statsData?.data || {
    totalHours: 0,
    totalApprovedHours: 0,
    totalCost: 0,
    pendingCount: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Overtime Analytics & Trends</h1>
          <p className="text-sm text-slate-400">High-level workforce overtime utilization and expenditures</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <span className="text-xs font-semibold uppercase text-amber-400">Total Logged Overtime</span>
          <div className="text-2xl font-bold text-white mt-1">
            {stats.totalHours || 0} Hours
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <span className="text-xs font-semibold uppercase text-emerald-400">Approved Overtime</span>
          <div className="text-2xl font-bold text-white mt-1">
            {stats.totalApprovedHours || 0} Hours
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
          <span className="text-xs font-semibold uppercase text-indigo-400">Estimated Cost Impact</span>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(stats.totalCost || 0)}
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
          <span className="text-xs font-semibold uppercase text-rose-400">Pending Approvals</span>
          <div className="text-2xl font-bold text-white mt-1">
            {stats.pendingCount || 0} Requests
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-2">Overtime Policy Guidelines</h3>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          <li>Standard Weekday Overtime is capped at 4 hours daily and calculated at 1.5x base hourly rate.</li>
          <li>Weekend / Off-day shifts must be authorized in advance by Department Head.</li>
          <li>All overtime claims must be submitted within 7 days of the work occurrence.</li>
        </ul>
      </Card>
    </div>
  );
}
