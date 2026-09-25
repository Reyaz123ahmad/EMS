import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import dayjs from 'dayjs';

const PRESETS = [
  { label: 'Today', key: 'today', getRange: () => [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { label: 'Yesterday', key: 'yesterday', getRange: () => [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), dayjs().subtract(1, 'day').format('YYYY-MM-DD')] },
  { label: 'Last 7 Days', key: 'last7', getRange: () => [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { label: 'Last 30 Days', key: 'last30', getRange: () => [dayjs().subtract(29, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { label: 'This Month', key: 'thisMonth', getRange: () => [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().endOf('month').format('YYYY-MM-DD')] },
  { label: 'Last Month', key: 'lastMonth', getRange: () => [dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')] },
];

export const DateRangePicker = ({ onApply, initialRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('thisMonth');
  const [startDate, setStartDate] = useState(initialRange?.startDate || dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(initialRange?.endDate || dayjs().endOf('month').format('YYYY-MM-DD'));

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.key);
    const [start, end] = preset.getRange();
    setStartDate(start);
    setEndDate(end);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({ startDate, endDate, preset: selectedPreset });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-slate-200 shadow-sm hover:border-slate-600 hover:bg-slate-800 transition-all"
      >
        <CalendarIcon className="h-4 w-4 text-indigo-400" />
        <span>
          {dayjs(startDate).format('MMM D, YYYY')} – {dayjs(endDate).format('MMM D, YYYY')}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/50">
          <div className="mb-3 flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedPreset === p.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
