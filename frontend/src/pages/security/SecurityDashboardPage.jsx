import React from 'react';
import { useSecurityDashboard, useSecurityScore, useFraudSignals, useSecurityEvents } from '../../hooks/useAdvancedSecurity.js';
import SecurityScoreCard from '../../components/security/SecurityScoreCard.jsx';
import FraudSignalCard from '../../components/security/FraudSignalCard.jsx';
import SecurityEventCard from '../../components/security/SecurityEventCard.jsx';
import { ShieldAlert, Activity, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SecurityDashboardPage() {
  const { data: dashboard, isLoading: loadingDash } = useSecurityDashboard();
  const { data: scoreData } = useSecurityScore();
  const { data: signals = [] } = useFraudSignals({ limit: 4 });
  const { data: events = [] } = useSecurityEvents({ limit: 5 });

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Advanced Security Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric threat monitoring, AI liveness checks, and spoof prevention.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/security/fraud-signals"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            Review Signals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Score & Posture Metric */}
      <SecurityScoreCard
        score={scoreData?.score || dashboard?.securityScore || 92}
        level={dashboard?.level || 'HIGH'}
        totalSignals={signals.length}
        deviceTrustRate={dashboard?.deviceTrustRate || 99}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fraud Signals Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Recent Flagged Signals
            </h2>
            <Link to="/security/fraud-signals" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All ({signals.length})
            </Link>
          </div>

          {signals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-400">
              No active fraud signals detected. All biometric punches verified.
            </div>
          ) : (
            <div className="space-y-3">
              {signals.slice(0, 3).map((sig) => (
                <FraudSignalCard key={sig.id} signal={sig} />
              ))}
            </div>
          )}
        </div>

        {/* Security Audit Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Live Security Stream
            </h2>
            <Link to="/security/events" className="text-xs font-semibold text-indigo-600 hover:underline">
              Events Log
            </Link>
          </div>

          <div className="space-y-2.5">
            {events.slice(0, 5).map((evt, idx) => (
              <SecurityEventCard key={evt.id || idx} event={evt} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboardPage;
