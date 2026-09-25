import React, { useState } from 'react';
import FaceRegistrationWizard from '../../components/face/FaceRegistrationWizard';
import { useEmployeesWithoutFace } from '../../hooks/useFaceRegistration';
import { UserCheck, Shield, Sparkles, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegisterFacePage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const { data: pendingData, isLoading } = useEmployeesWithoutFace({ limit: 100 });
  const navigate = useNavigate();

  const pendingEmployees = pendingData?.data?.employees || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Face Biometric Enrollment
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enroll and cryptographically sign employee face biometric templates with anti-spoofing liveness verification.
          </p>
        </div>
      </div>

      {/* Select Employee Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Select Employee For Enrollment
        </label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
        >
          <option value="">-- Choose an Employee ({pendingEmployees.length} Pending Enrollment) --</option>
          {pendingEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.department?.name || 'General'}
            </option>
          ))}
        </select>
      </div>

      {/* Wizard */}
      {selectedEmployeeId ? (
        <FaceRegistrationWizard
          employeeId={selectedEmployeeId}
          onComplete={() => {
            navigate('/face/status');
          }}
        />
      ) : (
        <div className="p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
          <Shield className="w-12 h-12 text-indigo-400/60 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Select an employee above to start face capture</h3>
          <p className="text-xs text-slate-500 mt-1">The system will activate your camera for 3D liveness and 512-dim embedding extraction.</p>
        </div>
      )}
    </div>
  );
}
