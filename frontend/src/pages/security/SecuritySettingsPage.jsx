import React, { useState, useEffect } from 'react';
import { useSecurityDashboard, useUpdateSecuritySettings } from '../../hooks/useAdvancedSecurity';
import { Lock, Shield, Globe, Cpu, Save } from 'lucide-react';

export default function SecuritySettingsPage() {
  const { data: dashboardData } = useSecurityDashboard();
  const updateSettingsMutation = useUpdateSecuritySettings();

  const [settings, setSettings] = useState({
    securityLevel: 'STANDARD',
    ipWhitelistEnabled: false,
    allowedIpRanges: ['127.0.0.1', '192.168.1.0/24'],
    requireDeviceAttestation: false,
    blockRootedDevices: true,
    blockEmulators: true,
    blockVpn: true,
    maxFailedAttempts: 5,
    fraudThresholdScore: 60
  });

  useEffect(() => {
    if (dashboardData?.data?.settings) {
      setSettings((prev) => ({ ...prev, ...dashboardData.data.settings }));
    }
  }, [dashboardData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Lock className="w-7 h-7 text-indigo-400" />
          Enterprise Security & Anti-Spoofing Policy
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure zero-trust hardware attestation, VPN interception, and network whitelisting constraints.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Security Level */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Zero-Trust Enforcement Tier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {['BASIC', 'STANDARD', 'HIGH', 'PARANOID'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSettings({ ...settings, securityLevel: lvl })}
                className={`p-3.5 rounded-xl border text-left transition ${
                  settings.securityLevel === lvl
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{lvl}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {lvl === 'BASIC' && 'Minimal checks'}
                  {lvl === 'STANDARD' && 'GPS + Liveness'}
                  {lvl === 'HIGH' && 'Attestation + VPN'}
                  {lvl === 'PARANOID' && 'Whitelist + Strict'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Network & VPN Checks */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Network & IP Safeguards
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Block VPN / Proxy Connections</div>
              <div className="text-[10px] text-slate-400">Reject punches originating from commercial datacenter VPN tunnels</div>
            </div>
            <input
              type="checkbox"
              checked={settings.blockVpn}
              onChange={(e) => setSettings({ ...settings, blockVpn: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Enforce Corporate IP Whitelisting</div>
              <div className="text-[10px] text-slate-400">Restrict attendance punches strictly to authorized company IP ranges</div>
            </div>
            <input
              type="checkbox"
              checked={settings.ipWhitelistEnabled}
              onChange={(e) => setSettings({ ...settings, ipWhitelistEnabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </div>

          {settings.ipWhitelistEnabled && (
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Allowed IP Subnets (Comma Separated)
              </label>
              <input
                type="text"
                value={settings.allowedIpRanges?.join(', ') || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowedIpRanges: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  })
                }
                placeholder="192.168.1.0/24, 10.0.0.0/8, 127.0.0.1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}
        </div>

        {/* Hardware & Device Attestation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Hardware & OS Attestation
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Block Rooted / Jailbroken Devices</div>
              <div className="text-[10px] text-slate-400">Prevent SU binary execution and OS privilege escalation tampering</div>
            </div>
            <input
              type="checkbox"
              checked={settings.blockRootedDevices}
              onChange={(e) => setSettings({ ...settings, blockRootedDevices: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-bold text-white">Block Emulators / Virtual Machines</div>
              <div className="text-[10px] text-slate-400">Reject virtual desktop and emulated smartphone instances</div>
            </div>
            <input
              type="checkbox"
              checked={settings.blockEmulators}
              onChange={(e) => setSettings({ ...settings, blockEmulators: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateSettingsMutation.isPending ? 'Saving Security Policy...' : 'Save Policy Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
