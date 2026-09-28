import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import overtimeService from '../../services/overtime.service';

export default function ApplyOvertimePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedMinutes: 60,
    reason: '',
  });

  const applyMutation = useMutation({
    mutationFn: (data) => overtimeService.applyOvertime(data),
    onSuccess: () => {
      toast.success('Overtime claim submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-overtime'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-records'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'records'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      navigate('/overtime/my');
    },
    onError: (error) => {
      console.error('Overtime apply error:', error);
      const message = error.response?.data?.message || 'Failed to submit overtime claim';
      const code = error.response?.data?.code;

      if (code === 'ALREADY_PENDING') {
        toast.error('You already have a pending overtime request for this date');
      } else if (code === 'USER_NOT_FOUND') {
        toast.error('Your employee record is not properly set up. Please contact HR.');
      } else {
        toast.error(message);
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    const minutes = parseInt(formData.requestedMinutes, 10);
    if (!minutes || minutes < 15) {
      toast.error('Minimum 15 minutes required');
      return;
    }

    applyMutation.mutate({
      date: new Date(formData.date).toISOString(),
      requestedMinutes: minutes,
      reason: formData.reason || ''
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Claim Overtime Hours</h1>
        <p className="text-sm text-slate-400">Submit extra hours worked outside assigned shift schedule</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Overtime Duration (Minutes)
            </label>
            <div className="flex gap-3 items-center">
              <Input
                type="number"
                step="15"
                min="15"
                max="720"
                required
                value={formData.requestedMinutes}
                onChange={(e) => setFormData({ ...formData, requestedMinutes: Number(e.target.value) })}
                className="w-40"
              />
              <span className="text-sm text-slate-400">
                = {(formData.requestedMinutes / 60).toFixed(2)} hours
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason / Task Description</label>
            <textarea
              rows="4"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain the urgent project tasks or customer delivery completed..."
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="primary" type="submit" loading={applyMutation.isPending}>
              Submit Overtime Claim
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
