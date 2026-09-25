import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import useSocketEvent from '../../hooks/useSocket';

export const NotificationToast = () => {
  // Global toast container listener component
  return null;
};

export const showNotificationToast = (notification) => {
  const getIcon = (type) => {
    switch (type) {
      case 'SECURITY':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'APPROVAL':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'ATTENDANCE':
      case 'LEAVE':
      case 'PAYROLL':
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  toast(notification.title || 'Notification', {
    description: notification.body,
    icon: getIcon(notification.type),
    duration: notification.priority === 'URGENT' ? 10000 : 5000
  });
};

export default NotificationToast;
