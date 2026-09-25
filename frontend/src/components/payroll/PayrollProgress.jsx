import React from 'react';
import Card from '../ui/Card';

export default function PayrollProgress({ step = 1, totalSteps = 3, statusText = 'Processing payroll calculation...' }) {
  const percentage = Math.round((step / totalSteps) * 100);

  return (
    <Card className="p-6 bg-slate-900 border-indigo-500/30 shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Payroll Run in Progress
        </span>
        <span className="text-xs font-semibold text-indigo-400">{percentage}%</span>
      </div>

      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-slate-400">{statusText}</p>
    </Card>
  );
}
