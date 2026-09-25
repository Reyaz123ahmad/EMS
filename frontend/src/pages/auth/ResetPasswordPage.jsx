import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import OTPInput from '../../components/ui/OTPInput.jsx';
import api from '../../services/api.js';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email address is required';
    if (!otp || otp.length < 6) errs.otp = 'Please enter complete 6-digit code';
    if (!newPassword || newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Check your OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Create New Password</h2>
        <p className="text-xs text-slate-400">Enter verification code and your new password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!searchParams.get('email') && (
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@mindstocs.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2 text-center">
            Verification Code (6-Digits)
          </label>
          <OTPInput value={otp} onChange={setOtp} error={errors.otp} />
        </div>

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Update Password
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
