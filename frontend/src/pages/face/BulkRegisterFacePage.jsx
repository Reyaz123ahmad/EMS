import React, { useState } from 'react';
import { useEmployeesWithoutFace, useBulkRegisterFace } from '../../hooks/useFaceRegistration';
import { Users, Sparkles, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BulkRegisterFacePage() {
  const { data: pendingData, isLoading } = useEmployeesWithoutFace({ limit: 100 });
  const [selectedIds, setSelectedIds] = useState([]);
  const bulkRegisterMutation = useBulkRegisterFace();
  const navigate = useNavigate();

  const employees = pendingData?.data?.employees || [];

  const toggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((e) => e.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.length === 0) return;
    await bulkRegisterMutation.mutateAsync({
      employeeIds: selectedIds
    });
    navigate('/face/status');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            Bulk Face Biometric Migration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Batch generate and enroll 512-dimension encrypted facial vectors for multiple onboarded employees.
          </p>
        </div>

        <button
          type="button"
          disabled={selectedIds.length === 0 || bulkRegisterMutation.isPending}
          onClick={handleBulkSubmit}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
        >
          {bulkRegisterMutation.isPending ? 'Processing Migration...' : `Bulk Enroll (${selectedIds.length}) Selected`}
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            {selectedIds.length === employees.length && employees.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            Select All ({employees.length} Pending Employees)
          </button>
          <span className="text-xs text-slate-400 font-medium">
            {selectedIds.length} Selected
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading pending employees...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No employees pending face registration. All active staff are enrolled!
            </div>
          ) : (
            employees.map((emp) => {
              const isSelected = selectedIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleSelect(emp.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-indigo-500/10' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Code: <span className="font-mono text-slate-300">{emp.employeeCode}</span> • Dept: {emp.department?.name || 'General'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Pending
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
