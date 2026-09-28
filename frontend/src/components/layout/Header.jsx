import React, { useState } from 'react';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import NotificationBell from '../dashboard/NotificationBell.jsx';
import UserDropdown from '../dashboard/UserDropdown.jsx';
import { useThemeStore } from '../../store/theme.store.js';

export const Header = ({ setMobileOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 transition-colors">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-md text-[#6b7280] hover:text-[#111827] dark:text-[#a3a3a3] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#262626] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full max-w-[320px] hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search... (⌘K)"
            className="w-full h-8 rounded-md border border-[#e5e7eb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] pl-8 pr-3 text-[13px] text-[#111827] dark:text-[#fafafa] placeholder-[#9ca3af] focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#171717] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-colors"
          />
        </div>
      </div>

      {/* Right: Theme Toggle, Notifications & User Profile */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-md text-[#6b7280] hover:text-[#111827] dark:text-[#a3a3a3] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#262626] transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        <div className="h-4 w-px bg-[#e5e7eb] dark:bg-[#262626] mx-1 hidden sm:block" />

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
};

export default Header;
