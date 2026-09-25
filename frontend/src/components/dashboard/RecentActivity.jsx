import React from 'react';
import {
  UserCheck,
  UserX,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Clock
} from 'lucide-react';
import Badge from '../ui/Badge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const RecentActivity = ({
  activities = [
    {
      id: '1',
      title: 'Biometric Check-In',
      description: 'Rahul Sharma checked in via Face Biometric',
      type: 'CHECK_IN',
      time: new Date(Date.now() - 1000 * 60 * 5),
      status: 'success'
    },
    {
      id: '2',
      title: 'Leave Approved',
      description: 'Pooja Verma approved Sick Leave for Amit',
      type: 'LEAVE',
      time: new Date(Date.now() - 1000 * 60 * 25),
      status: 'info'
    },
    {
      id: '3',
      title: 'QR Card Issued',
      description: 'CR80 badge generated for Dev Team #EMP008',
      type: 'CARD',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'neutral'
    },
    {
      id: '4',
      title: 'Fraud Alert Flagged',
      description: 'Mock location spoofing detected on mobile device',
      type: 'SECURITY',
      time: new Date(Date.now() - 1000 * 60 * 60 * 4),
      status: 'danger'
    }
  ]
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'CHECK_IN':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'CHECK_OUT':
        return <UserX className="w-4 h-4 text-rose-500" />;
      case 'LEAVE':
        return <FileCheck className="w-4 h-4 text-indigo-500" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-violet-500" />;
      case 'SECURITY':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((act) => (
        <div
          key={act.id}
          className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              {getIcon(act.type)}
            </div>
            <div>
              <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {act.title}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {act.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
              {dayjs(act.time).fromNow()}
            </span>
            {act.status && (
              <Badge variant={act.status} size="sm">
                {act.type}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
