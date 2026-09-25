import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Settings,
  Building,
  CalendarCheck,
  ShieldCheck,
  Calendar,
  DollarSign,
  Bell
} from 'lucide-react';

export const SettingsLayout = () => {
  const tabs = [
    { label: 'General & Branding', to: '/settings/general', icon: Building },
    { label: 'Attendance & Shifts', to: '/settings/attendance', icon: CalendarCheck },
    { label: 'Zero-Trust Security', to: '/settings/security', icon: ShieldCheck },
    { label: 'Leave & Holidays', to: '/settings/leave', icon: Calendar },
    { label: 'Payroll & CTC', to: '/settings/payroll', icon: DollarSign },
    { label: 'Notifications', to: '/settings/notifications', icon: Bell }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Enterprise System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure company rules, biometric policies, shift rosters, leave schemes, and alert preferences.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md shadow-sm no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Settings Subpage Content */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout;
