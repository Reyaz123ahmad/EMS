import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'increase', // 'increase' | 'decrease' | 'neutral'
  changePeriod = 'vs last month',
  variant = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'
  onClick
}) => {
  const variantStyles = {
    indigo: {
      bg: 'bg-indigo-50/70 dark:bg-indigo-950/30',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-800'
    },
    emerald: {
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-800'
    },
    amber: {
      bg: 'bg-amber-50/70 dark:bg-amber-950/30',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
      border: 'hover:border-amber-300 dark:hover:border-amber-800'
    },
    rose: {
      bg: 'bg-rose-50/70 dark:bg-rose-950/30',
      iconBg: 'bg-rose-600 text-white shadow-rose-500/20',
      border: 'hover:border-rose-300 dark:hover:border-rose-800'
    },
    sky: {
      bg: 'bg-sky-50/70 dark:bg-sky-950/30',
      iconBg: 'bg-sky-600 text-white shadow-sky-500/20',
      border: 'hover:border-sky-300 dark:hover:border-sky-800'
    },
    violet: {
      bg: 'bg-violet-50/70 dark:bg-violet-950/30',
      iconBg: 'bg-violet-600 text-white shadow-violet-500/20',
      border: 'hover:border-violet-300 dark:hover:border-violet-800'
    }
  };

  const style = variantStyles[variant] || variantStyles.indigo;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-200 hover:shadow-md ${style.border} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </h3>

        {change !== undefined && change !== null && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                changeType === 'increase'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : changeType === 'decrease'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {changeType === 'increase' && <TrendingUp className="w-3.5 h-3.5" />}
              {changeType === 'decrease' && <TrendingDown className="w-3.5 h-3.5" />}
              {changeType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {change}
            </span>
            <span className="text-slate-400 dark:text-slate-500">{changePeriod}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
