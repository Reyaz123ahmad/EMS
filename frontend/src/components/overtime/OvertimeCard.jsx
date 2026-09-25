import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function OvertimeCard({ record, onAction }) {
  if (!record) return null;

  const hours = (record.minutes / 60).toFixed(1);

  return (
    <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs text-slate-400 block">{formatDate(record.date)}</span>
          <h4 className="font-bold text-white text-base">
            {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employee'}
          </h4>
        </div>
        <Badge
          variant={
            record.status === 'APPROVED' ? 'success' : record.status === 'REJECTED' ? 'danger' : 'warning'
          }
        >
          {record.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 text-center">
        <div>
          <span className="text-[11px] text-slate-400 block">Duration</span>
          <span className="text-sm font-bold text-amber-400">{hours} hrs ({record.minutes}m)</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Calculated Payout</span>
          <span className="text-sm font-bold text-emerald-400">
            {record.amount ? formatCurrency(record.amount) : 'Standard Rate'}
          </span>
        </div>
      </div>

      {record.reason && (
        <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">"{record.reason}"</p>
      )}

      {onAction && record.status === 'PENDING' && (
        <button
          onClick={() => onAction(record)}
          className="w-full py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          Review Request
        </button>
      )}
    </Card>
  );
}
