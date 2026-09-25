import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function DeviceStatusBadge({ isOnline, isActive, lastHeartbeat }) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        Deactivated
      </span>
    );
  }

  if (isOnline) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Wifi className="w-3.5 h-3.5" />
          Online
        </span>
        {lastHeartbeat && (
          <span className="text-[10px] text-slate-500 pl-1">
            Ping {dayjs(lastHeartbeat).fromNow()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <WifiOff className="w-3.5 h-3.5" />
        Offline
      </span>
      {lastHeartbeat && (
        <span className="text-[10px] text-slate-500 pl-1">
          Last seen {dayjs(lastHeartbeat).fromNow()}
        </span>
      )}
    </div>
  );
}
