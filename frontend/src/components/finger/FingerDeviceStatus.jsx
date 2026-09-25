import React from 'react';
import { Wifi, WifiOff, RefreshCw, Cpu } from 'lucide-react';
import { useSyncFingerToDevice } from '../../hooks/useFingerAttendance';

export default function FingerDeviceStatus({ device }) {
  const syncMutation = useSyncFingerToDevice();

  if (!device) return null;

  const isOnline = Boolean(device.isOnline);

  const handleSync = () => {
    syncMutation.mutate(device.id);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{device.name}</h4>
            <p className="text-[10px] font-mono text-slate-400">SN: {device.serialNumber}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
        <div className="text-slate-400">
          Last Heartbeat: <span className="text-slate-200">{device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleTimeString() : 'N/A'}</span>
        </div>

        <button
          type="button"
          disabled={syncMutation.isPending}
          onClick={handleSync}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync Templates
        </button>
      </div>
    </div>
  );
}
