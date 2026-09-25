import React, { useState } from 'react';
import { Menu, Search, Sun, Moon, Sparkles } from 'lucide-react';
import NotificationBell from '../dashboard/NotificationBell';
import UserDropdown from '../dashboard/UserDropdown';
import Badge from '../ui/Badge';

export const Header = ({ setMobileOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 sm:px-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 transition-colors">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees, punch logs, leaves... (⌘K)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:bg-slate-900 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right: Status, Theme, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          <Badge variant="success" size="sm" dot>
            Enterprise Active
          </Badge>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
};

export default Header;
