import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

export default function LeaveBalanceCard({ balance }) {
  const type = balance.leaveType || {};
  const total = Number(balance.totalDays || 0);
  const used = Number(balance.usedDays || 0);
  const remaining = Number(balance.remainingDays || 0);
  const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-base">{type.name}</h4>
          <span className="text-xs text-slate-500 font-mono">{type.code || 'LEAVE'}</span>
        </div>
        <Badge variant={type.isPaid ? 'success' : 'secondary'}>
          {type.isPaid ? 'Paid Leave' : 'Unpaid'}
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
