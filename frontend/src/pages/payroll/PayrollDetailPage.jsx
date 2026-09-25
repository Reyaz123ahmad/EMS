import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { usePayrollDetail, useApprovePayroll } from '../../hooks/usePayroll';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PayrollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: detailData, isLoading, refetch } = usePayrollDetail(id);
  const approvePayroll = useApprovePayroll();

  const payrollRun = detailData?.data?.data || detailData?.data;

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading payroll details...</div>;
  }

  if (!payrollRun) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">Payroll run record not found.</p>
        <Button variant="secondary" onClick={() => navigate('/payroll/runs')}>
          Back to List
        </Button>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleApprove = async () => {
    await approvePayroll.mutateAsync({
      payrollRunId: payrollRun.id,
      approvedBy: user?.id,
    });
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
      header: 'Days Worked',
      accessor: 'payableDays',
      cell: (row) => <span className="text-slate-300">{row.payableDays || row.daysWorked || 0} d</span>,
    },
    {
      header: 'Base Salary',
      accessor: 'baseSalary',
      cell: (row) => <span className="text-slate-200">{formatCurrency(row.baseSalary)}</span>,
    },
    {
      header: 'Gross Pay',
      accessor: 'grossSalary',
      cell: (row) => <span className="text-emerald-400 font-semibold">{formatCurrency(row.grossSalary)}</span>,
    },
    {
      header: 'Deductions',
      accessor: 'deductions',
      cell: (row) => <span className="text-rose-400 font-semibold">-{formatCurrency(row.deductions || 0)}</span>,
    },
    {
      header: 'Net Pay',
      accessor: 'netSalary',
      cell: (row) => (
        <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded-md">
          {formatCurrency(row.netSalary)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/payroll/runs')} className="mb-2">
            ← Back to Runs
          </Button>
          <h1 className="text-2xl font-bold text-white">
            Payroll Details: {monthNames[payrollRun.month - 1]} {payrollRun.year}
          </h1>
          <p className="text-sm text-slate-400">
            Batch ID: {payrollRun.id} | Created: {formatDate(payrollRun.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              payrollRun.status === 'APPROVED'
                ? 'success'
                : payrollRun.status === 'COMPLETED'
                ? 'primary'
                : 'warning'
            }
          >
            {payrollRun.status}
          </Badge>
          {payrollRun.status !== 'APPROVED' && (
            <Button
              variant="success"
              onClick={handleApprove}
              loading={approvePayroll.isPending}
            >
              Approve Payroll
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-xs text-slate-400">Total Employees</span>
          <div className="text-xl font-bold text-white mt-1">
            {payrollRun.totalEmployees || payrollRun.items?.length || 0}
          </div>
        </Card>
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <span className="text-xs text-emerald-400">Total Gross</span>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {formatCurrency(payrollRun.totalGross || 0)}
          </div>
        </Card>
        <Card className="p-4 bg-rose-500/10 border-rose-500/20">
          <span className="text-xs text-rose-400">Total Deductions</span>
          <div className="text-xl font-bold text-rose-300 mt-1">
            -{formatCurrency(payrollRun.totalDeductions || 0)}
          </div>
        </Card>
        <Card className="p-4 bg-indigo-500/10 border-indigo-500/20">
          <span className="text-xs text-indigo-400">Total Net Disbursement</span>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(payrollRun.totalNet || 0)}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-bold text-white mb-4">Employee Line Items</h3>
        <Table columns={columns} data={payrollRun.items || []} />
      </Card>
    </div>
  );
}
