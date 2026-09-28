import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'increase', // 'increase' | 'decrease' | 'neutral'
  changePeriod = 'vs last month',
  variant = 'indigo',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717] p-4 transition-colors hover:border-[#d1d5db] dark:hover:border-[#404040] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280] dark:text-[#a3a3a3]">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-[#f3f4f6] dark:bg-[#262626] flex items-center justify-center text-[#374151] dark:text-[#d1d5db]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="text-2xl font-semibold tracking-tight text-[#111827] dark:text-[#fafafa]">
          {value}
        </div>

        {change !== undefined && change !== null && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                changeType === 'increase'
                  ? 'text-[#10b981]'
                  : changeType === 'decrease'
                  ? 'text-[#ef4444]'
                  : 'text-[#6b7280]'
              }`}
            >
              {changeType === 'increase' && <TrendingUp className="w-3 h-3" />}
              {changeType === 'decrease' && <TrendingDown className="w-3 h-3" />}
              {changeType === 'neutral' && <Minus className="w-3 h-3" />}
              {change}
            </span>
            <span className="text-[#9ca3af] dark:text-[#737373]">{changePeriod}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
