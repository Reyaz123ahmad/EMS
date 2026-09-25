import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendCompanyOTP, useVerifyCompanyOTP, useCreateCompany } from '../../hooks/useCompany.js';
import { StepWizard } from '../../components/shared/StepWizard.jsx';
import { OTPInput } from '../../components/ui/OTPInput.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmailPreview } from '../../components/shared/EmailPreview.jsx';

export function CreateCompanyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Countdown timer for Step 2
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Step 1 Form Data
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: ''
  });

  const sendOTPMutation = useSendCompanyOTP();
  const verifyOTPMutation = useVerifyCompanyOTP();
  const createCompanyMutation = useCreateCompany();

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
        companyData: {
          name: formData.name,
          domain: formData.domain.toLowerCase(),
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          address: formData.address
        },
        adminData: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.adminEmail.toLowerCase(),
          phone: formData.adminPhone
        }
      };

      const res = await sendOTPMutation.mutateAsync(payload);
      const data = res?.data || res;
      setSessionId(data.sessionId);
      setCurrentStep(2);
      setTimeLeft(600);
      setSuccessMsg(`Verification code sent to ${formData.adminEmail}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyAndCreate = async () => {
    setErrorMsg('');
    try {
      if (otp.length !== 6) {
        setErrorMsg('Please enter the complete 6-digit verification code.');
        return;
      }

      // 1. Verify OTP
      await verifyOTPMutation.mutateAsync({
        email: formData.adminEmail.toLowerCase(),
        otp,
        sessionId
      });

      // 2. Create Company and Admin
      const createRes = await createCompanyMutation.mutateAsync({
        sessionId,
        companyData: {
          name: formData.name,
          domain: formData.domain.toLowerCase(),
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          address: formData.address
        },
        adminData: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.adminEmail.toLowerCase(),
          phone: formData.adminPhone
        }
      });

      setSuccessMsg('Company & Admin account provisioned successfully! Credentials dispatched.');
      setTimeout(() => {
        navigate('/companies');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Verification or company creation failed.');
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const steps = [
    {
      id: 'details',
      title: 'Company & Admin Info',
      description: 'Organization profile & root credentials'
    },
    {
      id: 'verify',
      title: 'Security Verification',
      description: '2-Step OTP email authentication'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Enterprise Company</h1>
        <p className="text-sm text-slate-400 mt-1">
          Set up a new organization tenant with isolated database schemas, roles, and 14-day Pro trial.
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
        isSubmitting={sendOTPMutation.isPending || verifyOTPMutation.isPending || createCompanyMutation.isPending}
        nextLabel="Send OTP & Proceed"
        submitLabel="Verify OTP & Create Company"
        canGoNext={
          currentStep === 1
            ? Boolean(formData.name && formData.domain && formData.email && formData.adminFirstName && formData.adminEmail)
            : otp.length === 6
        }
      >
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Organization Info Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Company Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name *</label>
                  <Input
                    name="name"
                    placeholder="e.g. Apex Global Technologies"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tenant Domain *</label>
                  <Input
                    name="domain"
                    placeholder="e.g. apextech.com"
                    value={formData.domain}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Official Email *</label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="contact@apextech.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Phone</label>
                  <Input
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Office Address</label>
                  <Input
                    name="address"
                    placeholder="Suite 500, Innovation Tower, Cyber City"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Admin Info Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Primary Company Administrator
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
                  <Input
                    name="adminFirstName"
                    placeholder="John"
                    value={formData.adminFirstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
                  <Input
                    name="adminLastName"
                    placeholder="Doe"
                    value={formData.adminLastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email (Receives OTP) *</label>
                  <Input
                    name="adminEmail"
                    type="email"
                    placeholder="admin@apextech.com"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Phone</label>
                  <Input
                    name="adminPhone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.adminPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold text-white">Enter 6-Digit Passcode</h2>
              <p className="text-sm text-slate-400 mt-1">
                We sent a secure verification OTP to{' '}
                <span className="font-semibold text-blue-400">{formData.adminEmail}</span>.
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

            {/* Toggle live email preview demo */}
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
                    recipientName={`${formData.adminFirstName} ${formData.adminLastName}`}
                    recipientEmail={formData.adminEmail}
                    companyName={formData.name}
                    otp="123456"
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

export default CreateCompanyPage;
