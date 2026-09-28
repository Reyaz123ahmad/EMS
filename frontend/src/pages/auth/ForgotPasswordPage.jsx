import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, CheckCircle, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import OTPInput from '../../components/ui/OTPInput.jsx';
import api from '../../services/api.js';

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'RESET' | 'SUCCESS'
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success(`Verification code sent to ${email}`);
      setCooldown(60);
      setStep('RESET');
    } catch (err) {
      toast.info('OTP request processed. Please check your email inbox.');
      setCooldown(60);
      setStep('RESET');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('A fresh verification code was sent to your email.');
      setCooldown(60);
    } catch (err) {
      toast.error('Failed to resend code. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateResetForm = () => {
    const errs = {};
    if (!otp || otp.trim().length < 6) {
      errs.otp = 'Please enter the full 6-digit verification code';
    }
    if (!newPassword || newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters long';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateResetForm()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      toast.success('Password updated successfully!');
      setStep('SUCCESS');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* STEP 1: EMAIL ENTRY */}
      {step === 'EMAIL' && (
        <>
          <div className="text-center space-y-1.5">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Forgot Your Password?</h2>
            <p className="text-xs text-slate-400">
              Enter your registered work email to receive a 6-digit password reset code.
            </p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
            <Input
              label="Work Email Address"
              type="email"
              placeholder="you@company.com"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              error={errors.email}
              autoFocus
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              Send Reset Code
            </Button>
          </form>
        </>
      )}

      {/* STEP 2: OTP & NEW PASSWORD */}
      {step === 'RESET' && (
        <>
          <div className="text-center space-y-1.5">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Create New Password</h2>
            <p className="text-xs text-slate-400">
              Enter the 6-digit code sent to <span className="font-semibold text-slate-200">{email}</span> and your new password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                6-Digit Verification Code
              </label>
              <OTPInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                }}
                error={errors.otp}
              />
            </div>

            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              icon={Lock}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
              }}
              error={errors.newPassword}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat your new password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Reset & Update Password
            </Button>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                Change Email
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={cooldown > 0 || isLoading}
                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:hover:text-slate-400 transition"
              >
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* STEP 3: SUCCESS CONFIRMATION */}
      {step === 'SUCCESS' && (
        <div className="text-center space-y-4 py-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Password Reset Successfully!</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your password has been securely updated. You can now log into your EMS account with your new credentials.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Sign In Now
            </Button>
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
