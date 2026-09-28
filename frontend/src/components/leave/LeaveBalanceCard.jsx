import React from 'react';
import Badge from '../ui/Badge.jsx';

export default function LeaveBalanceCard({ balance, balances }) {
  // If balances array is passed, render cards grid
  if (Array.isArray(balances)) {
    if (balances.length === 0) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-sm text-slate-500">No leave balance data available</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {balances.map((b) => (
          <LeaveBalanceCard key={b.id || b.leaveTypeId} balance={b} />
        ))}
      </div>
    );
  }

  // Guard: if balance is missing
  if (!balance) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
        <p className="text-sm text-slate-500">No balance data</p>
      </div>
    );
  }

  // Guard: if leaveType is missing
  const leaveType = balance.leaveType || {};
  const name = leaveType.name || balance.name || 'Leave';
  const code = leaveType.code || balance.code || 'LEAVE';
  const isPaid = leaveType.isPaid !== undefined ? leaveType.isPaid : (balance.isPaid !== undefined ? balance.isPaid : true);
  const total = Number(balance.totalDays !== undefined ? balance.totalDays : 0);
  const used = Number(balance.usedDays !== undefined ? balance.usedDays : 0);
  const remaining = Number(balance.remainingDays !== undefined ? balance.remainingDays : (total - used));
  const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-base">{name}</h4>
          <span className="text-xs text-slate-500 font-mono">{code}</span>
        </div>
        <Badge variant={isPaid ? 'success' : 'secondary'}>
          {isPaid ? 'Paid Leave' : 'Unpaid'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total</span>
          <span className="text-base font-bold text-slate-200">{total}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Used</span>
          <span className="text-base font-bold text-amber-400">{used}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Remaining</span>
          <span className="text-base font-bold text-emerald-400">{remaining}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Utilization</span>
          <span>{percentUsed}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}
