import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Lock, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in-0 duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Change Account Password
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ensure your account is using a secure password with a mix of letters, numbers, and symbols.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
        <Input
          label="Current Password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          icon={Lock}
          placeholder="••••••••"
        />

        <Input
          label="New Password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          icon={KeyRound}
          placeholder="••••••••"
          helperText="Minimum 8 characters with upper, lower, and special symbols"
        />

        <Input
          label="Confirm New Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={KeyRound}
          placeholder="••••••••"
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" loading={isLoading} size="md">
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
