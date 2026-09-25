import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import Avatar from '../ui/Avatar';
import Dropdown, { DropdownItem, DropdownDivider } from '../ui/Dropdown';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';

export const UserDropdown = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <Dropdown
      align="right"
      width="w-56"
      trigger={
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Avatar name={user?.name || user?.email || 'User'} size="sm" status="online" />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
              {primaryRole.toLowerCase().replace('_', ' ')}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
        </div>
      }
    >
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
          {user?.name || 'Account'}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {user?.email}
        </p>
      </div>

      <div className="p-1">
        <DropdownItem icon={User} onClick={() => navigate('/profile')}>
          My Profile
        </DropdownItem>
        <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
          System Settings
        </DropdownItem>
        <DropdownItem icon={Shield} onClick={() => navigate('/profile/2fa')}>
          2FA Security
        </DropdownItem>
      </div>

      <DropdownDivider />

      <div className="p-1">
        <DropdownItem icon={LogOut} danger onClick={handleLogout}>
          Sign Out
        </DropdownItem>
      </div>
    </Dropdown>
  );
};

export default UserDropdown;
