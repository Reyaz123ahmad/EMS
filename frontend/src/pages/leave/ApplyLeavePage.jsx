import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LeaveBalanceCard from '../../components/leave/LeaveBalanceCard';
import { useLeaveTypes, useLeaveBalances, useApplyLeave } from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const employeeId = user?.employeeId || user?.id;

  const { data: typesData } = useLeaveTypes(companyId);
  const { data: balancesData } = useLeaveBalances({
    year: new Date().getFullYear(),
  });
  const applyLeave = useApplyLeave();

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const rawTypes = typesData?.data?.data || typesData?.data?.types || typesData?.data || typesData?.types || typesData || [];
  const leaveTypes = Array.isArray(rawTypes) ? rawTypes : (rawTypes?.types || rawTypes?.leaveTypes || []);
  const rawBalances = balancesData?.data?.balances || balancesData?.data?.data || balancesData?.balances || balancesData?.data || balancesData || [];
  const balances = Array.isArray(rawBalances)
    ? rawBalances
    : Array.isArray(rawBalances?.balances)
    ? rawBalances.balances
    : [];

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (daysCount <= 0) {
      setErrorMsg('End date must be on or after start date');
      return;
    }

    try {
      await applyLeave.mutateAsync({
        ...formData,
      });

      // Explicitly invalidate all leave caches
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'calendar'] });

      setSuccessMsg('Leave request submitted successfully! Redirecting to My Leave...');
      setFormData({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
      });

      setTimeout(() => {
        navigate('/leave/my');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit leave request');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Apply for Leave</h1>
        <p className="text-sm text-slate-400">Submit a formal time-off or vacation request</p>
      </div>

      {balances.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Your Current Balances</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {balances.map((balance) => (
              <LeaveBalanceCard
                key={balance.id || balance.leaveTypeId}
                balance={balance}
              />
            ))}
          </div>
        </div>
      ) : null}

      <Card className="p-6">
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
            ✕ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Leave Type</label>
            <select
              required
              value={formData.leaveTypeId}
              onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Leave Category --</option>
              {Array.isArray(leaveTypes) && leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.code}) - {lt.isPaid ? 'Paid' : 'Unpaid'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          {daysCount > 0 && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-sm">
              <span className="text-indigo-300">Total Leave Duration:</span>
              <span className="font-bold text-indigo-200">{daysCount} {daysCount === 1 ? 'day' : 'days'}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason for Leave</label>
            <textarea
              required
              rows="4"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State the reason clearly for approval..."
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/leave/my')}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })}
            >
              Reset
            </Button>
            <Button variant="primary" type="submit" loading={applyLeave.isPending}>
              Submit Leave Application
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
