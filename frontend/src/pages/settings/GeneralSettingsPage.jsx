import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '../../hooks/useSettings.js';
import SettingSection from '../../components/settings/SettingSection.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import MultiSelect from '../../components/settings/MultiSelect.jsx';
import ColorPicker from '../../components/settings/ColorPicker.jsx';
import { toast } from 'sonner';

export function GeneralSettingsPage() {
  const { data: settings, isLoading } = useSettings('general');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();

  const [form, setForm] = useState({
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'YYYY-MM-DD',
    workWeekDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    employeeCodePrefix: 'EMP-',
    branding: {
      primaryColor: '#4f46e5',
      secondaryColor: '#06b6d4',
    },
    compliance: {
      panNumber: '',
      gstNumber: '',
    },
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        ...settings,
        branding: { ...prev.branding, ...settings.branding },
        compliance: { ...prev.compliance, ...settings.compliance },
      }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ type: 'general', data: form });
      toast.success('General settings saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings('general');
      toast.success('General settings reset to system defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <SettingsForm onSubmit={handleSubmit} onReset={handleReset} isSaving={isSaving} isResetting={isResetting}>
      {/* Localization */}
      <SettingSection title="Regional & Locale Preferences" description="Configure time display, accounting currency, and dates">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="America/New_York">America/New_York (EST -5:00)</option>
              <option value="Europe/London">Europe/London (GMT +0:00)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Date Format</label>
            <select
              value={form.dateFormat}
              onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-25)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (25/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (09/25/2026)</option>
            </select>
          </div>
        </div>

        <MultiSelect
          label="Standard Work Week Days"
          options={[
            { label: 'Monday', value: 'MON' },
            { label: 'Tuesday', value: 'TUE' },
            { label: 'Wednesday', value: 'WED' },
            { label: 'Thursday', value: 'THU' },
            { label: 'Friday', value: 'FRI' },
            { label: 'Saturday', value: 'SAT' },
            { label: 'Sunday', value: 'SUN' },
          ]}
          selected={form.workWeekDays || []}
          onChange={(days) => setForm({ ...form, workWeekDays: days })}
        />
      </SettingSection>

      {/* Organization Identifier */}
      <SettingSection title="Organization Codes & Branding" description="Customize employee ID prefixes and brand theme">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Employee ID Prefix</label>
            <input
              type="text"
              value={form.employeeCodePrefix || ''}
              onChange={(e) => setForm({ ...form, employeeCodePrefix: e.target.value })}
              placeholder="e.g. EMP- or EDU-"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
            />
          </div>
          <ColorPicker
            label="Primary Theme Color"
            value={form.branding?.primaryColor || '#4f46e5'}
            onChange={(color) => setForm({ ...form, branding: { ...form.branding, primaryColor: color } })}
          />
        </div>
      </SettingSection>

      {/* Statutory Compliance */}
      <SettingSection title="Compliance & Tax Identifiers" description="Business registrations shown on invoices and payslips">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">PAN Number</label>
            <input
              type="text"
              value={form.compliance?.panNumber || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  compliance: { ...form.compliance, panNumber: e.target.value.toUpperCase() },
                })
              }
              placeholder="ABCDE1234F"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">GSTIN / Tax ID</label>
            <input
              type="text"
              value={form.compliance?.gstNumber || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  compliance: { ...form.compliance, gstNumber: e.target.value.toUpperCase() },
                })
              }
              placeholder="27ABCDE1234F1Z5"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm font-mono uppercase"
            />
          </div>
        </div>
      </SettingSection>
    </SettingsForm>
  );
}

export default GeneralSettingsPage;
