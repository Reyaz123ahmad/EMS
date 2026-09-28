import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import Avatar from '../ui/Avatar';
import Dropdown, { DropdownItem, DropdownDivider } from '../ui/Dropdown';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const UserDropdown = () => {
  const { user, logout, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else if (clearAuth) {
        clearAuth();
      }
      toast.success('Logged out successfully');
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <Dropdown
      align="right"
      width="w-52"
      trigger={
        <div className="flex items-center gap-2 p-1 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#262626] cursor-pointer transition-colors">
          <Avatar
            src={user?.photoUrl || user?.employee?.photoUrl}
            name={user?.name || user?.email || 'User'}
            size="xs"
            className="w-7 h-7 rounded-full text-xs"
          />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-medium text-[#111827] dark:text-[#fafafa] truncate max-w-[110px]">
              {user?.name || (user?.employee ? `${user.employee.firstName || ''} ${user.employee.lastName || ''}`.trim() : '') || user?.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-[10px] text-[#6b7280] dark:text-[#a3a3a3] capitalize">
              {primaryRole.toLowerCase().replace('_', ' ')}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-[#9ca3af] hidden md:block" />
        </div>
      }
    >
      <div className="px-3 py-2 border-b border-[#e5e7eb] dark:border-[#262626]">
        <p className="text-xs font-medium text-[#111827] dark:text-[#fafafa] truncate">
          {user?.name || 'Account'}
        </p>
        <p className="text-[11px] text-[#6b7280] dark:text-[#a3a3a3] truncate">
          {user?.email}
        </p>
      </div>

      <div className="p-1">
        <DropdownItem icon={User} onClick={() => navigate('/profile')} className="text-xs py-1.5 rounded-md">
          My Profile
        </DropdownItem>
        <DropdownItem icon={Settings} onClick={() => navigate('/settings/general')} className="text-xs py-1.5 rounded-md">
          Settings
        </DropdownItem>
        <DropdownItem icon={Shield} onClick={() => navigate('/profile/2fa')} className="text-xs py-1.5 rounded-md">
          Security (2FA)
        </DropdownItem>
      </div>

      <DropdownDivider className="my-1 border-[#e5e7eb] dark:border-[#262626]" />

      <div className="p-1">
        <DropdownItem
          icon={LogOut}
          onClick={handleLogout}
          className="text-xs py-1.5 rounded-md text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a]"
        >
          Sign Out
        </DropdownItem>
      </div>
    </Dropdown>
  );
};

export default UserDropdown;
