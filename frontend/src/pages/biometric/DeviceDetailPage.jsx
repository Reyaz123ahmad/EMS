import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Cpu,
  ArrowLeft,
  Key,
  RefreshCw,
  Ban,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDevice,
  useDeviceStatus,
  useDevicePunches,
  useRegenerateApiKey,
  useReprocessPunch
} from '../../hooks/useBiometricDevices';
import DeviceStatusBadge from '../../components/biometric/DeviceStatusBadge';
import dayjs from 'dayjs';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: deviceData, isLoading } = useDevice(id);
  const { data: statusData } = useDeviceStatus(id);
  const { data: punchData, refetch: refetchPunches } = useDevicePunches({ deviceId: id, limit: 15 });

  const regenerateMutation = useRegenerateApiKey();
  const reprocessMutation = useReprocessPunch();

  const device = deviceData?.data;
  const status = statusData?.data;
  const punches = punchData?.data?.punches || [];

  const handleRegenerateKey = async () => {
    if (window.confirm('Regenerate secret API key for this device?')) {
      const res = await regenerateMutation.mutateAsync(id);
      window.prompt('New Device API Key (Copy and store securely):', res.data?.apiKey);
    }
  };

  const handleReprocess = async (punchId) => {
    await reprocessMutation.mutateAsync(punchId);
    refetchPunches();
  };

  if (isLoading) {
    return <div className="text-center py-16 text-slate-400">Loading device information...</div>;
  }

  if (!device) {
    return (
      <div className="text-center py-16 space-y-4">
        <Cpu className="w-16 h-16 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-200">Device Not Found</h2>
        <Link
          to="/biometric/devices"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Device List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/biometric/devices')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Devices
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerateKey}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Key className="w-4 h-4" /> Regenerate API Key
          </button>
        </div>
      </div>

      {/* Device Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{device.name}</h1>
              <p className="text-xs text-slate-400 font-mono">
                Serial: <span className="text-indigo-300 font-bold">{device.serialNumber}</span> • Type: {device.deviceType}
              </p>
            </div>
          </div>

          <div>
            <DeviceStatusBadge
              isOnline={status?.isOnline || device.isOnline}
              isActive={device.isActive}
              lastHeartbeat={status?.lastHeartbeat || device.lastHeartbeat}
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Branch</span>
            <span className="font-semibold text-slate-200">{device.branch?.name || 'All Branches'}</span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">IP & Port</span>
            <span className="font-mono text-slate-200 font-semibold">
              {device.ipAddress ? `${device.ipAddress}:${device.port || 4370}` : 'Cloud Direct'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Registered On</span>
            <span className="font-semibold text-slate-200">{dayjs(device.createdAt).format('DD MMM YYYY')}</span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Total Logs</span>
            <span className="font-mono text-indigo-300 font-bold">{punches.length} recent</span>
          </div>
        </div>
      </div>

      {/* Recent Device Punches Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Live Device Punch Stream
          </h2>
          <button
            onClick={() => refetchPunches()}
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Processing Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {punches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No punches recorded yet from this terminal.
                  </td>
                </tr>
              ) : (
                punches.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {dayjs(p.punchedAt).format('DD MMM, HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : (p.cardNumber ? `Card: ${p.cardNumber}` : 'Unidentified')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold">
                        {p.punchType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {p.verification}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.processed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Processed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold" title={p.errorReason}>
                          <XCircle className="w-3.5 h-3.5" /> Failed: {p.errorReason || 'Unprocessed'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!p.processed && (
                        <button
                          onClick={() => handleReprocess(p.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
