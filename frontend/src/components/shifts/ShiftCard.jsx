import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ShiftCard({ shift, onEdit, onDelete, onAssign }) {
  if (!shift) return null;

  return (
    <Card className="p-5 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="primary">{shift.code || 'SHIFT'}</Badge>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {shift.isNightShift ? 'Night Shift' : 'Day Shift'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{shift.name}</h3>
        {shift.description && <p className="text-xs text-slate-400 mb-3">{shift.description}</p>}

        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Start Time</span>
            <span className="text-sm font-bold text-white">{shift.startTime}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">End Time</span>
            <span className="text-sm font-bold text-white">{shift.endTime}</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Grace Period:</span>
            <span className="text-slate-200">{shift.gracePeriod || 15} mins</span>
          </div>
          <div className="flex justify-between">
            <span>Break Allowance:</span>
            <span className="text-slate-200">{shift.breakDuration || 60} mins</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        {onAssign && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onAssign(shift)}>
            Assign
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(shift)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" size="sm" onClick={() => onDelete(shift.id)}>
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}
