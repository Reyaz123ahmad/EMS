import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export const SidebarMenuItem = ({
  icon: Icon,
  label,
  to,
  badge,
  badgeVariant = 'primary',
  children,
  collapsed = false
}) => {
  const location = useLocation();
  const hasChildren = Array.isArray(children) && children.length > 0;
  const isChildActive = hasChildren && children.some((c) => location.pathname === c.to);
  const [isOpen, setIsOpen] = useState(isChildActive);

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
            isChildActive
              ? 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            {!collapsed && <span className="truncate">{label}</span>}
          </div>
          {!collapsed && (
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
              }`}
            />
          )}
        </button>

        {isOpen && !collapsed && (
          <div className="pl-7 pr-1 py-1 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-5 animate-in fade-in-0 duration-150">
            {children.map((child, index) => (
              <NavLink
                key={index}
                to={child.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/50 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'
                  }`
                }
              >
                <span>{child.label}</span>
                {child.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {child.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
        }`
      }
    >
      <div className="flex items-center gap-3 truncate">
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && badge && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            badgeVariant === 'danger'
              ? 'bg-rose-500 text-white'
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
          }`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export default SidebarMenuItem;
