import React, { useState } from 'react';
import FingerEnrollmentWizard from '../../components/finger/FingerEnrollmentWizard';
import { useEmployeesWithoutFace } from '../../hooks/useFaceRegistration';
import { Fingerprint, Shield, Users } from 'lucide-react';

export default function FingerEnrollmentPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const { data: employeesData } = useEmployeesWithoutFace({ limit: 100 });

  const employees = employeesData?.data?.employees || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Fingerprint className="w-7 h-7 text-indigo-400" />
          Fingerprint Template Enrollment
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Enroll, encrypt, and push 10-finger biometric minutiae data to hardware terminals (ZKTeco, eSSL, Hikvision).
        </p>
      </div>

      {/* Select Employee */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Select Employee For Fingerprint Enrollment
        </label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
        >
          <option value="">-- Choose Employee --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} ({emp.employeeCode})
            </option>
          ))}
        </select>
      </div>

      {selectedEmployeeId ? (
        <FingerEnrollmentWizard
          employeeId={selectedEmployeeId}
          onComplete={() => {
            alert('Fingerprint enrolled successfully!');
          }}
        />
      ) : (
        <div className="p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
          <Fingerprint className="w-12 h-12 text-indigo-400/60 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Select an employee above to start template capture</h3>
          <p className="text-xs text-slate-500 mt-1">Supports USB optical sensor capture or direct hardware device push.</p>
        </div>
      )}
    </div>
  );
}
