import React from 'react';
import { Calendar, User, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

export default function LeaveRequestCard({ request, onApprove, onReject, showActions = true }) {
  const emp = request.employee || {};
  const type = request.leaveType || {};

  const startDateStr = new Date(request.startDate).toLocaleDateString();
  const endDateStr = new Date(request.endDate).toLocaleDateString();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            {emp.firstName ? emp.firstName[0] : 'L'}
          </div>
          <div>
            <h4 className="font-bold text-white text-base">
              {emp.firstName} {emp.lastName}
            </h4>
            <p className="text-xs text-slate-400 font-mono">{emp.employeeCode} • {type.name}</p>
          </div>
        </div>

        {getStatusBadge(request.status)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-500 block">From</span>
          <span className="font-medium text-slate-200">{startDateStr}</span>
        </div>
        <div>
          <span className="text-slate-500 block">To</span>
          <span className="font-medium text-slate-200">{endDateStr}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Duration</span>
          <span className="font-medium text-indigo-400 font-bold">{Number(request.totalDays)} Day(s)</span>
        </div>
      </div>

      {request.reason && (
        <p className="text-xs text-slate-400 bg-slate-800/30 p-2.5 rounded-lg border border-slate-800">
          "{request.reason}"
        </p>
      )}

      {showActions && request.status === 'PENDING' && (
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="danger" size="sm" onClick={() => onReject?.(request)}>
            Reject
          </Button>
          <Button variant="success" size="sm" onClick={() => onApprove?.(request)}>
            Approve Leave
          </Button>
        </div>
      )}
    </div>
  );
}
