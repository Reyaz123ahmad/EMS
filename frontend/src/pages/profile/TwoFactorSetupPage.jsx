import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { ShieldCheck, ShieldAlert, Key, QrCode, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const TwoFactorSetupPage = () => {
  const { user } = useAuthStore();
  const [isEnabled, setIsEnabled] = useState(user?.twoFactorEnabled || false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSecret = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/2fa/generate');
      const data = response.data?.data;
      if (data) {
        setQrCodeUrl(data.qrCodeUrl || '');
        setSecretKey(data.secret || '');
      }
    } catch (error) {
      toast.error('Failed to generate 2FA key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEnable = async (e) => {
    e.preventDefault();
    if (!token || token.length !== 6) {
      toast.error('Please enter a 6-digit TOTP code');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/2fa/verify', { token });
      setIsEnabled(true);
      toast.success('Two-Factor Authentication enabled successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/2fa/disable', { token });
      setIsEnabled(false);
      setQrCodeUrl('');
      setSecretKey('');
      toast.success('Two-Factor Authentication disabled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in-0 duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Two-Factor Authentication (2FA)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Add an extra layer of security to your account using Google Authenticator or Microsoft Authenticator.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2FA Protection Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEnabled ? 'Your account is protected with TOTP 2FA' : '2FA is currently disabled on your account'}
            </p>
          </div>
          <Badge variant={isEnabled ? 'success' : 'neutral'} size="md" dot>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {!isEnabled ? (
          <div className="space-y-6">
            {!qrCodeUrl ? (
              <div className="text-center py-6 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Click below to generate a secure QR code and connect your authenticator app.
                </p>
                <Button variant="primary" onClick={handleGenerateSecret} loading={isLoading}>
                  Setup 2FA Authenticator
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 rounded-lg shadow-sm" />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-white rounded-lg">
                      <QrCode className="w-20 h-20 text-slate-400" />
                    </div>
                  )}
                  {secretKey && (
                    <p className="mt-4 text-xs font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      Secret Key: {secretKey}
                    </p>
                  )}
                </div>

                <form onSubmit={handleVerifyEnable} className="space-y-4">
                  <Input
                    label="Enter 6-Digit Code from Authenticator"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    icon={Key}
                  />

                  <Button type="submit" variant="primary" size="md" loading={isLoading} className="w-full">
                    Verify & Activate 2FA
                  </Button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold">2FA is actively securing your login sessions.</h5>
                <p className="mt-0.5 text-emerald-700 dark:text-emerald-300">
                  You will be prompted for your 6-digit TOTP code during each sign-in.
                </p>
              </div>
            </div>

            <Button variant="danger" size="sm" onClick={handleDisable2FA} loading={isLoading}>
              Disable 2FA
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetupPage;
