import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '../../hooks/useSettings.js';
import SettingSection from '../../components/settings/SettingSection.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import ToggleSwitch from '../../components/settings/ToggleSwitch.jsx';
import NumberInput from '../../components/settings/NumberInput.jsx';
import { toast } from 'sonner';

export function PayrollSettingsPage() {
  const { data: settings, isLoading } = useSettings('payroll');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();

  const [form, setForm] = useState({
    payCycle: 'MONTHLY',
    payDay: 30,
    pfDeduction: true,
    pfPercentage: 12,
    esiDeduction: true,
    esiPercentage: 0.75,
    tdsDeduction: true,
    professionalTax: true,
    overtimeMultiplier: 1.5,
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ type: 'payroll', data: form });
      toast.success('Payroll & statutory deduction rules saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update payroll settings');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings('payroll');
      toast.success('Payroll settings reset to defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <SettingsForm onSubmit={handleSubmit} onReset={handleReset} isSaving={isSaving} isResetting={isResetting}>
      <SettingSection title="Disbursement Cycle & Pay Schedule" description="Configure salary generation timing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pay Frequency</label>
            <select
              value={form.payCycle}
              onChange={(e) => setForm({ ...form, payCycle: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>

          <NumberInput
            label="Salary Credit Day of Month"
            description="Day on which payslips and payroll runs finalize"
            value={form.payDay}
            suffix="th"
            min={1}
            max={31}
            onChange={(val) => setForm({ ...form, payDay: val })}
          />
        </div>
      </SettingSection>

      <SettingSection title="Statutory Compliance Deductions" description="PF, ESI, Professional Tax, and TDS calculations">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <ToggleSwitch
              label="Provident Fund (PF)"
              description="Deduct employee PF contribution"
              checked={form.pfDeduction}
              onChange={(val) => setForm({ ...form, pfDeduction: val })}
            />
            {form.pfDeduction && (
              <NumberInput
                label="PF Contribution Rate"
                value={form.pfPercentage}
                suffix="%"
                min={0}
                max={20}
                onChange={(val) => setForm({ ...form, pfPercentage: val })}
              />
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <ToggleSwitch
              label="Employee State Insurance (ESI)"
              description="Deduct employee ESI on eligible salary"
              checked={form.esiDeduction}
              onChange={(val) => setForm({ ...form, esiDeduction: val })}
            />
            {form.esiDeduction && (
              <NumberInput
                label="ESI Contribution Rate"
                value={form.esiPercentage}
                suffix="%"
                step={0.05}
                min={0}
                max={10}
                onChange={(val) => setForm({ ...form, esiPercentage: val })}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <ToggleSwitch
            label="Enable Tax Deducted at Source (TDS)"
            description="Calculate withholding tax as per regime"
            checked={form.tdsDeduction}
            onChange={(val) => setForm({ ...form, tdsDeduction: val })}
          />
          <ToggleSwitch
            label="Deduct Professional Tax (PT)"
            description="State-wise statutory professional tax slabs"
            checked={form.professionalTax}
            onChange={(val) => setForm({ ...form, professionalTax: val })}
          />
        </div>
      </SettingSection>
    </SettingsForm>
  );
}

export default PayrollSettingsPage;
