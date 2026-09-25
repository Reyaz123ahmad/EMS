import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '../../hooks/useSettings.js';
import SettingSection from '../../components/settings/SettingSection.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import ToggleSwitch from '../../components/settings/ToggleSwitch.jsx';
import { Mail, MessageSquare, Bell, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettingsPage() {
  const { data: settings, isLoading } = useSettings('notifications');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();

  const [form, setForm] = useState({
    channels: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
    events: {
      punchConfirmation: true,
      leaveApplication: true,
      leaveApproval: true,
      salarySlipGenerated: true,
      securityAlert: true,
      emergencyRequest: true,
    },
    recipients: {
      hrEmail: 'hr@edudibon.com',
      securityEmail: 'security@edudibon.com',
    },
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        ...settings,
        channels: { ...prev.channels, ...settings.channels },
        events: { ...prev.events, ...settings.events },
        recipients: { ...prev.recipients, ...settings.recipients },
      }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ type: 'notifications', data: form });
      toast.success('Notification preferences updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update notification settings');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings('notifications');
      toast.success('Notification settings reset to defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <SettingsForm onSubmit={handleSubmit} onReset={handleReset} isSaving={isSaving} isResetting={isResetting}>
      <SettingSection title="Delivery Channels" description="Select enabled broadcast mediums for real-time notifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <Mail className="h-5 w-5 text-indigo-500" />
            <div className="flex-1">
              <ToggleSwitch
                label="Email Notifications"
                checked={form.channels?.email}
                onChange={(val) => setForm({ ...form, channels: { ...form.channels, email: val } })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <Smartphone className="h-5 w-5 text-emerald-500" />
            <div className="flex-1">
              <ToggleSwitch
                label="Mobile Push (FCM)"
                checked={form.channels?.push}
                onChange={(val) => setForm({ ...form, channels: { ...form.channels, push: val } })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <Bell className="h-5 w-5 text-purple-500" />
            <div className="flex-1">
              <ToggleSwitch
                label="In-App Realtime Toast"
                checked={form.channels?.inApp}
                onChange={(val) => setForm({ ...form, channels: { ...form.channels, inApp: val } })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <ToggleSwitch
                label="SMS Gateway (Twilio/DLT)"
                checked={form.channels?.sms}
                onChange={(val) => setForm({ ...form, channels: { ...form.channels, sms: val } })}
              />
            </div>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Event Subscriptions" description="Choose which system events trigger notifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToggleSwitch
            label="Attendance Punch Confirmation"
            checked={form.events?.punchConfirmation}
            onChange={(val) => setForm({ ...form, events: { ...form.events, punchConfirmation: val } })}
          />
          <ToggleSwitch
            label="Leave Application Submitted"
            checked={form.events?.leaveApplication}
            onChange={(val) => setForm({ ...form, events: { ...form.events, leaveApplication: val } })}
          />
          <ToggleSwitch
            label="Leave Approval / Rejection Decision"
            checked={form.events?.leaveApproval}
            onChange={(val) => setForm({ ...form, events: { ...form.events, leaveApproval: val } })}
          />
          <ToggleSwitch
            label="Monthly Payslip Generated"
            checked={form.events?.salarySlipGenerated}
            onChange={(val) => setForm({ ...form, events: { ...form.events, salarySlipGenerated: val } })}
          />
          <ToggleSwitch
            label="Zero-Trust Security & Spoof Alert"
            checked={form.events?.securityAlert}
            onChange={(val) => setForm({ ...form, events: { ...form.events, securityAlert: val } })}
          />
          <ToggleSwitch
            label="Emergency Attendance Request"
            checked={form.events?.emergencyRequest}
            onChange={(val) => setForm({ ...form, events: { ...form.events, emergencyRequest: val } })}
          />
        </div>
      </SettingSection>
    </SettingsForm>
  );
}

export default NotificationSettingsPage;
