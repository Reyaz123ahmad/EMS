import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';

export default function SalaryBreakdown({ structure, employeeName }) {
  if (!structure) {
    return (
      <Card className="p-6 text-center text-slate-400">
        No salary structure configured for this employee.
      </Card>
    );
  }

  const { components = [], baseSalary = 0, ctc = 0 } = structure;

  const earnings = components.filter((c) => c.component?.type === 'EARNING' || c.type === 'EARNING');
  const deductions = components.filter((c) => c.component?.type === 'DEDUCTION' || c.type === 'DEDUCTION');

  const totalEarnings = earnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netMonthly = baseSalary + totalEarnings - totalDeductions;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Salary Breakdown</h3>
            {employeeName && <p className="text-sm text-slate-400">Employee: {employeeName}</p>}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Annual Cost to Company (CTC)</span>
            <span className="text-2xl font-black text-indigo-400">{formatCurrency(ctc || baseSalary * 12)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Earnings & Allowances</h4>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-sm py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Basic Salary</span>
                <span className="font-semibold text-white">{formatCurrency(baseSalary)}</span>
              </div>
              {earnings.map((e, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-800/60">
                  <span className="text-slate-300">{e.component?.name || e.name || 'Allowance'}</span>
                  <span className="font-semibold text-emerald-300">+{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 font-bold">
                <span className="text-white">Gross Earnings</span>
                <span className="text-emerald-400">{formatCurrency(baseSalary + totalEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Deductions & Taxes</h4>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              {deductions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No standard deductions applied.</p>
              ) : (
                deductions.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">{d.component?.name || d.name || 'Deduction'}</span>
                    <span className="font-semibold text-rose-300">-{formatCurrency(d.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between text-sm pt-2 font-bold border-t border-slate-800/60">
                <span className="text-white">Total Deductions</span>
                <span className="text-rose-400">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-base font-semibold text-slate-200">Estimated Net Monthly Take-Home:</span>
          <span className="text-2xl font-black text-emerald-400">{formatCurrency(netMonthly)}</span>
        </div>
      </Card>
    </div>
  );
}
