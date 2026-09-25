import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Check,
  Eye,
  RefreshCw,
  MapPin,
  Smartphone,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useFraudSignals, useReviewFraudSignal } from '../../hooks/useAttendance';

export const FraudSignalsPage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    severity: '',
    status: '',
    search: '',
  });

  const [selectedSignal, setSelectedSignal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('RESOLVED');

  const { data: signalsResponse, isLoading, refetch } = useFraudSignals(filters);
  const reviewMutation = useReviewFraudSignal();

  const signals = signalsResponse?.data?.signals || [];
  const pagination = signalsResponse?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleReviewSubmit = async () => {
    if (!selectedSignal) return;

    try {
      await reviewMutation.mutateAsync({
        id: selectedSignal.id,
        data: {
          status: reviewStatus,
          reviewNotes: reviewNotes || 'Reviewed by Security Compliance Officer',
        },
      });
      toast.success('Fraud signal review recorded');
      setSelectedSignal(null);
      setReviewNotes('');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="h-4 w-4" />
            <span>Biometric Security Incident Desk</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Fraud & Security Anomaly Signals
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Automated tamper alerts: Mock locations, GPS radius breaches, liveness failures, and biometric spoofing
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <select
            value={filters.severity}
            onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value, page: 1 }))}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved / Cleared</option>
            <option value="FLAGGED">Confirmed Violation</option>
          </select>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
              <span>Scanning tamper logs and telemetry...</span>
            </div>
          </div>
        ) : signals.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 opacity-80" />
            <h3 className="mt-3 text-base font-bold text-slate-200">Zero Security Anomalies</h3>
            <p className="mt-1 text-xs text-slate-400">
              No active spoofing attempts, geofence violations, or biometric tamper events recorded.
            </p>
          </div>
        ) : (
          signals.map((sig) => (
            <div
              key={sig.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl transition-all hover:border-slate-700 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{sig.signalType}</span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getSeverityBadge(
                        sig.severity
                      )}`}
                    >
                      {sig.severity}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                      {sig.status}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-300">{sig.description}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span>Target: {sig.employee?.firstName || sig.employeeId?.slice(0, 8)}</span>
                    <span>•</span>
                    <span>Logged: {dayjs(sig.createdAt).format('MMM DD, YYYY HH:mm:ss')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSignal(sig)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Inspect & Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Security Incident Audit</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSignal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="text-slate-400">Signal Type:</div>
                <div className="font-bold text-rose-400 font-mono text-sm">{selectedSignal.signalType}</div>
                <div className="text-slate-400 mt-2">Description:</div>
                <div className="text-slate-200">{selectedSignal.description}</div>
              </div>

              {selectedSignal.metadata && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                  <div className="text-slate-400 font-semibold mb-1">Incident Telemetry:</div>
                  <pre className="text-[11px] font-mono text-indigo-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(selectedSignal.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">
                  Audit Determination
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="RESOLVED">Resolved (False Positive / Authorized Exception)</option>
                  <option value="FLAGGED">Confirmed Fraudulent Violation (Mark Breach)</option>
                  <option value="INVESTIGATING">Under Active Investigation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">
                  Reviewer Notes / Evidence Log
                </label>
                <textarea
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="State investigation findings or reason for clearance..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSignal(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reviewMutation.isPending}
                  onClick={handleReviewSubmit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {reviewMutation.isPending ? 'Submitting Audit...' : 'Submit Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FraudSignalsPage;
