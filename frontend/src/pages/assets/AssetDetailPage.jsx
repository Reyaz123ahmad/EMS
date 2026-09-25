import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsset, useAssignAsset, useReturnAsset } from '../../hooks/useAssets.js';
import AssetAssignmentModal from '../../components/assets/AssetAssignmentModal.jsx';
import AssetReturnModal from '../../components/assets/AssetReturnModal.jsx';
import { ArrowLeft, Laptop, UserCheck, History, UserPlus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id);
  const { mutateAsync: assignAsset, isPending: isAssigning } = useAssignAsset();
  const { mutateAsync: returnAsset, isPending: isReturning } = useReturnAsset();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const handleAssign = async (assetId, data) => {
    try {
      await assignAsset({ assetId, data });
      toast.success('Asset assigned successfully');
      setShowAssignModal(false);
    } catch (err) {
      toast.error(err.message || 'Assignment failed');
    }
  };

  const handleReturn = async (assetId, data) => {
    try {
      await returnAsset({ assetId, data });
      toast.success('Asset returned successfully');
      setShowReturnModal(false);
    } catch (err) {
      toast.error(err.message || 'Return failed');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading asset details...</div>;
  }

  if (!asset) {
    return <div className="p-8 text-center text-sm text-slate-400">Asset not found.</div>;
  }

  const isAssigned = asset.assignments?.some((a) => !a.returnedAt);
  const activeAssignment = isAssigned ? asset.assignments.find((a) => !a.returnedAt) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </button>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Laptop className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{asset.name}</h1>
              <p className="text-xs font-mono text-slate-400">Tag: {asset.code} • Category: {asset.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAssigned ? (
              <button
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> Process Return
              </button>
            ) : (
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
              >
                <UserPlus className="h-4 w-4" /> Assign to Employee
              </button>
            )}
          </div>
        </div>

        {/* Current Custody Card */}
        {activeAssignment && (
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-600" />
              <span>
                Currently assigned to <strong>{activeAssignment.employee?.firstName} {activeAssignment.employee?.lastName}</strong> ({activeAssignment.employee?.employeeCode})
              </span>
            </div>
            <span className="text-slate-400">Since {new Date(activeAssignment.assignedAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Assignment History Log */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" /> Custody History
          </h3>

          {(!asset.assignments || asset.assignments.length === 0) ? (
            <p className="text-xs text-slate-400">No previous assignment records.</p>
          ) : (
            <div className="space-y-2">
              {asset.assignments.map((asgn) => (
                <div key={asgn.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {asgn.employee?.firstName} {asgn.employee?.lastName}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assigned: {new Date(asgn.assignedAt).toLocaleDateString()}
                      {asgn.returnedAt ? ` • Returned: ${new Date(asgn.returnedAt).toLocaleDateString()}` : ' • Active'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {asgn.condition || 'GOOD'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AssetAssignmentModal
        asset={asset}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssign}
        isAssigning={isAssigning}
      />

      <AssetReturnModal
        asset={asset}
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onReturn={handleReturn}
        isReturning={isReturning}
      />
    </div>
  );
}

export default AssetDetailPage;
