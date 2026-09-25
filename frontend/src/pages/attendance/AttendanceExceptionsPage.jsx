import React, { useState } from 'react';
import { useAttendanceExceptions } from '../../hooks/useAttendance.js';
import AttendanceExceptionCard from '../../components/attendance/AttendanceExceptionCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import { AlertOctagon, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceExceptionsPage() {
  const { data: exceptionsRes, isLoading, refetch } = useAttendanceExceptions();
  const exceptions = exceptionsRes?.data?.exceptions || [];

  const handleResolve = (exception, action) => {
    if (action === 'REGULARIZE') {
      toast.success(`Regularization ticket created for ${exception.employee?.firstName}`);
    } else {
      toast.info(`Notification sent to ${exception.employee?.email}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <AlertOctagon className="w-7 h-7 text-amber-400" />
            Attendance Exceptions
          </h1>
          <p className="text-sm text-slate-400">Review irregular punches, missing checkouts, and excessive lateness</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Spinner size="lg" />
        </div>
      ) : exceptions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <p className="text-lg font-bold text-slate-300">No Attendance Exceptions Found 🎉</p>
          <p className="text-xs">All employees have normal check-in/out records for this period.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exceptions.map((ex) => (
            <AttendanceExceptionCard key={ex.id} exception={ex} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
