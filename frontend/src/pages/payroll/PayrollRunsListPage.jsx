import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { usePayrollRuns, useApprovePayroll } from '../../hooks/usePayroll';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PayrollRunsListPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());

  const { data: runsData, isLoading, refetch } = usePayrollRuns({
    companyId,
    year,
  });

  const approvePayroll = useApprovePayroll();

  const runs = runsData?.data?.data || runsData?.data || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    await approvePayroll.mutateAsync({
      payrollRunId: id,
      approvedBy: user?.id,
    });
    refetch();
  };

  const columns = [
    {
      header: 'Pay Period',
      accessor: 'month',
      cell: (row) => (
        <div>
          <div className="font-bold text-white">
            {monthNames[row.month - 1]} {row.year}
          </div>
          <div className="text-xs text-slate-400">Processed {formatDate(row.createdAt)}</div>
        </div>
      ),
    },
    {
      header: 'Employees',
      accessor: 'totalEmployees',
      cell: (row) => <span className="text-slate-300 font-semibold">{row.totalEmployees || row.items?.length || 0} Staff</span>,
    },
    {
      header: 'Gross Amount',
      accessor: 'totalGross',
      cell: (row) => <span className="text-emerald-400 font-semibold">{formatCurrency(row.totalGross || 0)}</span>,
    },
    {
      header: 'Deductions',
      accessor: 'totalDeductions',
      cell: (row) => <span className="text-rose-400 font-semibold">-{formatCurrency(row.totalDeductions || 0)}</span>,
    },
    {
      header: 'Net Payout',
      accessor: 'totalNet',
      cell: (row) => <span className="text-white font-bold">{formatCurrency(row.totalNet || 0)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'COMPLETED' ? 'primary' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/payroll/runs/${row.id}`)}>
            View Details
          </Button>
          {row.status !== 'APPROVED' && (
            <Button
              variant="success"
              size="sm"
              onClick={(e) => handleApprove(row.id, e)}
              loading={approvePayroll.isPending}
            >
              Approve
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
          <h1 className="text-2xl font-bold text-white">Payroll History & Batches</h1>
          <p className="text-sm text-slate-400">Review, audit, and approve processed payroll batches</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => navigate('/payroll/run')}>
            + New Payroll Run
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={runs}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/payroll/runs/${row.id}`)}
        />
      </Card>
    </div>
  );
}
