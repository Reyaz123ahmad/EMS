import React, { useState } from 'react';
import { cn } from '../../lib/utils.js';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className,
  tabListClassName,
  children
}) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || '');
  const currentTab = activeTab !== undefined ? activeTab : internalActive;

  const handleTabChange = (tabId) => {
    if (activeTab === undefined) {
      setInternalActive(tabId);
    }
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div className={cn('w-full flex flex-col space-y-6', className)}>
      {/* Tab Navigation List */}
      <div className={cn('flex items-center gap-2 overflow-x-auto border-b border-slate-800/80 pb-px scrollbar-none', tabListClassName)}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'group relative flex items-center gap-2.5 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none',
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-lg'
              )}
            >
              {tab.icon && (
                <span className={cn('text-base transition-colors', isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200')}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              )}

              {/* Active Underline Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="w-full">
        {typeof children === 'function' ? children(currentTab) : children}
      </div>
    </div>
  );
}

export default Tabs;
