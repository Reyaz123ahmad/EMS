import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Plus,
  Search,
  Key,
  Ban,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Building,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDevices,
  useCreateDevice,
  useRegenerateApiKey,
  useDeactivateDevice
} from '../../hooks/useBiometricDevices';
import DeviceStatusBadge from '../../components/biometric/DeviceStatusBadge';
import dayjs from 'dayjs';

export default function DeviceListPage() {
  const [search, setSearch] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('FINGERPRINT');
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newPort, setNewPort] = useState(4370);

  // Newly Created Device Key Display Modal
  const [createdApiKey, setCreatedApiKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch } = useDevices({
    search: search || undefined,
    deviceType: deviceType || undefined,
    page,
    limit: 10
  });

  const createMutation = useCreateDevice();
  const regenerateMutation = useRegenerateApiKey();
  const deactivateMutation = useDeactivateDevice();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createMutation.mutateAsync({
        name: newDeviceName,
        serialNumber: newSerialNumber,
        deviceType: newDeviceType,
        ipAddress: newIpAddress || undefined,
        port: Number(newPort) || undefined
      });

      setIsCreateOpen(false);
      setCreatedApiKey(res.data?.apiKey);
      setNewDeviceName('');
      setNewSerialNumber('');
    } catch (err) {
      // Handled by toast
    }
  };

  const handleRegenerateKey = async (deviceId, name) => {
    if (window.confirm(`Regenerate secret API key for device '${name}'? Existing device connection will be invalidated.`)) {
      try {
        const res = await regenerateMutation.mutateAsync(deviceId);
        setCreatedApiKey(res.data?.apiKey);
      } catch (err) {
        // Handled by toast
      }
    }
  };

  const handleDeactivate = (deviceId, name) => {
    if (window.confirm(`Deactivate device '${name}'? It will no longer be able to push attendance.`)) {
      deactivateMutation.mutate(deviceId);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const devices = data?.data?.devices || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-indigo-400" />
            Biometric Hardware & Devices
          </h1>
          <p className="text-sm text-slate-400">
            Configure fingerprint scanners, facial terminals, card readers, and push API integrations
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Add Biometric Device
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search devices by name, serial number, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Device Types</option>
            <option value="FINGERPRINT">Fingerprint Scanner</option>
            <option value="FACE">Facial Recognition Terminal</option>
            <option value="CARD">Card / QR Reader</option>
            <option value="HYBRID">Hybrid Multi-Biometric</option>
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Device Name</th>
                <th className="px-6 py-4">Serial / IP</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status / Heartbeat</th>
                <th className="px-6 py-4">Punches Recorded</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    Loading biometric devices...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No biometric devices configured. Click "Add Biometric Device" to register one.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-200">{device.name}</p>
                        <p className="text-xs text-slate-400">
                          {device.branch?.name || 'Unassigned Branch'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      <p className="font-bold text-indigo-400">{device.serialNumber}</p>
                      <p className="text-slate-500">{device.ipAddress ? `${device.ipAddress}:${device.port || 4370}` : 'Cloud Connected'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                        {device.deviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <DeviceStatusBadge
                        isOnline={device.isOnline}
                        isActive={device.isActive}
                        lastHeartbeat={device.lastHeartbeat}
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {device._count?.devicePunches || 0} punches
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/biometric/devices/${device.id}`}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                        title="View Device Info"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {device.isActive && (
                        <>
                          <button
                            onClick={() => handleRegenerateKey(device.id, device.name)}
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Regenerate Device API Key"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(device.id, device.name)}
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Deactivate Device"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing {devices.length} of {total} devices
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Register Biometric Device
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Device Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Lobby Face Reader"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serial Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZKT-SN-998811"
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2 font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Device Type
                </label>
                <select
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="FINGERPRINT">Fingerprint Scanner</option>
                  <option value="FACE">Facial Terminal</option>
                  <option value="CARD">Card / QR Scanner</option>
                  <option value="HYBRID">Hybrid Multi-Biometric</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    IP Address (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.200"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition"
              >
                {createMutation.isPending ? 'Registering...' : 'Register Device'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Secret API Key Display Modal (Shown Once) */}
      {createdApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Save Your Device API Key</h3>
                <p className="text-xs text-amber-400 font-semibold">
                  This key is only displayed once! Store it securely in your biometric device config.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-indigo-300 break-all select-all">
                {createdApiKey}
              </span>
              <button
                onClick={() => copyToClipboard(createdApiKey)}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl shrink-0 transition"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <p className="font-semibold text-slate-300">Push Endpoint:</p>
              <code className="text-emerald-400 font-mono">POST /api/v1/biometric/push</code>
              <p className="pt-1">Header: <code className="text-slate-200">x-api-key: {createdApiKey.slice(0, 16)}...</code></p>
            </div>

            <button
              onClick={() => setCreatedApiKey(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
            >
              I Have Saved The Key Securely
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
