import React from 'react';
import { useAIUsageStats } from '../../hooks/useAI';
import { Sparkles, Zap, Clock, ShieldCheck } from 'lucide-react';

export const AIUsageQuotaWidget = ({ className = '' }) => {
  const { data, isLoading } = useAIUsageStats();

  if (isLoading) {
    return (
      <div className={`p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  const dailyUsed = data?.rateLimiting?.dayCount || data?.todayRequests || 0;
  const dailyLimit = data?.dailyLimit || 1500;
  const dailyPct = Math.min(100, Math.round((dailyUsed / dailyLimit) * 100));

  const minUsed = data?.rateLimiting?.minCount || 0;
  const minLimit = data?.minuteLimit || 15;
  const minPct = Math.min(100, Math.round((minUsed / minLimit) * 100));

  return (
    <div className={`p-5 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-indigo-500/20 rounded-2xl shadow-xl backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Google Gemini AI Engine
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                Free Tier
              </span>
            </h4>
            <p className="text-xs text-slate-400">24-Hour Smart Caching Active</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-indigo-300 font-mono bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-800/40">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>₹0.00 / mo</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        {/* Daily Quota */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Daily Quota
            </span>
            <span className="text-slate-200 font-mono">{dailyUsed} / {dailyLimit}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                dailyPct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              }`}
              style={{ width: `${dailyPct}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400">{dailyLimit - dailyUsed} calls remaining today</p>
        </div>

        {/* Per Minute Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Burst Limit
            </span>
            <span className="text-slate-200 font-mono">{minUsed} / {minLimit} rpm</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                minPct > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
              }`}
              style={{ width: `${minPct}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400">{minLimit - minUsed} requests left this min</p>
        </div>
      </div>
    </div>
  );
};

export default AIUsageQuotaWidget;
