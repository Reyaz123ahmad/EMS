import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function FaceMatchResult({ result, onRetry }) {
  if (!result) return null;

  const { matched, score, threshold = 0.85, matchPercentage, employee } = result;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center text-center">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          matched
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}
      >
        {matched ? <CheckCircle2 className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
      </div>

      <h3 className="text-xl font-bold text-white mb-1">
        {matched ? 'Face Verified Successfully' : 'Face Verification Failed'}
      </h3>

      <p className="text-xs text-slate-400 mb-6">
        {matched
          ? `Biometric identity confirmed for ${employee?.name || 'employee'}.`
          : 'Facial signature does not match enrolled master biometric profile.'}
      </p>

      {/* Match Score Gauge */}
      <div className="w-full bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 mb-6 text-left">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Similarity Score</span>
          <span className={`text-sm font-bold ${matched ? 'text-emerald-400' : 'text-rose-400'}`}>
            {matchPercentage || `${Math.round(score * 100)}%`}
          </span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${matched ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(100, Math.round(score * 100))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
          <span>Required Threshold: {Math.round(threshold * 100)}%</span>
          <span>512-Dim Cosine Vector</span>
        </div>
      </div>

      {onRetry && !matched && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
