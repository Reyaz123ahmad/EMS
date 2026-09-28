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
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex w-full h-8 items-center justify-between gap-2.5 px-2.5 rounded-md text-[13px] font-medium transition-colors ${
            isChildActive
              ? 'bg-[#eff6ff] text-[#3b82f6] dark:bg-[#1e293b] dark:text-[#60a5fa]'
              : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] dark:text-[#a3a3a3] dark:hover:text-[#fafafa] dark:hover:bg-[#262626]'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            {!collapsed && <span className="truncate">{label}</span>}
          </div>
          {!collapsed && (
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-[#3b82f6] dark:text-[#60a5fa]' : 'text-[#9ca3af]'
              }`}
            />
          )}
        </button>

        {isOpen && !collapsed && (
          <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-[#e5e7eb] dark:border-[#262626] ml-4 animate-in fade-in-0 duration-100">
            {children.map((child, index) => (
              <NavLink
                key={index}
                to={child.to}
                className={({ isActive }) =>
                  `flex h-7 items-center justify-between px-2.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-[#3b82f6] bg-[#eff6ff] dark:text-[#60a5fa] dark:bg-[#1e293b]'
                      : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] dark:text-[#a3a3a3] dark:hover:text-[#fafafa] dark:hover:bg-[#262626]'
                  }`
                }
              >
                <span>{child.label}</span>
                {child.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5e7eb] dark:bg-[#262626] text-[#374151] dark:text-[#d1d5db]">
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
        `flex h-8 items-center justify-between gap-2.5 px-2.5 rounded-md text-[13px] font-medium transition-colors ${
          isActive
            ? 'bg-[#eff6ff] text-[#3b82f6] dark:bg-[#1e293b] dark:text-[#60a5fa]'
            : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] dark:text-[#a3a3a3] dark:hover:text-[#fafafa] dark:hover:bg-[#262626]'
        }`
      }
    >
      <div className="flex items-center gap-2.5 truncate">
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && badge && (
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            badgeVariant === 'danger'
              ? 'bg-[#fee2e2] text-[#dc2626] dark:bg-[#450a0a] dark:text-[#f87171]'
              : 'bg-[#eff6ff] text-[#2563eb] dark:bg-[#172554] dark:text-[#93c5fd]'
          }`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export default SidebarMenuItem;
