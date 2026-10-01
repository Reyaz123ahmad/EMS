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
  const [otp, setOtp] = useState('');
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

  useEffect(() => {
    let timer;
    if (currentStep === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, timeLeft]);

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
      setSuccessMsg(`Verification code sent to ${formData.email}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyAndCreate = async () => {
    setErrorMsg('');
    try {
      if (otp.length !== 6) {
        setErrorMsg('Please enter the 6-digit verification code.');
        return;
      }

      // 1. Verify OTP
      await verifyOTPMutation.mutateAsync({
        email: formData.email.toLowerCase(),
        otp,
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
      title: 'Email OTP Verification',
      description: 'Validate candidate work email'
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
            : otp.length === 6
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
                    placeholder="+1 (555) 987-6543"
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
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold text-white">Enter Employee Verification Code</h2>
              <p className="text-sm text-slate-400 mt-1">
                A 6-digit OTP passcode has been dispatched to{' '}
                <span className="font-semibold text-indigo-400">{formData.email}</span>.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Code expires in:</span>
              <span className="font-mono font-bold text-amber-400">{formatTimer(timeLeft)}</span>
              {timeLeft === 0 && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="ml-2 text-blue-400 hover:underline font-semibold"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {/* Toggle live email preview */}
            <div className="pt-4 border-t border-slate-800 w-full text-center">
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
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
                    otp="654321"
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
