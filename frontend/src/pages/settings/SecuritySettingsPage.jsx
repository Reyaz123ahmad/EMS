import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '../../hooks/useSettings.js';
import SettingSection from '../../components/settings/SettingSection.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import ToggleSwitch from '../../components/settings/ToggleSwitch.jsx';
import MultiSelect from '../../components/settings/MultiSelect.jsx';
import IPWhitelistInput from '../../components/settings/IPWhitelistInput.jsx';
import NumberInput from '../../components/settings/NumberInput.jsx';
import { toast } from 'sonner';

export function SecuritySettingsPage() {
  const { data: settings, isLoading } = useSettings('security');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();

  const [form, setForm] = useState({
    level: 'HIGH',
    layers: ['FACE_LIVENESS', 'DEVICE_ATTESTATION', 'GEO_FENCING'],
    faceMatchThreshold: 85,
    liveness: {
      activeChallenge: true,
      passiveCheck: true,
      maxAttempts: 3,
    },
    deviceAttestation: {
      required: true,
      allowEmulators: false,
    },
    twoFactor: {
      enforceForAdmins: true,
      enforceForAll: false,
    },
    session: {
      timeoutMinutes: 60,
      maxConcurrentSessions: 2,
    },
    ipWhitelist: ['192.168.1.0/24'],
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        ...settings,
        liveness: { ...prev.liveness, ...settings.liveness },
        deviceAttestation: { ...prev.deviceAttestation, ...settings.deviceAttestation },
        twoFactor: { ...prev.twoFactor, ...settings.twoFactor },
        session: { ...prev.session, ...settings.session },
        ipWhitelist: Array.isArray(settings.ipWhitelist) ? settings.ipWhitelist : prev.ipWhitelist,
      }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ type: 'security', data: form });
      toast.success('Zero-trust security policies updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update security settings');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings('security');
      toast.success('Security settings reset to defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <SettingsForm onSubmit={handleSubmit} onReset={handleReset} isSaving={isSaving} isResetting={isResetting}>
      {/* Zero-Trust Architecture Tier */}
      <SettingSection title="Security Level & Active Verification Layers" description="Set organizational security rigor and mandatory verification barriers">
        <div className="space-y-4">
          <div className="space-y-1.5 max-w-sm">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Security Posture Level</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm font-medium"
            >
              <option value="BASIC">Basic (Standard password + Photo)</option>
              <option value="STANDARD">Standard (Face match + Geo-fence)</option>
              <option value="HIGH">High Zero-Trust (AI Liveness + Device Attestation + GPS)</option>
              <option value="ENTERPRISE">Enterprise Paranoid (Full Multi-Layer + Strict IP Whitelist)</option>
            </select>
          </div>

          <MultiSelect
            label="Enforced Verification Layers"
            options={[
              { label: 'AI Facial Liveness Challenge', value: 'FACE_LIVENESS' },
              { label: 'Hardware Device Attestation', value: 'DEVICE_ATTESTATION' },
              { label: 'GPS Coordinate Geofencing', value: 'GEO_FENCING' },
              { label: 'IP Range Restriction', value: 'IP_WHITELIST' },
              { label: 'Two-Factor Authentication (2FA)', value: 'TWO_FACTOR' },
            ]}
            selected={form.layers || []}
            onChange={(layers) => setForm({ ...form, layers })}
          />
        </div>
      </SettingSection>

      {/* AI Facial Liveness & Match Sensitivity */}
      <SettingSection title="Biometric Liveness & Match Rules" description="Fine-tune facial embedding cosine similarity threshold">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Face Match Confidence Threshold"
            description="Minimum percentage required for match confirmation"
            value={form.faceMatchThreshold}
            suffix="%"
            min={50}
            max={99}
            onChange={(val) => setForm({ ...form, faceMatchThreshold: val })}
          />
          <NumberInput
            label="Max Failed Liveness Attempts"
            description="Account automatically flags signal after N failures"
            value={form.liveness?.maxAttempts}
            suffix="attempts"
            min={1}
            max={10}
            onChange={(val) => setForm({ ...form, liveness: { ...form.liveness, maxAttempts: val } })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <ToggleSwitch
            label="Active Eye-Blink & Head-Turn Challenges"
            description="Prompt employee for real-time motion checks"
            checked={form.liveness?.activeChallenge}
            onChange={(val) => setForm({ ...form, liveness: { ...form.liveness, activeChallenge: val } })}
          />
          <ToggleSwitch
            label="Enforce 2FA for Admin Roles"
            description="Super Admins and HR Admins must use TOTP authenticator"
            checked={form.twoFactor?.enforceForAdmins}
            onChange={(val) => setForm({ ...form, twoFactor: { ...form.twoFactor, enforceForAdmins: val } })}
          />
        </div>
      </SettingSection>

      {/* Corporate IP Whitelist */}
      <SettingSection title="Office Network IP Whitelist" description="Restrict web punches and portal logins to verified network subnets">
        <IPWhitelistInput
          ips={form.ipWhitelist || []}
          onChange={(ips) => setForm({ ...form, ipWhitelist: ips })}
          description="Enter trusted CIDR IP ranges (e.g. branch leased line static IPs)"
        />
      </SettingSection>
    </SettingsForm>
  );
}

export default SecuritySettingsPage;
