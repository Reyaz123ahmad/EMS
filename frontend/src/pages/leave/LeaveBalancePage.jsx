import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { useLeaveBalances, useLeaveTypes } from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';

export default function LeaveBalancePage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const userRoles = user?.roles || (user?.role ? [user.role] : ['EMPLOYEE']);
  const isEmployee = userRoles.includes('EMPLOYEE') && !userRoles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(r));

  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');

  const { data: balanceData, isLoading, refetch } = useLeaveBalances({
    year,
  });

  const balances = Array.isArray(balanceData)
    ? balanceData
    : Array.isArray(balanceData?.balances)
    ? balanceData.balances
    : Array.isArray(balanceData?.data?.balances)
    ? balanceData.data.balances
    : Array.isArray(balanceData?.data?.data)
    ? balanceData.data.data
    : Array.isArray(balanceData?.data)
    ? balanceData.data
    : [];

  const filteredBalances = Array.isArray(balances)
    ? balances.filter((b) => {
        if (!b) return false;
        const empName = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.toLowerCase();
        const typeName = (b.leaveType?.name || '').toLowerCase();
        return empName.includes(search.toLowerCase()) || typeName.includes(search.toLowerCase());
      })
    : [];

  const columns = [
    ...(!isEmployee
      ? [
          {
            header: 'Employee',
            accessor: 'employee',
            cell: (row) => (
              <div>
                <div className="font-semibold text-white">
                  {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : 'N/A'}
                </div>
                <div className="text-xs text-slate-400">{row.employee?.email || row.employee?.empCode || ''}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      header: 'Leave Type',
      accessor: 'leaveType',
      cell: (row) => <Badge variant="primary">{row.leaveType?.name || 'General'}</Badge>,
    },
    {
      header: 'Year',
      accessor: 'year',
      cell: (row) => <span className="text-slate-300 font-medium">{row.year}</span>,
    },
    {
      header: 'Allocated',
      accessor: 'totalDays',
      cell: (row) => <span className="text-slate-200 font-semibold">{row.totalDays} d</span>,
    },
    {
      header: 'Used',
      accessor: 'usedDays',
      cell: (row) => <span className="text-amber-400 font-semibold">{row.usedDays} d</span>,
    },
    {
      header: 'Available Balance',
      accessor: 'remainingDays',
      cell: (row) => {
        const remaining = (row.totalDays || 0) + (row.carriedOver || 0) - (row.usedDays || 0);
        return (
          <span className={`font-bold ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {remaining} d
          </span>
        );
      },
    },
    {
      header: 'Carried Over',
      accessor: 'carriedOver',
      cell: (row) => <span className="text-slate-400 text-xs">{row.carriedOver || 0} d</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEmployee ? 'My Leave Balances' : 'Employee Leave Balances'}
          </h1>
          <p className="text-sm text-slate-400">
            {isEmployee
              ? 'View your allocated and remaining leave balances'
              : 'View and track company-wide leave quotas and balances'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28"
          />
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
          <Input
            placeholder={isEmployee ? 'Search leave type...' : 'Search employee or leave type...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <div className="text-xs text-slate-400">Showing {filteredBalances.length} balance records</div>
        </div>

        <Table columns={columns} data={filteredBalances} isLoading={isLoading} />
      </Card>
    </div>
  );
}
