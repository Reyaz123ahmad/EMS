import React from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';

export default function PayrollPreview({ previewData, onConfirm, isProcessing }) {
  if (!previewData) return null;

  const { items = [], totals = {} } = previewData;

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
      cell: (row) => (
        <span className="text-slate-300 font-medium">
          {row.payableDays} / {row.totalWorkingDays}
        </span>
      ),
    },
    {
      header: 'Base Salary',
      accessor: 'baseSalary',
      cell: (row) => <span className="text-slate-200">{formatCurrency(row.baseSalary)}</span>,
    },
    {
      header: 'Earnings',
      accessor: 'grossEarnings',
      cell: (row) => <span className="text-emerald-400 font-semibold">{formatCurrency(row.grossEarnings)}</span>,
    },
    {
      header: 'Deductions',
      accessor: 'totalDeductions',
      cell: (row) => <span className="text-rose-400 font-semibold">-{formatCurrency(row.totalDeductions)}</span>,
    },
    {
      header: 'Net Pay',
      accessor: 'netSalary',
      cell: (row) => (
        <span className="font-bold text-white bg-indigo-500/20 px-2 py-1 rounded-lg">
          {formatCurrency(row.netSalary)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="text-xs text-emerald-300 font-medium uppercase">Total Gross Payout</div>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(totals.grossPayout || 0)}</div>
        </Card>
        <Card className="p-4 bg-rose-500/10 border-rose-500/20">
          <div className="text-xs text-rose-300 font-medium uppercase">Total Deductions</div>
          <div className="text-2xl font-black text-white mt-1">-{formatCurrency(totals.deductions || 0)}</div>
        </Card>
        <Card className="p-4 bg-indigo-500/10 border-indigo-500/20">
          <div className="text-xs text-indigo-300 font-medium uppercase">Total Net Disbursement</div>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(totals.netDisbursement || 0)}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Payroll Calculation Preview</h3>
          <span className="text-xs text-slate-400">Employees included: {items.length}</span>
        </div>
        <Table columns={columns} data={items} />
      </Card>
    </div>
  );
}
