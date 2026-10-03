import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendEmployeeOTP, useVerifyEmployeeOTP, useCreateEmployee, useRoles } from '../../hooks/useEmployee.js';
import { useShifts } from '../../hooks/useShifts.js';
import { useAuthStore } from '../../store/auth.store.js';
import { StepWizard } from '../../components/shared/StepWizard.jsx';
import { OTPInput } from '../../components/ui/OTPInput.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmailPreview } from '../../components/shared/EmailPreview.jsx';

export function CreateEmployeePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const { data: shiftsData } = useShifts();
  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : Array.isArray(shiftsData?.shifts)
    ? shiftsData.shifts
    : Array.isArray(shiftsData?.data?.shifts)
    ? shiftsData.data.shifts
    : Array.isArray(shiftsData?.data)
    ? shiftsData.data
    : [];

  const { data: rolesData } = useRoles();
  const rawRoles = Array.isArray(rolesData)
    ? rolesData
    : Array.isArray(rolesData?.data)
    ? rolesData.data
    : [];

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
    ? [user.role]
    : ['EMPLOYEE'];
  const isSuper = userRoles.includes('SUPER_ADMIN');
  const isCompanyAdmin = userRoles.includes('COMPANY_ADMIN');
  const isHRAdmin = userRoles.includes('HR_ADMIN');
  const isHRManager = userRoles.includes('HR_MANAGER');

  const allowedRoleNames = isSuper || isCompanyAdmin
    ? ['HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']
    : isHRAdmin
    ? ['HR_MANAGER', 'MANAGER', 'EMPLOYEE']
    : isHRManager
    ? ['EMPLOYEE']
    : ['EMPLOYEE'];

  const allowedRoles = rawRoles.filter((r) => allowedRoleNames.includes(r.name));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    employmentType: 'FULL_TIME',
    shiftId: '',
    roleId: '',
    employeeCode: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (allowedRoles.length > 0 && !formData.roleId) {
      const defaultRole = allowedRoles.find((r) => r.name === 'EMPLOYEE') || allowedRoles[0];
      if (defaultRole) {
        setFormData((prev) => ({ ...prev, roleId: defaultRole.id }));
      }
    }
  }, [allowedRoles, formData.roleId]);

  const sendOTPMutation = useSendEmployeeOTP();
  const verifyOTPMutation = useVerifyEmployeeOTP();
  const createEmployeeMutation = useCreateEmployee();

  const [emailCooldown, setEmailCooldown] = useState(60);
  const [phoneCooldown, setPhoneCooldown] = useState(60);

  useEffect(() => {
    let timer;
    if (currentStep === 2) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOTP = async () => {
    setErrorMsg('');
    try {
      const payload = {
        employeeData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          employmentType: formData.employmentType,
          shiftId: formData.shiftId || undefined,
          roleId: formData.roleId || undefined,
          employeeCode: formData.employeeCode || undefined,
          joiningDate: formData.joiningDate
        }
      };

      const res = await sendOTPMutation.mutateAsync(payload);
      const data = res?.data || res;
      setSessionId(data.sessionId);
      setCurrentStep(2);
      setTimeLeft(600);
      setEmailCooldown(60);
      setPhoneCooldown(60);
      setEmailOtp('');
      setPhoneOtp('');
      const msg = data.message || (formData.phone
        ? `Verification codes sent to ${formData.email} and ${formData.phone}`
        : `Verification code sent to ${formData.email}`);
      setSuccessMsg(msg);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send OTP.');
    }
  };

  const handleResendEmailOtp = async () => {
    setErrorMsg('');
    try {
      await handleSendOTP();
      setEmailCooldown(60);
      setSuccessMsg(`New verification code sent to ${formData.email}`);
    } catch (err) {
      setErrorMsg('Failed to resend Email OTP.');
    }
  };

  const handleResendPhoneOtp = async () => {
    setErrorMsg('');
    try {
      await handleSendOTP();
      setPhoneCooldown(60);
      setSuccessMsg(`New verification code sent to ${formData.phone}`);
    } catch (err) {
      setErrorMsg('Failed to resend Phone OTP.');
    }
  };

  const handleVerifyAndCreate = async () => {
    setErrorMsg('');
    try {
      if (emailOtp.length !== 6) {
        setErrorMsg('Please enter the 6-digit Email OTP.');
        return;
      }
      if (formData.phone && phoneOtp.length !== 6) {
        setErrorMsg('Please enter the 6-digit Phone OTP.');
        return;
      }

      // 1. Verify OTPs
      await verifyOTPMutation.mutateAsync({
        email: formData.email.toLowerCase(),
        emailOtp,
        phoneOtp,
        otp: emailOtp,
        sessionId
      });

      // 2. Create Employee
      await createEmployeeMutation.mutateAsync({
        sessionId,
        employeeData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          employmentType: formData.employmentType,
          shiftId: formData.shiftId || undefined,
          roleId: formData.roleId || undefined,
          employeeCode: formData.employeeCode || undefined,
          joiningDate: formData.joiningDate
        }
      });

      setSuccessMsg('Employee successfully registered and credentials dispatched via email!');
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Verification or employee creation failed.');
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const steps = [
    {
      id: 'employee-info',
      title: 'Employee Profile',
      description: 'Personal & employment details'
    },
    {
      id: 'verify',
      title: 'OTP Verification',
      description: 'Validate candidate email & phone'
    }
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Onboard New Employee</h1>
        <p className="text-sm text-slate-400 mt-1">
          Add an employee to your organization with verified email, default leave quota, and portal access.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-300">✕</button>
        </div>
      )}

      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={handleSendOTP}
        onBack={() => setCurrentStep(1)}
        onSubmit={handleVerifyAndCreate}
        isSubmitting={sendOTPMutation.isPending || verifyOTPMutation.isPending || createEmployeeMutation.isPending}
        nextLabel="Send OTP & Continue"
        submitLabel="Verify & Provision Employee"
        canGoNext={
          currentStep === 1
            ? Boolean(formData.firstName && formData.lastName && formData.email)
            : formData.phone
            ? (emailOtp.length === 6 && phoneOtp.length === 6)
            : (emailOtp.length === 6)
        }
      >
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
                  <Input
                    name="firstName"
                    placeholder="Alice"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
                  <Input
                    name="lastName"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email (Receives OTP) *</label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="alice.smith@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <Input
                    name="phone"
                    placeholder="9661440544"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-800" />

            <div>
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Employment Position
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="CONSULTANT">Consultant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Joining Date</label>
                  <Input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    System Access Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    {allowedRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName || r.name} ({r.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Defines user login permissions and platform capabilities (e.g. HR Admin, Manager, Employee).
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Shift Schedule</label>
                  <select
                    name="shiftId"
                    value={formData.shiftId}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Shift Schedule (Auto-Assign Active Default) --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employee Code (Optional, leave blank to auto-generate)</label>
                  <Input
                    name="employeeCode"
                    placeholder="e.g. EMP-2026-0042"
                    value={formData.employeeCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold text-white">Enter Verification Codes</h2>
              <p className="text-sm text-slate-400 mt-1">
                OTP sent to email and phone
              </p>
            </div>

            {/* Email OTP Field */}
            <div className="w-full max-w-md space-y-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>✉</span> Email OTP
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sent to: <span className="text-indigo-400 font-medium">{formData.email}</span>
                  </p>
                </div>
                {emailOtp.length === 6 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    FILLED
                  </span>
                )}
              </div>

              <div className="flex justify-center py-1">
                <OTPInput
                  length={6}
                  value={emailOtp}
                  onChange={setEmailOtp}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  Resend in: <span className="font-mono text-amber-400 font-semibold">{formatTimer(emailCooldown)}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResendEmailOtp}
                  disabled={emailCooldown > 0 || sendOTPMutation.isPending}
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  Resend Email OTP
                </button>
              </div>
            </div>

            {/* Phone OTP Field */}
            {formData.phone ? (
              <div className="w-full max-w-md space-y-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>📱</span> Phone OTP
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sent to: <span className="text-emerald-400 font-medium">
                        {formData.phone.startsWith('+91') ? formData.phone : `+91 ${formData.phone}`}
                      </span>
                    </p>
                  </div>
                  {phoneOtp.length === 6 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      FILLED
                    </span>
                  )}
                </div>

                <div className="flex justify-center py-1">
                  <OTPInput
                    length={6}
                    value={phoneOtp}
                    onChange={setPhoneOtp}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">
                    Resend in: <span className="font-mono text-amber-400 font-semibold">{formatTimer(phoneCooldown)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendPhoneOtp}
                    disabled={phoneCooldown > 0 || sendOTPMutation.isPending}
                    className="font-medium text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    Resend Phone OTP
                  </button>
                </div>
              </div>
            ) : null}

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Session valid for:</span>
              <span className="font-mono font-bold text-amber-400">{formatTimer(timeLeft)}</span>
            </div>

            {/* Toggle live email preview */}
            <div className="pt-2 border-t border-slate-800 w-full text-center">
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                {showEmailPreview ? 'Hide Email Preview' : 'Show Sent Email Template Preview'}
              </button>

              {showEmailPreview && (
                <div className="mt-4">
                  <EmailPreview
                    type="OTP"
                    recipientName={`${formData.firstName} ${formData.lastName}`}
                    recipientEmail={formData.email}
                    companyName="Your Organization"
                    otp={emailOtp || '654321'}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </StepWizard>
    </div>
  );
}

export default CreateEmployeePage;
