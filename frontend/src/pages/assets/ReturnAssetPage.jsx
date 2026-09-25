import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useReturnAsset } from '../../hooks/useAssets.js';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function ReturnAssetPage() {
  const navigate = useNavigate();
  const { data: assets = [] } = useAssets();
  const { mutateAsync: returnAsset, isPending: isReturning } = useReturnAsset();

  const [assetId, setAssetId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [remarks, setRemarks] = useState('');

  const assignedAssets = assets.filter((a) => a.assignments?.some((asgn) => !asgn.returnedAt));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId) {
      toast.error('Please select an asset to return');
      return;
    }
    try {
      await returnAsset({
        assetId,
        data: { condition, remarks },
      });
      toast.success('Asset returned to inventory');
      navigate('/assets');
    } catch (err) {
      toast.error(err.message || 'Return failed');
    }
  };

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
          <RotateCcw className="h-6 w-6 text-emerald-600" />
          Process Asset Return
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Record return condition and release custody back to company pool.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Select Assigned Asset
          </label>
          <select
            value={assetId}
            required
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-medium"
          >
            <option value="">-- Choose Assigned Asset --</option>
            {assignedAssets.map((a) => {
              const active = a.assignments.find((asgn) => !asgn.returnedAt);
              return (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code}) - Assigned to {active?.employee?.firstName} {active?.employee?.lastName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Condition on Return
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
          >
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Inspection Notes
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Working state, scratches, accessories check..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={isReturning}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
        >
          {isReturning ? 'Processing...' : 'Confirm Return'}
        </button>
      </form>
    </div>
  );
}

export default ReturnAssetPage;
