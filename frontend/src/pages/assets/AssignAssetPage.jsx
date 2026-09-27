import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useAssignAsset } from '../../hooks/useAssets.js';
import { useEmployees } from '../../hooks/useEmployee.js';
import { ArrowLeft, UserPlus, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function AssignAssetPage() {
  const navigate = useNavigate();
  const { data: assetsData } = useAssets({ isActive: true });
  const { data: employeesData } = useEmployees({ limit: 100 });

  const assets = Array.isArray(assetsData)
    ? assetsData
    : Array.isArray(assetsData?.assets)
    ? assetsData.assets
    : Array.isArray(assetsData?.data)
    ? assetsData.data
    : [];

  const rawEmployees = employeesData?.data?.employees || employeesData?.employees || employeesData?.data || [];
  const employees = Array.isArray(rawEmployees) ? rawEmployees : [];

  const { mutateAsync: assignAsset, isPending: isAssigning } = useAssignAsset();

  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [remarks, setRemarks] = useState('');

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearch) return true;
    const query = employeeSearch.toLowerCase();
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    return name.includes(query) || code.includes(query) || email.includes(query);
  });

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId || !employeeId) {
      toast.error('Please select both an asset and an employee');
      return;
    }
    try {
      await assignAsset({
        assetId,
        data: { employeeId, condition, remarks },
      });
      toast.success('Asset assigned successfully');
      navigate('/assets');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Assignment failed');
    }
  };

  const availableAssets = assets.filter((a) => !a.assignments?.some((asgn) => !asgn.returnedAt));

  return (
    <div className="max-w-xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-indigo-600" />
          Assign Asset
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hand over device custody to an employee with verified handover condition.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        {/* Asset Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Select Asset *
          </label>
          <select
            value={assetId}
            required
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-medium"
          >
            <option value="">-- Choose Available Asset --</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code}) {a.category ? `• ${a.category}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Assign To Employee *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name or code (e.g. EMP001)..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={employeeId}
            required
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-medium"
          >
            <option value="">-- Select Employee (UUID will be sent) --</option>
            {filteredEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                [{emp.employeeCode || 'EMP'}] {emp.firstName} {emp.lastName} {emp.department?.name ? `(${emp.department.name})` : ''}
              </option>
            ))}
          </select>

          {selectedEmployee && (
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs flex items-center justify-between text-indigo-300">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                Selected: {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeCode})
              </span>
              <span className="font-mono text-[10px] text-slate-400">ID: {selectedEmployee.id.slice(0, 8)}...</span>
            </div>
          )}
        </div>

        {/* Condition */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Condition at Handover
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
          >
            <option value="NEW">New</option>
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
          </select>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Charger, bag, serial number verified..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={isAssigning || !assetId || !employeeId}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </form>
    </div>
  );
}

export default AssignAssetPage;
