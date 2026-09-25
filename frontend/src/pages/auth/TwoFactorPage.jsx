import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button.jsx';
import OTPInput from '../../components/ui/OTPInput.jsx';
import useAuthStore from '../../store/auth.store.js';
import authService from '../../services/auth.service.js';

export function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const email = location.state?.email || '';
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (token.length < 6) {
      setError('Please enter the complete 6-digit 2FA code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await authService.login(email, '', token);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Two-factor authentication verified');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Two-Factor Authentication</h2>
        <p className="text-xs text-slate-400">
          Enter the 6-digit verification code sent to your registered account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OTPInput value={token} onChange={setToken} error={error} />

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
          Verify & Sign In
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>
    </div>
  );
}

export default TwoFactorPage;
