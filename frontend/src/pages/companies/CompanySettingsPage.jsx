import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanySettings, useUpdateCompanySettings } from '../../hooks/useCompany.js';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

export function CompanySettingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useCompanySettings(id);
  const updateSettingsMutation = useUpdateCompanySettings();

  const [activeTab, setActiveTab] = useState('attendance');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState({
    attendance: {
      geoFencing: true,
      faceRecognition: true,
      cardRequired: false,
      gracePeriodMinutes: 15
    },
    security: {
      mfaRequired: false,
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 60,
      ipWhitelist: []
    },
    leave: {
      fiscalYearStart: 1,
      carryForwardLimit: 5,
      autoApproveLeave: false
    },
    payroll: {
      currency: 'INR',
      salaryCycleStartDay: 1,
      overtimeMultiplier: 1.5
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true
    },
    general: {
      timezone: 'Asia/Kolkata',
      supportEmail: ''
    }
  });

  useEffect(() => {
    if (data?.data?.settings) {
      setSettings((prev) => ({
        ...prev,
        ...data.data.settings
      }));
    }
  }, [data]);

  const handleFieldChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async (category) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateSettingsMutation.mutateAsync({
        id,
        settingsType: category,
        settingsData: settings[category]
      });
      setSuccessMsg(`${category.toUpperCase()} settings saved successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update settings.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  const tabs = [
    { id: 'attendance', label: 'Attendance Rules' },
    { id: 'security', label: 'Security & Auth' },
    { id: 'leave', label: 'Leave Policy' },
    { id: 'payroll', label: 'Payroll & Currency' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'general', label: 'General Info' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Company Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure company-wide policies for <span className="font-mono text-indigo-400 font-semibold">{data?.data?.company?.companyCode || data?.data?.companyCode || 'COMP-ORG'}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/companies/${id}`)}>
          Back to Details
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
          {(currentTab) => (
            <div className="space-y-6 mt-4">
              {/* Attendance Settings */}
              {currentTab === 'attendance' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-200">Attendance & Verification Rules</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.attendance.geoFencing}
                        onChange={(e) => handleFieldChange('attendance', 'geoFencing', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Enforce GPS Geo-Fencing</div>
                        <div className="text-xs text-slate-400">Employees can only clock in within branch radius</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.attendance.faceRecognition}
                        onChange={(e) => handleFieldChange('attendance', 'faceRecognition', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Face Biometric Check</div>
                        <div className="text-xs text-slate-400">Require camera verification with liveness check</div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Grace Period (Minutes)</label>
                    <Input
                      type="number"
                      value={settings.attendance.gracePeriodMinutes}
                      onChange={(e) => handleFieldChange('attendance', 'gracePeriodMinutes', parseInt(e.target.value, 10))}
                    />
                  </div>

                  <Button
                    onClick={() => handleSave('attendance')}
                    isLoading={updateSettingsMutation.isPending}
                    className="mt-4 bg-blue-600 hover:bg-blue-500"
                  >
                    Save Attendance Settings
                  </Button>
                </div>
              )}

              {/* Security Settings */}
              {currentTab === 'security' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-200">Authentication & Access Policies</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.mfaRequired}
                        onChange={(e) => handleFieldChange('security', 'mfaRequired', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Require Two-Factor Auth (2FA)</div>
                        <div className="text-xs text-slate-400">Force all company admins and HR staff to enable TOTP</div>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Login Attempts</label>
                      <Input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleFieldChange('security', 'maxLoginAttempts', parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Session Timeout (Minutes)</label>
                      <Input
                        type="number"
                        value={settings.security.sessionTimeoutMinutes}
                        onChange={(e) => handleFieldChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value, 10))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave('security')}
                    isLoading={updateSettingsMutation.isPending}
                    className="mt-4 bg-blue-600 hover:bg-blue-500"
                  >
                    Save Security Settings
                  </Button>
                </div>
              )}

              {/* Leave Settings */}
              {currentTab === 'leave' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-200">Leave Policies</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fiscal Year Start Month (1-12)</label>
                      <Input
                        type="number"
                        value={settings.leave.fiscalYearStart}
                        onChange={(e) => handleFieldChange('leave', 'fiscalYearStart', parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Carry Forward Limit (Days)</label>
                      <Input
                        type="number"
                        value={settings.leave.carryForwardLimit}
                        onChange={(e) => handleFieldChange('leave', 'carryForwardLimit', parseInt(e.target.value, 10))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave('leave')}
                    isLoading={updateSettingsMutation.isPending}
                    className="mt-4 bg-blue-600 hover:bg-blue-500"
                  >
                    Save Leave Settings
                  </Button>
                </div>
              )}

              {/* Payroll Settings */}
              {currentTab === 'payroll' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-200">Payroll & Overtime Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency Code</label>
                      <Input
                        value={settings.payroll.currency}
                        onChange={(e) => handleFieldChange('payroll', 'currency', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Overtime Multiplier</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.payroll.overtimeMultiplier}
                        onChange={(e) => handleFieldChange('payroll', 'overtimeMultiplier', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave('payroll')}
                    isLoading={updateSettingsMutation.isPending}
                    className="mt-4 bg-blue-600 hover:bg-blue-500"
                  >
                    Save Payroll Settings
                  </Button>
                </div>
              )}

              {/* Notifications */}
              {currentTab === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-200">Alert Delivery Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts}
                        onChange={(e) => handleFieldChange('notifications', 'emailAlerts', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Transactional Email Delivery</div>
                        <div className="text-xs text-slate-400">Queue emails via BullMQ for OTP, payslips, leaves</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => handleFieldChange('notifications', 'pushNotifications', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Push Notifications</div>
                        <div className="text-xs text-slate-400">Real-time attendance & approval alerts in browser/mobile</div>
                      </div>
                    </label>
                  </div>

                  <Button
                    onClick={() => handleSave('notifications')}
                    isLoading={updateSettingsMutation.isPending}
                    className="mt-4 bg-blue-600 hover:bg-blue-500"
                  >
                    Save Notification Settings
                  </Button>
                </div>
              )}

              {/* General Settings */}
              {currentTab === 'general' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-200">General Information</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Timezone</label>
                    <Input
                      value={settings.general.timezone}
                      onChange={(e) => handleFieldChange('general', 'timezone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Internal Support Email</label>
                    <Input
                      value={settings.general.supportEmail}
                      onChange={(e) => handleFieldChange('general', 'supportEmail', e.target.value)}
                      placeholder="hr-support@company.com"
                    />
                  </div>

                  <Button
                    onClick={() => handleSave('general')}
                    isLoading={updateSettingsMutation.isPending}
                    className="mt-4 bg-blue-600 hover:bg-blue-500"
                  >
                    Save General Settings
                  </Button>
                </div>
              )}
            </div>
          )}
        </Tabs>
      </Card>
    </div>
  );
}

export default CompanySettingsPage;
