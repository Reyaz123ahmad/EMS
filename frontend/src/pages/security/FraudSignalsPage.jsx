import React, { useState } from 'react';
import { useFraudSignals, useReviewFraudSignal } from '../../hooks/useAdvancedSecurity.js';
import FraudSignalCard from '../../components/security/FraudSignalCard.jsx';
import FraudReviewModal from '../../components/security/FraudReviewModal.jsx';
import { ShieldAlert, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function FraudSignalsPage() {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedSignal, setSelectedSignal] = useState(null);

  const { data: signals = [], isLoading } = useFraudSignals(
    severityFilter !== 'ALL' ? { severity: severityFilter } : {}
  );
  const { mutateAsync: reviewSignal, isPending: isSubmitting } = useReviewFraudSignal();

  const handleAction = async (action, notes) => {
    try {
      await reviewSignal({
        signalId: selectedSignal.id,
        data: { action, notes },
      });
      toast.success(`Signal marked as ${action.toLowerCase()}`);
      setSelectedSignal(null);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Fraud & Spoof Signals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review suspicious biometric punches, simulated coordinates, and device tampering flags.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <ShieldAlert className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Flagged Signals</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All facial recognition attendance requests and device attestation tokens are clean.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((sig) => (
            <FraudSignalCard key={sig.id} signal={sig} onReview={(s) => setSelectedSignal(s)} />
          ))}
        </div>
      )}

      <FraudReviewModal
        signal={selectedSignal}
        isOpen={Boolean(selectedSignal)}
        onClose={() => setSelectedSignal(null)}
        onAction={handleAction}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default FraudSignalsPage;
