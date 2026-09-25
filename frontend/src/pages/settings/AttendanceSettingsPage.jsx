import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '../../hooks/useSettings.js';
import SettingSection from '../../components/settings/SettingSection.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import ToggleSwitch from '../../components/settings/ToggleSwitch.jsx';
import NumberInput from '../../components/settings/NumberInput.jsx';
import { toast } from 'sonner';

export function AttendanceSettingsPage() {
  const { data: settings, isLoading } = useSettings('attendance');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();

  const [form, setForm] = useState({
    modes: {
      face: true,
      card: true,
      finger: true,
      manual: false,
    },
    operations: {
      checkIn: true,
      checkOut: true,
      breaks: true,
    },
    geofence: {
      enabled: true,
      radiusMeters: 100,
      strictMode: false,
    },
    timeRules: {
      graceMinutes: 15,
      halfDayThresholdHours: 4,
      fullDayHours: 8,
      autoCheckoutHours: 12,
    },
    photoRequirements: {
      requirePhotoOnPunch: true,
      liveCameraOnly: true,
    },
    fraudRules: {
      preventMockGPS: true,
      preventEmulator: true,
      preventRooted: true,
    },
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        ...settings,
        modes: { ...prev.modes, ...settings.modes },
        operations: { ...prev.operations, ...settings.operations },
        geofence: { ...prev.geofence, ...settings.geofence },
        timeRules: { ...prev.timeRules, ...settings.timeRules },
        photoRequirements: { ...prev.photoRequirements, ...settings.photoRequirements },
        fraudRules: { ...prev.fraudRules, ...settings.fraudRules },
      }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ type: 'attendance', data: form });
      toast.success('Attendance policy settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings('attendance');
      toast.success('Attendance settings reset to defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <SettingsForm onSubmit={handleSubmit} onReset={handleReset} isSaving={isSaving} isResetting={isResetting}>
      {/* Biometric Verification Modes */}
      <SettingSection title="Allowed Biometric Modes" description="Select which punch methods employees can use">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToggleSwitch
            label="Face Recognition (AI Liveness)"
            description="Allow punches via AI facial recognition match"
            checked={form.modes?.face}
            onChange={(val) => setForm({ ...form, modes: { ...form.modes, face: val } })}
          />
          <ToggleSwitch
            label="Biometric Card / Dynamic QR"
            description="Allow NFC card and encrypted rotating QR scans"
            checked={form.modes?.card}
            onChange={(val) => setForm({ ...form, modes: { ...form.modes, card: val } })}
          />
          <ToggleSwitch
            label="Fingerprint Biometric Device"
            description="Allow hardware fingerprint punch machine sync"
            checked={form.modes?.finger}
            onChange={(val) => setForm({ ...form, modes: { ...form.modes, finger: val } })}
          />
          <ToggleSwitch
            label="Manual Punch / Adjustments"
            description="Allow employees to request emergency attendance"
            checked={form.modes?.manual}
            onChange={(val) => setForm({ ...form, modes: { ...form.modes, manual: val } })}
          />
        </div>
      </SettingSection>

      {/* Geofencing */}
      <SettingSection title="GPS Geo-Fencing & Office Radius" description="Validate coordinates during mobile punch">
        <ToggleSwitch
          label="Enforce Geo-Fencing"
          description="Punches will be rejected if outside branch boundary radius"
          checked={form.geofence?.enabled}
          onChange={(val) => setForm({ ...form, geofence: { ...form.geofence, enabled: val } })}
        />
        <div className="max-w-xs">
          <NumberInput
            label="Allowed Office Radius"
            value={form.geofence?.radiusMeters || 100}
            suffix="meters"
            min={10}
            max={5000}
            onChange={(val) => setForm({ ...form, geofence: { ...form.geofence, radiusMeters: val } })}
          />
        </div>
      </SettingSection>

      {/* Working Time Policy Rules */}
      <SettingSection title="Punctuality & Working Time Rules" description="Thresholds for grace period, half-day, and full-day calculation">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Grace Period"
            description="Minutes allowed after shift start before late mark"
            value={form.timeRules?.graceMinutes}
            suffix="min"
            min={0}
            max={60}
            onChange={(val) => setForm({ ...form, timeRules: { ...form.timeRules, graceMinutes: val } })}
          />
          <NumberInput
            label="Half-Day Min Work"
            description="Minimum working hours required for half-day"
            value={form.timeRules?.halfDayThresholdHours}
            suffix="hours"
            min={1}
            max={12}
            onChange={(val) => setForm({ ...form, timeRules: { ...form.timeRules, halfDayThresholdHours: val } })}
          />
          <NumberInput
            label="Full-Day Required Hours"
            description="Standard working hours for full day presence"
            value={form.timeRules?.fullDayHours}
            suffix="hours"
            min={4}
            max={16}
            onChange={(val) => setForm({ ...form, timeRules: { ...form.timeRules, fullDayHours: val } })}
          />
        </div>
      </SettingSection>

      {/* Fraud Detection Policy */}
      <SettingSection title="Anti-Fraud & Device Protection" description="Block spoofing tools, emulators, and fake locations">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToggleSwitch
            label="Block Mock Location / Fake GPS"
            description="Automatically reject punches using mock location apps"
            checked={form.fraudRules?.preventMockGPS}
            onChange={(val) => setForm({ ...form, fraudRules: { ...form.fraudRules, preventMockGPS: val } })}
          />
          <ToggleSwitch
            label="Block Rooted & Jailbroken Devices"
            description="Require hardware-backed device attestation tokens"
            checked={form.fraudRules?.preventRooted}
            onChange={(val) => setForm({ ...form, fraudRules: { ...form.fraudRules, preventRooted: val } })}
          />
        </div>
      </SettingSection>
    </SettingsForm>
  );
}

export default AttendanceSettingsPage;
