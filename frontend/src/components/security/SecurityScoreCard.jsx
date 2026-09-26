import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export function SecurityScoreCard({ score = 100, level = 'OPTIMAL', totalSignals = 0, deviceTrustRate = 100 }) {
  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500';
    if (val >= 60) return 'text-amber-600 dark:text-amber-400 border-amber-500';
    return 'text-rose-600 dark:text-rose-400 border-rose-500';
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div
          className={`h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center font-black text-2xl shadow-inner ${getScoreColor(
            score
          )}`}
        >
          <span>{score}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Security Posture</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              {level} Tier
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Zero-Trust biometric posture computed from AI liveness, attestation token integrity, and spoof rejection.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
        <div className="text-center">
          <span className="text-xl font-bold text-slate-900 dark:text-white">{deviceTrustRate}%</span>
          <p className="text-xs text-slate-400">Device Trust</p>
        </div>
        <div className="text-center">
          <span className="text-xl font-bold text-slate-900 dark:text-white">{totalSignals}</span>
          <p className="text-xs text-slate-400">Fraud Signals</p>
        </div>
      </div>
    </div>
  );
}

export default SecurityScoreCard;
