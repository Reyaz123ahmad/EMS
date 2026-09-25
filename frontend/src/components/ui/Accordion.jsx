import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Accordion = ({
  items = [],
  allowMultiple = false,
  className = ''
}) => {
  const [openIndexes, setOpenIndexes] = useState([0]);

  const toggleIndex = (index) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        return (
          <div key={index} className="transition-colors">
            <button
              type="button"
              onClick={() => toggleIndex(index)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-3">
                {item.icon && <item.icon className="w-5 h-5 text-indigo-500" />}
                <span className="text-sm font-semibold">{item.title}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-indigo-500' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40 animate-in fade-in-0 duration-200">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
