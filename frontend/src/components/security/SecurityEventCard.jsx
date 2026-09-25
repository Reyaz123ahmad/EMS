import React from 'react';
import { Shield, ShieldAlert, Key, Globe, Lock } from 'lucide-react';

export function SecurityEventCard({ event }) {
  const getIcon = (type) => {
    switch (type) {
      case 'AUTH_FAILURE':
      case 'SUSPICIOUS_LOGIN':
        return <Lock className="h-4 w-4 text-amber-500" />;
      case 'IP_BLOCKED':
        return <Globe className="h-4 w-4 text-rose-500" />;
      case 'TOKEN_REVOKED':
        return <Key className="h-4 w-4 text-purple-500" />;
      default:
        return <Shield className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0">
        {getIcon(event.eventType || event.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
            {event.eventType || event.type || 'Security Event'}
          </h4>
          <span className="text-[10px] text-slate-400 shrink-0">
            {event.createdAt ? new Date(event.createdAt).toLocaleTimeString() : 'Recent'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
          {event.description || event.message}
        </p>
      </div>
    </div>
  );
}

export default SecurityEventCard;
