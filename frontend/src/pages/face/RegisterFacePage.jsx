import React, { useState, useEffect } from 'react';
import FaceRegistrationWizard from '../../components/face/FaceRegistrationWizard';
import { useEmployeesWithoutFace } from '../../hooks/useFaceRegistration';
import { useAuthStore } from '../../store/authStore';
import { UserCheck, Shield, Sparkles, User, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegisterFacePage() {
  const { user } = useAuthStore();
  const userRole = user?.role || user?.roles?.[0]?.name || user?.roles?.[0] || 'EMPLOYEE';
  const isHrOrAdmin = ['HR_ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const myEmployeeId = user?.employeeId || user?.employee?.id || user?.id;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(myEmployeeId || '');
  const { data: pendingData, isLoading } = useEmployeesWithoutFace({ limit: 100 });
  const navigate = useNavigate();

  const pendingEmployees = pendingData?.data?.employees || [];

  useEffect(() => {
    if (!selectedEmployeeId && myEmployeeId) {
      setSelectedEmployeeId(myEmployeeId);
    }
  }, [myEmployeeId]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Face Biometric Enrollment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isHrOrAdmin
              ? 'Enroll facial biometrics directly for yourself or select an employee to register on their behalf.'
              : 'Enroll your facial recognition template. Requests will be reviewed and approved by HR.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/face/status')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
        >
          <UserCircle className="w-4 h-4 text-indigo-400" />
          Check My Face Status
        </button>
      </div>

      {/* Select Employee Card (Only shown for HR/Admins with pending employees or choice to enroll others) */}
      {isHrOrAdmin && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Employee For Enrollment
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
          >
            {myEmployeeId && (
              <option value={myEmployeeId}>
                👤 Myself ({user?.firstName || 'Admin'} {user?.lastName || ''} - Direct Registration)
              </option>
            )}
            {pendingEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.department?.name || 'General'}
              </option>
            ))}
          </select>
        </div>
      )}

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
          <h3 className="text-base font-bold text-slate-300">Ready for Face Biometric Capture</h3>
          <p className="text-xs text-slate-500 mt-1">
            The camera will activate to capture your live photo with 3D anti-spoof liveness detection.
          </p>
        </div>
      )}
    </div>
  );
}
