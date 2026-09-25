import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '../../hooks/useSettings.js';
import SettingSection from '../../components/settings/SettingSection.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import ToggleSwitch from '../../components/settings/ToggleSwitch.jsx';
import NumberInput from '../../components/settings/NumberInput.jsx';
import { toast } from 'sonner';

export function LeaveSettingsPage() {
  const { data: settings, isLoading } = useSettings('leave');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();

  const [form, setForm] = useState({
    yearStartMonth: 1,
    carryForwardAllowed: true,
    maxCarryForwardDays: 15,
    sandwichRule: true,
    probationLeaveAllowed: false,
    probationPeriodMonths: 3,
    autoApproveAfterDays: 7,
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ type: 'leave', data: form });
      toast.success('Leave policy rules saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update leave settings');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings('leave');
      toast.success('Leave settings reset to defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <SettingsForm onSubmit={handleSubmit} onReset={handleReset} isSaving={isSaving} isResetting={isResetting}>
      <SettingSection title="Leave Calendar Cycle & Carry Forward" description="Configure accrual cycles and annual rollovers">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Leave Year Start Month</label>
            <select
              value={form.yearStartMonth}
              onChange={(e) => setForm({ ...form, yearStartMonth: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
            >
              <option value={1}>January (Calendar Year)</option>
              <option value={4}>April (Indian Fiscal Year)</option>
              <option value={7}>July</option>
              <option value={10}>October</option>
            </select>
          </div>

          <NumberInput
            label="Max Carry Forward Days"
            description="Cap on unutilized leaves carried to next cycle"
            value={form.maxCarryForwardDays}
            suffix="days"
            min={0}
            max={60}
            onChange={(val) => setForm({ ...form, maxCarryForwardDays: val })}
          />
        </div>

        <div className="pt-2">
          <ToggleSwitch
            label="Enable Annual Carry Forward"
            description="Unused leave balance moves to subsequent year"
            checked={form.carryForwardAllowed}
            onChange={(val) => setForm({ ...form, carryForwardAllowed: val })}
          />
        </div>
      </SettingSection>

      <SettingSection title="Probation & Special Rules" description="Sandwich policy and new employee leave eligibility">
        <div className="space-y-3">
          <ToggleSwitch
            label="Enforce Sandwich Rule"
            description="Weekends and holidays falling between leave days will count as leave"
            checked={form.sandwichRule}
            onChange={(val) => setForm({ ...form, sandwichRule: val })}
          />
          <ToggleSwitch
            label="Allow Paid Leave During Probation"
            description="Permit new joiners to take paid leaves before probation completion"
            checked={form.probationLeaveAllowed}
            onChange={(val) => setForm({ ...form, probationLeaveAllowed: val })}
          />
        </div>

        <div className="max-w-xs pt-2">
          <NumberInput
            label="Standard Probation Period"
            value={form.probationPeriodMonths}
            suffix="months"
            min={1}
            max={12}
            onChange={(val) => setForm({ ...form, probationPeriodMonths: val })}
          />
        </div>
      </SettingSection>
    </SettingsForm>
  );
}

export default LeaveSettingsPage;
