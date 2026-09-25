import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEmergencyRequest } from '../../hooks/useEmergencyAttendance.js';
import { AlertCircle, Send, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function EmergencyAttendancePage() {
  const navigate = useNavigate();
  const { mutateAsync: createRequest, isPending: isSubmitting } = useCreateEmergencyRequest();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please describe the emergency reason');
      return;
    }

    try {
      const checkInDateTime = new Date(`${date}T${checkInTime}:00`).toISOString();
      const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`).toISOString();

      await createRequest({
        date: new Date(date).toISOString(),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        reason,
      });

      toast.success('Emergency attendance request submitted for manager approval');
      navigate('/emergency-attendance/requests');
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Emergency Attendance Punch
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Submit manual attendance if hardware biometrics or mobile GPS was unavailable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Attendance Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Check-In Time
            </label>
            <input
              type="time"
              required
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Check-Out Time
            </label>
            <input
              type="time"
              required
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Reason for Emergency Request
          </label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Biometric scanner power failure, off-site client visit..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Emergency Attendance'}
        </button>
      </form>
    </div>
  );
}

export default EmergencyAttendancePage;
