import React from 'react';
import { useDevices } from '../../hooks/useBiometricDevices';
import FingerDeviceStatus from '../../components/finger/FingerDeviceStatus';
import { Cpu, PlusCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FingerDevicePage() {
  const { data: devicesData, isLoading } = useDevices({ limit: 50 });
  const devices = devicesData?.data?.devices || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-indigo-400" />
            Biometric Hardware Device Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time connection status and synchronize biometric template caches across physical terminals.
          </p>
        </div>

        <Link
          to="/biometric/devices"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          Add Hardware Terminal
        </Link>
      </div>

      {/* Grid of Devices */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading hardware device network...</div>
      ) : devices.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-500">
          No hardware biometric devices registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((dev) => (
            <FingerDeviceStatus key={dev.id} device={dev} />
          ))}
        </div>
      )}
    </div>
  );
}
