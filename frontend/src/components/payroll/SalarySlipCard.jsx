import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function SalarySlipCard({ slip, onDownloadPdf, onSendEmail }) {
  if (!slip) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const employee = slip.employee || slip.payrollItem?.employee;
  const rawMonth = slip.month || slip.payrollItem?.payrollRun?.month || 1;
  const monthName = monthNames[Math.max(0, Math.min(11, rawMonth - 1))] || 'Current Month';
  const year = slip.year || slip.payrollItem?.payrollRun?.year || new Date().getFullYear();
  const grossSalary = slip.grossSalary ?? slip.payrollItem?.grossSalary ?? 0;
  const deductions = slip.deductions ?? slip.payrollItem?.totalDeductions ?? 0;
  const netSalary = slip.netSalary ?? slip.payrollItem?.netSalary ?? 0;
  const payableDays = slip.payableDays ?? slip.payrollItem?.presentDays ?? slip.daysWorked ?? 30;
  const isPaid = slip.isPaid ?? (slip.payrollItem?.payrollRun?.status === 'PAID' || slip.payrollItem?.payrollRun?.status === 'APPROVED');
  const createdAt = slip.createdAt || slip.generatedAt || new Date();

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Payslip: {monthName} {year}
          </span>
          <h3 className="text-lg font-bold text-white mt-1">
            {employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : (slip.slipNumber || 'Staff Member')}
          </h3>
          <p className="text-xs text-slate-400">{employee?.designation?.title || employee?.employeeCode || 'Employee'}</p>
        </div>
        <Badge variant={isPaid ? 'success' : 'warning'}>
          {isPaid ? 'PAID' : 'PROCESSED'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 py-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
        <div>
          <span className="text-[11px] text-slate-400 block">Gross Salary</span>
          <span className="text-sm font-semibold text-emerald-400">{formatCurrency(grossSalary)}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Deductions</span>
          <span className="text-sm font-semibold text-rose-400">-{formatCurrency(deductions)}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Net Pay</span>
          <span className="text-sm font-bold text-white">{formatCurrency(netSalary)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Days: {payableDays} days</span>
        <span>Generated: {formatDate(createdAt)}</span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => onDownloadPdf && onDownloadPdf(slip.id)}
        >
          📄 Download PDF
        </Button>
        {onSendEmail && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSendEmail(slip.id)}
            title="Email payslip to employee"
          >
            ✉
          </Button>
        )}
      </div>
    </Card>
  );
}
