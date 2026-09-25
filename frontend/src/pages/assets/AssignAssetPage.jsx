import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useAssignAsset } from '../../hooks/useAssets.js';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function AssignAssetPage() {
  const navigate = useNavigate();
  const { data: assets = [] } = useAssets({ isActive: true });
  const { mutateAsync: assignAsset, isPending: isAssigning } = useAssignAsset();

  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [remarks, setRemarks] = useState('');

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
      toast.error(err.message || 'Assignment failed');
    }
  };

  const availableAssets = assets.filter((a) => !a.assignments?.some((asgn) => !asgn.returnedAt));

  return (
    <div className="max-w-xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
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

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Select Asset
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
                {a.name} ({a.code}) - {a.category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Employee UUID / ID
          </label>
          <input
            type="text"
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter employee UUID or code"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono"
          />
        </div>

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
          disabled={isAssigning}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
        >
          {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </form>
    </div>
  );
}

export default AssignAssetPage;
