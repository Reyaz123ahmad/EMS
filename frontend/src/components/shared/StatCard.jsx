import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  isIncreasePositive = true,
  variant = 'indigo',
  subtitle,
}) => {
  const variantStyles = {
    indigo: {
      bg: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    amber: {
      bg: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    rose: {
      bg: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400',
      iconBg: 'bg-rose-500/20 text-rose-400',
    },
    cyan: {
      bg: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-400',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.indigo;
  const isPositive = typeof change === 'number' ? change >= 0 : false;
  const isGood = isIncreasePositive ? isPositive : !isPositive;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-[1.02] ${style.bg}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-black font-mono tracking-tight text-white">
          {value}
        </span>

        {change !== undefined && change !== null && (
          <div
            className={`flex items-center text-xs font-bold ${
              isGood ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
      )}
    </div>
  );
};
