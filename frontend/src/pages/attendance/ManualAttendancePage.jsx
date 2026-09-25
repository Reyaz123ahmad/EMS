import React from 'react';
import ManualAttendanceForm from '../../components/attendance/ManualAttendanceForm.jsx';
import { useMarkManualAttendance } from '../../hooks/useAttendance.js';
import { useEmployees } from '../../hooks/useEmployee.js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ManualAttendancePage() {
  const navigate = useNavigate();
  const { data: employeesRes } = useEmployees({ limit: 100 });
  const employees = employeesRes?.data?.employees || [];

  const markMutation = useMarkManualAttendance();

  const handleSubmit = async (formData) => {
    try {
      await markMutation.mutateAsync(formData);
      toast.success('Manual attendance recorded successfully!');
      navigate('/attendance/logs');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record manual attendance');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Manual Attendance Override</h1>
        <p className="text-sm text-slate-400">Record off-line attendance or adjust punch records with audit logs</p>
      </div>

      <ManualAttendanceForm
        employees={employees}
        onSubmit={handleSubmit}
        isLoading={markMutation.isPending}
      />
    </div>
  );
}
